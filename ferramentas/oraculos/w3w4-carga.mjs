// W3 e W4 — peso comprimido e tempo de carga da home, no perfil móvel
// simulado. Um Lighthouse programático (via runner de `@lhci/cli`), cinco
// execuções, mediana — porque TBT é ruidoso sob CPU 4×.
//
// Cada detalhe abaixo tem um erro da rodada 01 atrás (ver `04_plano.md`,
// Tarefa 10):
//
// - O chunk com `nomodule` (React 19 renderiza o atributo DOM `noModule`,
//   não a grafia HTML `nomodule`) SAI da soma de JS e da soma do total —
//   navegador moderno não o baixa; somá-lo reprova por medida errada. Este
//   oráculo não recebe `raiz` (só `url`), então a única fonte confiável é o
//   HTML servido: um `<script noModule src="...">` é achado por regex antes
//   de rodar o Lighthouse, e sua URL entra em `detalhe.excluidos` mesmo que
//   o Chromium moderno nunca chegue a pedi-la pela rede.
// - A linha do pôster mede 0 e a folga de 150 000 B do total NÃO migra para
//   nenhuma outra linha — cada teto vale sozinho.
// - Perfil móvel simulado: exatamente os números do "Slow 4G" que o próprio
//   Lighthouse usa como padrão (`rttMs:150`, `throughputKbps:1.6*1024`,
//   `cpuSlowdownMultiplier:4`) — outro perfil mede outra coisa, e foi
//   exatamente destes números que a conta do teto de LCP saiu.
// - `CHROME_PATH` ausente ou não-executável ⇒ `codigo:3`, ambiente e não
//   comportamento falseado — checado ANTES de gastar uma execução de
//   Lighthouse.
// - Resposta sem `content-encoding` ⇒ `codigo:3`, nunca 1. Byte cru contra
//   teto comprimido é medir outra coisa. `semCompressao:true` força esse
//   caminho: pede a página sem aceitar codificação, e a origem (que só comprime
//   quando o pedido aceita) devolve sem o cabeçalho.

import { createRequire } from 'node:module';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { gunzipSync, brotliDecompressSync } from 'node:zlib';
import { accessSync, constants as fsConstants } from 'node:fs';

const require = createRequire(import.meta.url);
// `@lhci/cli` não expõe API pública — este é o runner que a própria CLI usa
// para `collect --method=node`: spawna `lighthouse` como processo filho e
// devolve o LHR em JSON. Caminho interno, mas é o que a Tarefa 10 pede
// ("Usa @lhci/cli").
const LighthouseRunner = require('@lhci/cli/src/collect/node-runner.js');

const TETOS = Object.freeze({
  html: 20_000,
  css: 25_000,
  js: 130_000,
  poster: 0,
  total: 175_000,
  lcp: 2_500,
  cls: 0.05,
  tbt: 200,
});

const EXECUCOES = 5;

// O mesmo "Slow 4G" que o Lighthouse chama de `mobileSlow4G` — literal, não
// deduzido. `throttlingMethod:'simulate'` só usa `rttMs`, `throughputKbps` e
// `cpuSlowdownMultiplier`; os outros três campos só valem no método
// `devtools`, mas entram aqui por completude com a constante de origem.
const PERFIL_MOVEL = Object.freeze({
  rttMs: 150,
  throughputKbps: 1.6 * 1024,
  requestLatencyMs: 150 * 3.75,
  downloadThroughputKbps: 1.6 * 1024 * 0.9,
  uploadThroughputKbps: 750 * 0.9,
  cpuSlowdownMultiplier: 4,
});

const TIPOS_POSTER = new Set(['Image', 'Media']);

function mediana(valores) {
  const ordenado = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenado.length / 2);
  return ordenado.length % 2 === 0
    ? (ordenado[meio - 1] + ordenado[meio]) / 2
    : ordenado[meio];
}

function checarChromePath() {
  const chromePath = process.env.CHROME_PATH;
  if (!chromePath) return null;
  try {
    accessSync(chromePath, fsConstants.X_OK);
    return chromePath;
  } catch {
    return null;
  }
}

function buscarPagina(destino, semCompressao) {
  return new Promise((resolve, reject) => {
    const alvo = new URL(destino);
    const requisitar = alvo.protocol === 'https:' ? httpsRequest : httpRequest;
    const req = requisitar(
      alvo,
      { headers: { 'accept-encoding': semCompressao ? 'identity' : 'br, gzip' } },
      (res) => {
        const pedacos = [];
        res.on('data', (p) => pedacos.push(p));
        res.on('end', () => {
          const bruto = Buffer.concat(pedacos);
          const codificacao = res.headers['content-encoding'] ?? null;
          let texto;
          try {
            texto =
              codificacao === 'br'
                ? brotliDecompressSync(bruto).toString('utf8')
                : codificacao === 'gzip'
                  ? gunzipSync(bruto).toString('utf8')
                  : bruto.toString('utf8');
          } catch {
            texto = bruto.toString('utf8');
          }
          resolve({ codificacao, texto });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

// Acha `<script noModule src="...">` (React 19 renderiza `noModule=""`; a
// forma HTML `nomodule` também casa, por ser case-insensitive) e devolve as
// URLs absolutas, já resolvidas contra a página.
function acharNomodule(html, base) {
  const regex = /<script\b[^>]*\bnomodule\b[^>]*>/gi;
  const urls = [];
  for (const tagMatch of html.matchAll(regex)) {
    const srcMatch = /\bsrc=["']([^"']+)["']/i.exec(tagMatch[0]);
    if (srcMatch) urls.push(new URL(srcMatch[1], base).toString());
  }
  return urls;
}

function extrairMedidas(lhr, excluidosSet) {
  const itens = lhr.audits?.['network-requests']?.details?.items ?? [];
  const bytes = { html: 0, css: 0, js: 0, poster: 0, total: 0 };

  for (const item of itens) {
    if (excluidosSet.has(item.url)) continue;
    const tamanho = item.transferSize ?? 0;

    switch (item.resourceType) {
      case 'Document':
        bytes.html += tamanho;
        break;
      case 'Stylesheet':
        bytes.css += tamanho;
        break;
      case 'Script':
        bytes.js += tamanho;
        break;
      default:
        if (TIPOS_POSTER.has(item.resourceType)) bytes.poster += tamanho;
        break;
    }
    bytes.total += tamanho;
  }

  return {
    bytes,
    tempo: {
      lcp: lhr.audits?.['largest-contentful-paint']?.numericValue ?? Number.NaN,
      cls: lhr.audits?.['cumulative-layout-shift']?.numericValue ?? Number.NaN,
      tbt: lhr.audits?.['total-blocking-time']?.numericValue ?? Number.NaN,
    },
  };
}

export async function medirW3W4({ url, rota, semCompressao = false }) {
  const chromePath = checarChromePath();
  if (!chromePath) {
    return {
      ok: false,
      codigo: 3,
      violacoes: ['ambiente: CHROME_PATH ausente'],
      detalhe: {},
    };
  }

  const destino = `${url}${rota}`;

  const pagina = await buscarPagina(destino, semCompressao);
  if (!pagina.codificacao) {
    return {
      ok: false,
      codigo: 3,
      violacoes: ['ambiente: content-encoding ausente'],
      detalhe: {},
    };
  }

  const excluidosUrls = acharNomodule(pagina.texto, destino);
  // Rotulado com o mesmo nome que o próprio Next usa internamente
  // (`polyfillFiles`, no `build-manifest.json`) — o hash do Turbopack não
  // carrega "polyfills" no nome, só a origem do bundle sabe o que é.
  const excluidos = excluidosUrls.map((u) => `polyfills (nomodule): ${u}`);
  const excluidosSet = new Set(excluidosUrls);

  const runner = new LighthouseRunner();
  const porExecucao = [];
  for (let i = 0; i < EXECUCOES; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const lhrTexto = await runner.run(destino, {
      chromePath,
      settings: {
        onlyAudits: [
          'network-requests',
          'largest-contentful-paint',
          'cumulative-layout-shift',
          'total-blocking-time',
        ],
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 412,
          height: 823,
          deviceScaleFactor: 1.75,
          disabled: false,
        },
        throttlingMethod: 'simulate',
        throttling: PERFIL_MOVEL,
      },
    });
    porExecucao.push(extrairMedidas(JSON.parse(lhrTexto), excluidosSet));
  }

  const bytes = {
    html: mediana(porExecucao.map((e) => e.bytes.html)),
    css: mediana(porExecucao.map((e) => e.bytes.css)),
    js: mediana(porExecucao.map((e) => e.bytes.js)),
    poster: mediana(porExecucao.map((e) => e.bytes.poster)),
    total: mediana(porExecucao.map((e) => e.bytes.total)),
  };
  const tempo = {
    lcp: mediana(porExecucao.map((e) => e.tempo.lcp)),
    cls: mediana(porExecucao.map((e) => e.tempo.cls)),
    tbt: mediana(porExecucao.map((e) => e.tempo.tbt)),
  };

  const violacoes = [];
  if (bytes.html > TETOS.html) violacoes.push(`HTML: ${bytes.html} B > ${TETOS.html} B`);
  if (bytes.css > TETOS.css) violacoes.push(`CSS: ${bytes.css} B > ${TETOS.css} B`);
  if (bytes.js > TETOS.js) violacoes.push(`JS: ${bytes.js} B > ${TETOS.js} B`);
  if (bytes.poster !== TETOS.poster) violacoes.push(`pôster: ${bytes.poster} B ≠ ${TETOS.poster} B`);
  if (bytes.total > TETOS.total) violacoes.push(`total: ${bytes.total} B > ${TETOS.total} B`);
  if (tempo.lcp > TETOS.lcp) violacoes.push(`LCP: ${tempo.lcp} ms > ${TETOS.lcp} ms`);
  if (tempo.cls > TETOS.cls) violacoes.push(`CLS: ${tempo.cls} > ${TETOS.cls}`);
  if (tempo.tbt > TETOS.tbt) violacoes.push(`TBT: ${tempo.tbt} ms > ${TETOS.tbt} ms`);

  return {
    ok: violacoes.length === 0,
    codigo: violacoes.length === 0 ? 0 : 1,
    violacoes,
    detalhe: { bytes, tempo, excluidos },
  };
}
