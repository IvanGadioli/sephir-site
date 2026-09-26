import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// brotli, e não gzip: é o que o Cloudflare Pages entrega ao visitante. Medir
// gzip seria medir um número que ninguém baixa.
export function brotli(caminho) {
  return execFileSync('brotli', ['-q', '11', '-c', caminho], {
    maxBuffer: 64 * 1024 * 1024,
  }).length;
}

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
export function medirHeroi(raiz) {
  const home = medirRota(raiz, 'pt/index.html');
  const sobre = medirRota(raiz, 'pt/sobre/index.html');
  return home.js + home.css - (sobre.js + sobre.css);
}

// Caminho alternativo, usado só se `medirHeroi` (por diferença) medir ~0: soma
// direto o brotli dos chunks que aparecem em pt/index.html e NÃO aparecem em
// pt/sobre/index.html. Se o Next puser o canvas num chunk compartilhado por
// toda rota, nem esta função acha nada exclusivo — e isso também é achado.
export function medirHeroiPorChunk(raiz) {
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

// `base` fixa a raiz original através da recursão: sem isso, a chamada
// recursiva `listar(caminho, sufixo)` promove o subdiretório a `raiz`, e
// `relative(raiz, caminho)` devolve só o nome do arquivo — perdendo o prefixo
// de diretório para tudo além do primeiro nível (ex.: `pt/sobre/index.html`
// vira `index.html`). Achado na auto-revisão desta tarefa: o CLI chegou a
// listar `index.html` quatro vezes, todas medindo `out/index.html` de novo,
// porque o rótulo errado era resolvido de volta contra a raiz de topo.
function listar(raiz, sufixo, base = raiz) {
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
