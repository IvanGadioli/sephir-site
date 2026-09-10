#!/usr/bin/env node
// `verificar` — o contrato de comando do portão 06 (04_plano.md, Tarefa 11).
// NÃO builda: lê `out/` pronta. Sobe a origem local em 4173, roda todos os
// `medirW*` que já existem, agrega, imprime sempre o bloco do que não mediu,
// e sai com um dos quatro códigos:
//   0 tudo que foi medido passou · 1 comportamento falseado
//   2 out/ ausente               · 3 ambiente incompleto
// A distinção 1 vs 3 é o ponto: falha de ambiente reportada como
// comportamento falseado treina a ignorar o vermelho.
import { existsSync, accessSync, constants as fsConstants } from 'node:fs';
import { chromium } from '@playwright/test';
import { criarServidor } from '../tests/support/servidor-estatico.mjs';
import { ROTAS } from '../lib/rotas.ts';
import { medirW1 } from './oraculos/w1-rotas.mjs';
import { medirW2 } from './oraculos/w2-links.mjs';
import { medirW3W4 } from './oraculos/w3w4-carga.mjs';
import { medirW5 } from './oraculos/w5-axe.mjs';
import { medirW8 } from './oraculos/w8-prefixo.mjs';
import { medirW9 } from './oraculos/w9-cores.mjs';
import { medirW11 } from './oraculos/w11-fontes.mjs';
import { imprimirNaoMedidos } from './nao-medidos.mjs';

const PORTA = 4173;

function sair(codigo) {
  imprimirNaoMedidos();
  process.exit(codigo);
}

if (!existsSync('out')) {
  console.error('out/ ausente: rode npm run build');
  sair(2);
}

const chromePath = process.env.CHROME_PATH;
let chromeExecutavel = false;
if (chromePath) {
  try {
    accessSync(chromePath, fsConstants.X_OK);
    chromeExecutavel = true;
  } catch {
    chromeExecutavel = false;
  }
}
if (!chromeExecutavel) {
  console.error('ambiente: CHROME_PATH ausente');
  sair(3);
}

let origem;
try {
  origem = await criarServidor({ raiz: 'out', porta: PORTA });
} catch (err) {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`ambiente: porta ${PORTA} ocupada`);
    sair(3);
  }
  throw err;
}

let browser;
const resultados = [];
try {
  browser = await chromium.launch({ executablePath: chromePath });
  const contexto = await browser.newContext({ baseURL: origem.url });
  const page = await contexto.newPage();
  const rotas = [...ROTAS.map((r) => r.rota), '/404.html'];
  resultados.push({ nome: 'W1 rotas', ...(await medirW1({ raiz: 'out', url: origem.url })) });
  resultados.push({ nome: 'W2 links', ...(await medirW2({ raiz: 'out' })) });
  resultados.push({
    nome: 'W8 prefixo',
    ...medirW8({ raizOut: 'out', raizSentinela: 'out-sentinela' }),
  });
  resultados.push({ nome: 'W5 axe', ...(await medirW5({ page, rotas })) });
  resultados.push({ nome: 'W9 cores', ...(await medirW9({ page, rotas })) });
  resultados.push({ nome: 'W11 fontes', ...(await medirW11({ page, rotas })) });
  // O navegador do playwright fecha ANTES do Lighthouse subir o dele. Os dois
  // vivos ao mesmo tempo, somados ao navegador de mesa do usuário, fazem o
  // systemd-oomd derrubar o processo com SIGKILL — e um verificar morto não
  // reporta nada, nem 1, nem 3. Fechar aqui não custa nada: W3W4 usa o Chromium
  // do Lighthouse, nunca esta instância.
  await browser.close();
  browser = undefined;

  resultados.push({
    nome: 'W3W4 carga',
    ...(await medirW3W4({ url: origem.url, rota: '/pt/' })),
  });
} finally {
  await browser?.close();
  await origem.fechar();
}

const falhaAmbiente = resultados.find((r) => r.codigo === 3);
if (falhaAmbiente) {
  for (const v of falhaAmbiente.violacoes) console.error(v);
  sair(3);
}

const violacoesTotais = resultados.flatMap((r) => r.violacoes.map((v) => `${r.nome}: ${v}`));
for (const v of violacoesTotais) console.error(v);
if (violacoesTotais.length === 0) {
  console.log('tudo que foi medido passou');
}

sair(violacoesTotais.length === 0 ? 0 : 1);
