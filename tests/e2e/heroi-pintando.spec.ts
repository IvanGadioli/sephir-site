import { expect, test, type Page } from '@playwright/test';
import { colors } from '../../lib/marca.ts';

// O caminho de PINTURA do herói, que nenhum dos 37 E2E exercitava (achado I9).
//
// Em headless — o modo de todos os outros projetos — `navigator.gpu` existe mas
// `requestAdapter()` devolve `null`: o <canvas> monta porque `podeTentar()` só
// checa a presença de `navigator.gpu`, `renderer.pronto` rejeita, `pintando`
// continua `false` e o canvas fica com `opacity: 0` para sempre. Consequência:
// `heroi.spec.ts` tem um teste chamado "o pôster nunca sai do DOM, mesmo quando
// o canvas pinta" cuja condição destacada nunca ocorre em nenhuma execução da
// suíte, e a única defesa contra o herói tornar o `<h1>` ilegível era prosa — o
// Ruling AC registrou nove amostras temporais (5,38:1–5,96:1 no desktop) num
// relatório, e nada disso virou asserção. Este arquivo é aquele ruling virando
// régua, que é o que o Ruling AF exige.
//
// Roda num projeto Playwright próprio (`headed-webgpu`, ver
// `playwright.config.ts`) porque precisa de `headless: false` apontado para um X
// real — é a mesma descoberta de `ferramentas/capturar-poster.mjs` e de
// `ferramentas/capturar-poster.md`: com DISPLAY real o adapter é real (Intel
// gen-12lp nesta máquina), sem ele não há GPU por trás.
//
// **Skip, não falha, quando `DISPLAY` está ausente.** Em CI sem display o
// adapter não existe e o herói nunca pintaria; reprovar ali seria vermelho que
// não fala do site. O custo declarado é que estas duas asserções não protegem
// nada em CI headless — só na máquina do titular, onde o hardware existe.
test.skip(
  !process.env.DISPLAY,
  'sem DISPLAY: em headless o requestAdapter() devolve null e o herói nunca pinta. ' +
    'Rode com `DISPLAY=:0 npx playwright test --project=headed-webgpu`.',
);

// Nove amostras, o mesmo N do Ruling AC, espaçadas de 500 ms: cobre ~4,5 s de
// animação, e o ciclo de cisalhamento de 10 s não cobre inteiro — é por isso que
// o nome do teste diz "instantes". Amostragem não é prova sobre todo `t`; o que
// ela estabelece é que em nenhum dos instantes medidos o contraste caiu perto do
// piso.
//
// Ressalva honesta, medida: numa janela headed sem foco o Chromium estrangula o
// `requestAnimationFrame`, e várias das nove amostras saem idênticas (mesmo
// contraste, mesmo ponto). O número de amostras distintas é portanto ≤ 9, e
// varia por execução. Em quatro execuções seguidas nesta máquina o pior ponto
// observado ficou entre 9,81:1 e 17,63:1 — folga de mais de 3× sobre o piso de
// 3:1. O que o teste protege de verdade é a ORDEM DE GRANDEZA: um ajuste de
// `disk.brightness` ou um `SATURATION` revertido em `composite.wgsl` que levasse
// o texto para perto do ilegível reprovaria; uma variação de meio ponto entre
// instantes, não.
const AMOSTRAS = 9;
const INTERVALO_MS = 500;
// 3:1 é o mínimo WCAG para texto grande, e o `<h1>` do herói é
// `clamp(2.75rem, 6vw, 4.5rem)`. É o mesmo limiar que o Ruling AC usou.
const CONTRASTE_MINIMO = 3;

test.describe('o herói pintando de verdade, em GPU real', () => {
  // Serial, contra o `fullyParallel: true` do resto da suíte: dois Chromium
  // headed disputando a mesma iGPU no mesmo X derrubaram a aba na primeira
  // execução ("Target page, context or browser has been closed"). Aqui o custo
  // de serializar é dois testes, e o benefício é não piscar — que o brief desta
  // correção nomeia como pior que um teste ausente.
  test.describe.configure({ mode: 'serial' });
  // Nove amostras × 500 ms, mais a subida de um Chromium headed e a
  // inicialização do WebGPU, não caberia nos 30 s do resto da suíte.
  test.setTimeout(120_000);

  test('o canvas chega a pintar: ganha heroi__canvas--visivel', async ({ page }) => {
    await page.goto('/pt/');
    // `--visivel` só entra quando `renderer.pronto` resolve, o que só acontece
    // depois de `init()`, dos nove shaders compilados e do `prewarm`. A classe é
    // portanto a asserção de que a cadeia inteira funcionou, ponta a ponta.
    await expect(page.locator('.heroi__canvas')).toHaveClass(/heroi__canvas--visivel/, {
      timeout: 60_000,
    });
    // E o pôster continua no DOM por baixo — agora afirmado numa execução em que
    // o canvas DE FATO pinta, que é a condição que `heroi.spec.ts` prometia no
    // nome e nunca exercitava.
    await expect(page.locator('.heroi__poster')).toHaveCount(1);
  });

  test(`o <h1> sobre o canvas fica acima de ${CONTRASTE_MINIMO}:1 em ${AMOSTRAS} instantes`, async ({
    page,
  }) => {
    await page.goto('/pt/');
    await expect(page.locator('.heroi__canvas')).toHaveClass(/heroi__canvas--visivel/, {
      timeout: 60_000,
    });

    const medidas: Array<{ contraste: number; ponto: [number, number]; pixels: number }> = [];
    for (let i = 0; i < AMOSTRAS; i++) {
      medidas.push(await piorContraste(page, colors.stardust));
      if (i < AMOSTRAS - 1) await page.waitForTimeout(INTERVALO_MS);
    }

    // Vai para a saída do runner de propósito: quando isto reprovar, o número e
    // o ponto valem mais que "falhou".
    console.log(
      'contraste do h1 sobre o canvas:',
      medidas.map((m) => `${m.contraste.toFixed(2)}:1 em (${m.ponto.join(',')})`).join(' · '),
    );

    // Amostra vazia é o modo de falha silenciosa deste teste: se o retângulo do
    // <h1> não cair sobre o canvas, o laço mediria zero pixel e o `toBeGreaterThan`
    // abaixo passaria com um contraste calculado do nada.
    for (const m of medidas) expect(m.pixels).toBeGreaterThan(1000);
    for (const m of medidas) {
      expect(m.contraste, `pior ponto ${m.ponto.join(',')}`).toBeGreaterThanOrEqual(
        CONTRASTE_MINIMO,
      );
    }
  });
});

/**
 * Pior contraste WCAG entre a cor do texto e o fundo COMPOSTO sob o retângulo do
 * `<h1>`, no instante da chamada.
 *
 * "Composto" é o ponto, e foi a primeira coisa que esta função errou: medindo só
 * os pixels crus do canvas, o pior ponto deu **1,05:1** — uma estrela do
 * `stars.wgsl`, quase branca, num único pixel. Não é o que o visitante vê: sobre
 * a metade esquerda do herói, onde o `<h1>` mora, o `.heroi__veu-lateral` cobre
 * o canvas com 97% de `--cor-void`, e aquela estrela é invisível. Medir o canvas
 * puro é conservador na direção errada — produz vermelho que não descreve
 * nenhuma tela. É a mesma composição que a T19 fez à mão para chegar aos
 * 5,38:1–5,96:1 do Ruling AC.
 *
 * Os dois véus são lidos do `getComputedStyle`, não transcritos: as paradas de
 * gradiente vivem em `estilos/base.css` e transcrevê-las aqui criaria duas
 * verdades — a doença que este projeto trata em toda parte. Se alguém recalibrar
 * um véu, esta medida acompanha.
 */
async function piorContraste(
  page: Page,
  hexTexto: string,
): Promise<{ contraste: number; ponto: [number, number]; pixels: number }> {
  return page.evaluate(async (hex: string) => {
    const canvas = document.querySelector('.heroi__canvas');
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error('`.heroi__canvas` não é <canvas>');
    const h1 = document.querySelector('.heroi__texto h1');
    if (h1 === null) throw new Error('`.heroi__texto h1` ausente');

    const rc = canvas.getBoundingClientRect();
    const rh = h1.getBoundingClientRect();
    // O backing store do canvas está em pixels de dispositivo e o retângulo do
    // <h1> em pixels de CSS. Foi o erro que a T19 cometeu na primeira tentativa
    // (amostrou fora da largura); a escala vem do próprio canvas, não de
    // `devicePixelRatio`, porque a degradação por DPR pode tê-la mudado.
    const escala = canvas.width / rc.width;
    const x0 = Math.max(0, Math.round((rh.left - rc.left) * escala));
    const y0 = Math.max(0, Math.round((rh.top - rc.top) * escala));
    const x1 = Math.min(canvas.width, Math.round((rh.right - rc.left) * escala));
    const y1 = Math.min(canvas.height, Math.round((rh.bottom - rc.top) * escala));
    if (x1 <= x0 || y1 <= y0) {
      return { contraste: 0, ponto: [x0, y0] as [number, number], pixels: 0 };
    }

    // Um canvas com contexto WebGPU não aceita `getContext('2d')`, então a
    // leitura de pixel passa por `toDataURL` e um canvas 2D à parte — o mesmo
    // caminho do `ferramentas/capturar-poster.mjs`.
    const imagem = new Image();
    imagem.src = canvas.toDataURL('image/png');
    await imagem.decode();
    // Copia só o recorte do <h1>, não o quadro inteiro: um canvas 2D de
    // 3840×2160 por amostra, nove vezes, derrubou a aba por memória.
    const plano = document.createElement('canvas');
    plano.width = x1 - x0;
    plano.height = y1 - y0;
    const ctx = plano.getContext('2d', { willReadFrequently: true });
    if (ctx === null) throw new Error('sem contexto 2d para ler o pixel');
    ctx.drawImage(imagem, x0, y0, plano.width, plano.height, 0, 0, plano.width, plano.height);
    const dados = ctx.getImageData(0, 0, plano.width, plano.height).data;

    // --- os véus, lidos do CSS resolvido ---------------------------------
    type Parada = { rgb: [number, number, number]; alfa: number; pos: number };
    type Veu = { eixo: 'x' | 'y'; paradas: Parada[] };
    const veus: Veu[] = [];
    // Ordem do DOM = ordem de empilhamento: os dois véus vêm depois do <canvas>
    // e antes do `.heroi__texto` (ver app/[lang]/page.tsx).
    for (const el of document.querySelectorAll('.heroi__veu-lateral, .heroi__veu-vertical')) {
      const imagemFundo = getComputedStyle(el).backgroundImage;
      // O Chromium OMITE o ângulo quando ele é o default de 180deg — foi o que
      // esta função errou primeiro, lendo `undefineddeg` do véu vertical. 90deg
      // é "para a direita" (eixo x), 180deg é "para baixo" (eixo y).
      const angulo = /linear-gradient\((\d+)deg/.exec(imagemFundo)?.[1] ?? '180';
      if (angulo !== '90' && angulo !== '180') {
        throw new Error(`véu com ângulo inesperado (${angulo}deg): esta função só sabe 90 e 180`);
      }
      const paradas = [...imagemFundo.matchAll(/rgba?\(([^)]*)\)\s*([\d.]+)%/g)].map((m) => {
        const partes = (m[1] ?? '').split(',').map((p) => Number(p.trim()));
        return {
          rgb: [partes[0] ?? 0, partes[1] ?? 0, partes[2] ?? 0] as [number, number, number],
          alfa: partes[3] ?? 1,
          pos: Number(m[2]) / 100,
        };
      });
      if (paradas.length < 2) throw new Error(`véu sem paradas legíveis: ${imagemFundo}`);
      veus.push({ eixo: angulo === '90' ? 'x' : 'y', paradas });
    }
    if (veus.length !== 2) throw new Error(`esperava 2 véus, achei ${veus.length}`);

    // Interpolação linear entre paradas. As duas cores de cada gradiente são a
    // mesma (`--cor-void` em alfas diferentes), então interpolar canal e alfa
    // separadamente coincide com a interpolação premultiplicada do CSS.
    const amostrarVeu = (veu: Veu, t: number) => {
      const p = veu.paradas;
      const primeira = p[0]!;
      const ultima = p[p.length - 1]!;
      if (t <= primeira.pos) return primeira;
      if (t >= ultima.pos) return ultima;
      for (let i = 1; i < p.length; i++) {
        const a = p[i - 1]!;
        const b = p[i]!;
        if (t > b.pos) continue;
        const f = b.pos === a.pos ? 0 : (t - a.pos) / (b.pos - a.pos);
        return {
          rgb: [
            a.rgb[0] + (b.rgb[0] - a.rgb[0]) * f,
            a.rgb[1] + (b.rgb[1] - a.rgb[1]) * f,
            a.rgb[2] + (b.rgb[2] - a.rgb[2]) * f,
          ] as [number, number, number],
          alfa: a.alfa + (b.alfa - a.alfa) * f,
          pos: t,
        };
      }
      return ultima;
    };

    // O alfa do véu lateral depende só de x, o do vertical só de y — tabelar as
    // duas colunas evita reamostrar o gradiente em cada um dos ~85 mil pixels.
    const porColuna = veus.map((veu) => {
      const n = veu.eixo === 'x' ? canvas.width : canvas.height;
      return Array.from({ length: n }, (_, i) => amostrarVeu(veu, n <= 1 ? 0 : i / (n - 1)));
    });

    const canal = (v: number) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    const luminancia = (r: number, g: number, b: number) =>
      0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
    const n = Number.parseInt(hex.slice(1), 16);
    const lTexto = luminancia((n >> 16) & 255, (n >> 8) & 255, n & 255);

    let pior = Number.POSITIVE_INFINITY;
    let ponto: [number, number] = [x0, y0];
    const largura = x1 - x0;
    for (let i = 0; i < dados.length; i += 4) {
      const px = i / 4;
      const x = x0 + (px % largura);
      const y = y0 + Math.floor(px / largura);
      let r = dados[i] ?? 0;
      let g = dados[i + 1] ?? 0;
      let b = dados[i + 2] ?? 0;
      // `source-over` sobre um fundo opaco, na ordem do DOM.
      for (let v = 0; v < veus.length; v++) {
        const amostra = porColuna[v]![veus[v]!.eixo === 'x' ? x : y]!;
        const a = amostra.alfa;
        r = amostra.rgb[0] * a + r * (1 - a);
        g = amostra.rgb[1] * a + g * (1 - a);
        b = amostra.rgb[2] * a + b * (1 - a);
      }
      const lFundo = luminancia(r, g, b);
      const razao = (Math.max(lTexto, lFundo) + 0.05) / (Math.min(lTexto, lFundo) + 0.05);
      if (razao < pior) {
        pior = razao;
        ponto = [x, y];
      }
    }
    return { contraste: pior, ponto, pixels: dados.length / 4 };
  }, hexTexto);
}
