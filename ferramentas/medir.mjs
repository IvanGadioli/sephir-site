import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// brotli, e não gzip: é o que o Cloudflare Pages entrega ao visitante. Medir
// gzip seria medir um número que ninguém baixa.
/** @param {string} caminho @returns {number} bytes depois do brotli -q 11 */
export function brotli(caminho) {
  return execFileSync('brotli', ['-q', '11', '-c', caminho], {
    maxBuffer: 64 * 1024 * 1024,
  }).length;
}

/**
 * @param {string} raiz
 * @param {string} rota caminho do HTML relativo a `raiz`
 */
export function medirRota(raiz, rota) {
  const documento = join(raiz, rota);
  if (!existsSync(documento)) throw new Error(`ausente: ${documento}`);
  const html = readFileSync(documento, 'utf8');
  const refs = [...new Set([...html.matchAll(/\/_next\/static\/[^"']+\.(?:js|css)/g)].map((m) => m[0]))];

  let css = 0;
  let js = 0;
  for (const ref of refs) {
    const arquivo = join(raiz, ref.replace(/^\//, ''));
    if (!existsSync(arquivo)) continue;
    const bytes = brotli(arquivo);
    if (ref.endsWith('.css')) css += bytes;
    else js += bytes;
  }

  const doc = brotli(documento);
  return { rota, documento: doc, css, js, total: doc + css + js };
}

// O chunk do herói é o que NÃO aparece em toda rota: as rotas sem herói
// carregam o piso de framework, a home carrega o piso mais o herói. A
// diferença é o custo real do canvas.
/** @param {string} raiz */
export function medirHeroi(raiz) {
  const home = medirRota(raiz, 'pt/index.html');
  const sobre = medirRota(raiz, 'pt/sobre/index.html');
  return home.js + home.css - (sobre.js + sobre.css);
}

// Caminho alternativo, usado só se `medirHeroi` (por diferença) medir ~0: soma
// direto o brotli dos chunks que aparecem em pt/index.html e NÃO aparecem em
// pt/sobre/index.html. Se o Next puser o canvas num chunk compartilhado por
// toda rota, nem esta função acha nada exclusivo — e isso também é achado.
/** @param {string} raiz */
export function medirHeroiPorChunk(raiz) {
  /** @param {string} rota */
  const refs = (rota) => {
    const html = readFileSync(join(raiz, rota), 'utf8');
    return new Set([...html.matchAll(/\/_next\/static\/[^"']+\.(?:js|css)/g)].map((m) => m[0]));
  };
  const daHome = refs('pt/index.html');
  const deSobre = refs('pt/sobre/index.html');
  let total = 0;
  for (const ref of daHome) {
    if (deSobre.has(ref)) continue;
    const arquivo = join(raiz, ref.replace(/^\//, ''));
    if (existsSync(arquivo)) total += brotli(arquivo);
  }
  return total;
}

// Terceiro método, acrescentado depois que o piso reprovou nos dois de cima.
// `medirRota` e `medirHeroiPorChunk` só leem `/_next/static/...` de dentro do
// HTML exportado — e o HTML não vê import dinâmico. `next/dynamic(() =>
// import('./Canvas.tsx'), { ssr: false })` (componentes/heroi/index.tsx) não
// injeta preload/<script> para o alvo do import em export estático: o nome do
// chunk pesado só existe como string dentro de OUTRO chunk, resolvido pelo
// runtime do bundler quando o import() dispara no navegador. Os dois métodos
// acima são cegos ao mesmo ponto, sob duas fórmulas — por isso concordam no
// mesmo número pequeno demais (achado registrado em
// tests/build/peso-heroi.test.ts e no report da Tarefa 21).
//
// Aqui quem decide "quais arquivos" é o navegador de verdade: abre cada rota
// numa aba própria, grava todo request que bate em `_next/static/`, e a
// diferença de conjuntos entre a home e "Sobre" é o custo do herói. O "quanto
// cada um pesa" continua vindo do brotli em disco (`brotli()` acima), não do
// tamanho transferido pela resposta — o servidor de teste serve sem
// compressão, então o `transfer size` mentiria.
//
// `urlBase` aponta para um servidor HTTP já no ar na frente de `raiz` (por
// exemplo `tests/support/servidor-estatico.mjs raiz porta`) — a função não
// sobe nem derruba servidor, só navega. Import do Playwright é dinâmico e só
// acontece dentro da função: as outras três funções e o CLI continuam sem
// depender dele.
/** @param {string} urlBase @param {string} raiz */
export async function medirHeroiPorNavegador(urlBase, raiz) {
  const { chromium } = await import('@playwright/test');

  /** @param {string} rota @returns {Promise<Set<string>>} */
  const requisitados = async (rota) => {
    const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
    try {
      const page = await browser.newPage();
      const vistos = new Set();
      page.on('response', (r) => {
        const m = r.url().match(/\/_next\/static\/.+/);
        if (m) vistos.add(m[0]);
      });
      await page.goto(`${urlBase}${rota}`, { waitUntil: 'load' });
      // Dá tempo ao import dinâmico de resolver: o canvas só carrega a vgpu
      // depois de `criarRenderer(...).pronto`, então esperar só o `load` do
      // documento mede cedo demais. `document.fonts.ready` mais uma folga
      // cobre tanto o caminho feliz (WebGPU disponível, canvas monta) quanto
      // o headless sem GPU (o import ainda dispara, só a pintura que falha).
      await page.evaluate(() => document.fonts.ready).catch(() => {});
      await page.waitForTimeout(1_500);
      return vistos;
    } finally {
      await browser.close();
    }
  };

  const home = await requisitados('/pt/');
  const sobre = await requisitados('/pt/sobre/');
  const exclusivos = [...home].filter((url) => !sobre.has(url)).sort();

  let total = 0;
  /** @type {Record<string, number>} */
  const detalhe = {};
  for (const url of exclusivos) {
    const arquivo = join(raiz, url.replace(/^\//, ''));
    const bytes = existsSync(arquivo) ? brotli(arquivo) : 0;
    detalhe[url] = bytes;
    total += bytes;
  }

  return { total, detalhe, home: [...home].sort(), sobre: [...sobre].sort(), exclusivos };
}

// `base` fixa a raiz original através da recursão: sem isso, a chamada
// recursiva `listar(caminho, sufixo)` promove o subdiretório a `raiz`, e
// `relative(raiz, caminho)` devolve só o nome do arquivo — perdendo o prefixo
// de diretório para tudo além do primeiro nível (ex.: `pt/sobre/index.html`
// vira `index.html`). Achado na auto-revisão desta tarefa: o CLI chegou a
// listar `index.html` quatro vezes, todas medindo `out/index.html` de novo,
// porque o rótulo errado era resolvido de volta contra a raiz de topo.
/**
 * @param {string} raiz
 * @param {string} sufixo
 * @param {string} [base]
 * @returns {string[]}
 */
function listar(raiz, sufixo, base = raiz) {
  /** @type {string[]} */
  const achados = [];
  for (const entrada of readdirSync(raiz)) {
    const caminho = join(raiz, entrada);
    if (statSync(caminho).isDirectory()) achados.push(...listar(caminho, sufixo, base));
    else if (entrada.endsWith(sufixo)) achados.push(relative(base, caminho));
  }
  return achados;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const raiz = process.argv[2] ?? 'out';
  const rotas = listar(raiz, '.html');
  for (const rota of rotas.sort()) {
    const m = medirRota(raiz, rota);
    console.log(
      `${String(m.total).padStart(8)} br  (doc ${m.documento}, css ${m.css}, js ${m.js})  ${rota}`,
    );
  }
  console.log(`\nchunk do herói: ${medirHeroi(raiz)} B brotli`);
}
