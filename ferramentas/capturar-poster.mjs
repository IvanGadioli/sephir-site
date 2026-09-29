// Captura o pôster do herói: abre /pt/ num Chromium de verdade (headed, no
// DISPLAY real da máquina — não Xvfb, não SwiftShader), espera o WebGPU
// inicializar e o primeiro quadro pintar, e lê os pixels PUROS do
// `<canvas>` via toDataURL — não uma screenshot da página composta, que
// incluiria h1/nav/véus por cima (eles ocupam o mesmo retângulo absoluto).
// Mesma separação "o que o canvas desenhou" vs. "o que a página compõe" que
// a Tarefa 19 usou para medir contraste.
//
// Pré-requisito: `npm run build` e o servidor estático já no ar, servindo
// `out/` (ex.: `node tests/support/servidor-estatico.mjs out 4173`).
//
// Uso:
//   DISPLAY=:0 node ferramentas/capturar-poster.mjs
//   DISPLAY=:0 URL_BASE=http://localhost:4173 SAIDA=/tmp/heroi-bruto.png node ferramentas/capturar-poster.mjs
//
// Por que precisa de DISPLAY real: headless (o padrão do Playwright) expõe
// `navigator.gpu`, mas `requestAdapter()` devolve `null` — sem GPU real por
// trás. Com `headless: false` apontado para um X real (`DISPLAY=:0` nesta
// máquina, a mesma que roda o Chromium do usuário), o adapter é real —
// Intel gen-12lp, `isFallbackAdapter` falsy, feature set completo. Ver
// `ferramentas/capturar-poster.md` para a evidência completa.
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const URL_BASE = process.env.URL_BASE ?? 'http://localhost:4173';
const SAIDA = process.env.SAIDA ?? '/tmp/heroi-bruto.png';

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: false });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(`${URL_BASE}/pt/`, { waitUntil: 'load' });

  // document.fonts.ready dá tempo ao import dinâmico da vgpu resolver antes
  // de esperar o canvas — mesmo padrão da Tarefa 21.
  await page.evaluate(() => document.fonts.ready).catch(() => {});

  // Espera ativa até `renderer.pronto` resolver e `Canvas.tsx` aplicar
  // `heroi__canvas--visivel` (o primeiro quadro foi desenhado) — em vez de
  // um tempo fixo às cegas, com teto de 20s antes de desistir.
  const pintou = await page
    .waitForFunction(
      () => document.querySelector('.heroi__canvas')?.classList.contains('heroi__canvas--visivel') ?? false,
      { timeout: 20_000 },
    )
    .then(() => true)
    .catch(() => false);
  console.log('canvas pintando (--visivel):', pintou);
  if (!pintou) {
    console.error('o canvas nunca ganhou heroi__canvas--visivel — capturando mesmo assim, mas valide o desvio-padrão');
  }

  // Dois requestAnimationFrame de folga depois de --visivel: garante que o
  // quadro já composto não é o primeiro (potencialmente incompleto).
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(1000);

  const { dataUrl, width, height } = await page.evaluate(() => {
    // `querySelector` devolve `Element`, que não tem `toDataURL` — foi o que o
    // `checkJs` da correção I5 apontou aqui. O `instanceof` não é cerimônia:
    // se algum dia `.heroi__canvas` deixar de ser um <canvas>, a mensagem
    // abaixo diz isso em vez de estourar em `c.toDataURL is not a function`.
    const c = document.querySelector('.heroi__canvas');
    if (!(c instanceof HTMLCanvasElement)) {
      throw new Error('`.heroi__canvas` ausente ou não é <canvas> — WebGPU indisponível ou prefers-reduced-motion ativo');
    }
    return { dataUrl: c.toDataURL('image/png'), width: c.width, height: c.height };
  });
  console.log('canvas backing store:', width, 'x', height);
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  writeFileSync(SAIDA, Buffer.from(base64, 'base64'));
  console.log('canvas puro salvo em', SAIDA);
} finally {
  await browser.close();
}
