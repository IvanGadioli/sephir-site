#!/usr/bin/env node
// `verificar:visual` — W10, informativo (04_plano.md, Tarefa 12).
//
// Contrato OPOSTO ao de `verificar`: SAI 0 SEMPRE, em qualquer circunstância.
// W10 compara a origem local contra `Main.dc.html` e `Mobile.dc.html`,
// artefatos de design que nunca passaram por portão nenhum, e que o design
// ainda itera a cada ciclo. Um critério não fechado que reprova CI é ruído:
// reprovaria implementação correta porque o alvo mudou embaixo dela. Este
// comando imprime o desvio medido e sai 0 — informação, não bloqueio.
//
// Mede fração de pixels divergentes por artboard (`includeAA:false`), com
// 0,5% como referência impressa, nunca como critério de saída.
import { existsSync, accessSync, constants as fsConstants } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { criarServidor } from '../tests/support/servidor-estatico.mjs';

const PORTA = 4179; // porta própria: não disputa a 4173 do `verificar`
const REFERENCIA = 0.005; // 0,5% — referência, não critério

const ARTBOARDS_PADRAO = join(
  homedir(),
  'vaults/sephir-site-workspace/sistemas/02_superficie/design',
);
const artboardsDir = process.env.ARTBOARDS || ARTBOARDS_PADRAO;

// arquivo do design + rota da origem local + viewport (canvas.json, mesmo diretório)
const ARTBOARDS = [
  { arquivo: 'Main.dc.html', rota: '/pt/', largura: 1920, altura: 3620 },
  { arquivo: 'Mobile.dc.html', rota: '/pt/', largura: 390, altura: 1220 },
];

async function tirarPng(page, url, largura, altura) {
  await page.setViewportSize({ width: largura, height: altura });
  await page.goto(url, { waitUntil: 'load' });
  const buffer = await page.screenshot({ fullPage: true });
  return PNG.sync.read(buffer);
}

// pixelmatch exige as duas imagens do mesmo tamanho; o design e a origem
// local raramente batem pixel a pixel de altura, então recorta ambas para a
// interseção antes de comparar.
function recortarParaInterseccao(a, b) {
  const largura = Math.min(a.width, b.width);
  const altura = Math.min(a.height, b.height);
  const recorte = (img) => {
    const saida = new PNG({ width: largura, height: altura });
    PNG.bitblt(img, saida, 0, 0, largura, altura, 0, 0);
    return saida;
  };
  return { largura, altura, a: recorte(a), b: recorte(b) };
}

async function medir() {
  if (!existsSync(artboardsDir)) {
    console.log('não medido: artboards ausentes');
    return;
  }
  if (!existsSync('out')) {
    console.log('não medido: out/ ausente (rode npm run build)');
    return;
  }

  const chromePath = process.env.CHROME_PATH;
  try {
    accessSync(chromePath, fsConstants.X_OK);
  } catch {
    console.log('não medido: ambiente incompleto (CHROME_PATH ausente)');
    return;
  }

  let origem;
  let browser;
  try {
    origem = await criarServidor({ raiz: 'out', porta: PORTA });
    browser = await chromium.launch({ executablePath: chromePath });
    const page = await (await browser.newContext()).newPage();

    console.log(`W10 — comparação visual, informativo (referência ${REFERENCIA * 100}%, nunca bloqueante)`);
    for (const artboard of ARTBOARDS) {
      const caminho = join(artboardsDir, artboard.arquivo);
      if (!existsSync(caminho)) {
        console.log(`  ${artboard.arquivo}: não medido, arquivo ausente`);
        continue;
      }
      const site = await tirarPng(
        page,
        `${origem.url}${artboard.rota}`,
        artboard.largura,
        artboard.altura,
      );
      const design = await tirarPng(page, `file://${caminho}`, artboard.largura, artboard.altura);
      const { largura, altura, a, b } = recortarParaInterseccao(site, design);
      const diff = new PNG({ width: largura, height: altura });
      const pixeisDivergentes = pixelmatch(a.data, b.data, diff.data, largura, altura, {
        includeAA: false,
      });
      const fracao = pixeisDivergentes / (largura * altura);
      console.log(
        `  ${artboard.arquivo}: desvio ${(fracao * 100).toFixed(2)}% dos pixels` +
          ` (referência ${REFERENCIA * 100}%, medido em ${largura}x${altura})`,
      );
    }
  } catch (err) {
    console.log(`não medido: erro ao medir (${err?.message ?? err})`);
  } finally {
    await browser?.close();
    await origem?.fechar();
  }
}

await medir();
console.log('W10 é referência, não critério — não bloqueia a rodada nem falseia comportamento.');
process.exit(0);
