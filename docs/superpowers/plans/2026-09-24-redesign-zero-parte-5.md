# Redesign do zero — plano, parte 5: o herói WebGPU e a medição

> Continuação de `2026-09-24-redesign-zero-parte-4.md`. As **Global Constraints** da parte 1 valem aqui integralmente.

O exemplo de origem está descompactado em
`/home/alzahir/Downloads/optimized-black-hole.zip`. Descompacte para um diretório
de trabalho antes da Tarefa 19 — **não** para dentro de `componentes/`, porque
nem todo arquivo dele entra.

**Risco de versão, a resolver na Tarefa 18:** a skill que forneceu o exemplo é a
`vgpu` v0.3.1; o pacote publicado no npm está em **0.5.0**. O exemplo pode usar
API que mudou. O Step 3 da Tarefa 18 existe exatamente para descobrir isso cedo,
com um shader trivial, antes de portar mil linhas de WGSL.

---

## Tarefa 18: A fronteira de cliente e o primeiro pixel

**Files:**
- Create: `componentes/heroi/index.tsx`, `componentes/heroi/Canvas.tsx`, `componentes/heroi/renderer.ts`, `componentes/heroi/wgsl-env.d.ts`
- Modify: `app/[lang]/page.tsx`, `next.config.ts`, `package.json`, `estilos/base.css`
- Test: `tests/unit/heroi-montagem.test.tsx`, `tests/e2e/heroi.spec.ts`

**Interfaces:**
- Consumes: nada dos seis componentes.
- Produces: `export default function Heroi()` de `componentes/heroi/index.tsx`; `export function criarRenderer({ canvas }: { canvas: HTMLCanvasElement }): { pronto: Promise<void>; descartar(): void }` de `renderer.ts`.

- [ ] **Step 1: Instalar a vgpu e fixar a versão**

```bash
npm install vgpu
node -e "console.log(require('./package.json').dependencies.vgpu)"
```

Anote a versão resolvida. Se for 0.5.x, o exemplo veio de uma linha anterior —
siga, mas trate qualquer erro de API como esperado, não como surpresa.

- [ ] **Step 2: Ligar o loader de WGSL ao Turbopack**

Os `.wgsl` do exemplo importam uns aos outros (`shade` → `gbuffer`, `disk`,
`stars`; `bake` e `refine` → `geodesic`; `stars` → `@vgpu/wgsl-std/hash`). Esse
grafo só resolve com o loader. Em `next.config.ts`:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // O loader resolve o grafo de import entre os .wgsl em tempo de build e
  // entrega a effect() um shader já achatado. `as: '*.js'` é obrigatório:
  // sem ele o Turbopack não trata a saída do loader como módulo JavaScript.
  turbopack: {
    rules: {
      '*.wgsl': { loaders: ['@vgpu/wgsl/loader-webpack'], as: '*.js' },
    },
  },
};

export default nextConfig;
```

E `componentes/heroi/wgsl-env.d.ts`, sem o qual o TypeScript não sabe o que é um
módulo `.wgsl`:

```ts
/// <reference types="@vgpu/wgsl/types" />
```

Se essa referência não resolver na versão instalada, descubra o caminho certo com
`npx -y vgpu docs cat nextjs` e use o que a documentação instalada indicar.

- [ ] **Step 3: Provar o caminho com um shader trivial, antes de portar o exemplo**

Escreva `componentes/heroi/renderer.ts` com um gradiente de duas linhas, só para
confirmar que init → surface → effect → frame funciona nesta versão:

```ts
// Ciclo de vida do herói no navegador. A vgpu entra por import dinâmico: não
// pode estar no chunk de entrada.
type ApiVgpu = typeof import('vgpu');

const FONTE_PROVISORIA = /* wgsl */ `
@fragment
fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  return vec4f(0.91, 0.59, 0.23, 1.0);
}
`;

export function criarRenderer({ canvas }: { canvas: HTMLCanvasElement }) {
  let descartado = false;
  let parar: (() => void) | undefined;

  const pronto = (async () => {
    if (typeof navigator === 'undefined' || navigator.gpu === undefined) {
      throw new Error('sem WebGPU');
    }
    const vgpu: ApiVgpu = await import('vgpu');
    const gpu = await vgpu.init();
    if (descartado) return;
    const alvo = vgpu.surface(gpu, canvas);
    const efeito = vgpu.effect(gpu, FONTE_PROVISORIA);
    const laco = vgpu.frameLoop(gpu, (quadro) => {
      efeito.draw(quadro, alvo);
    });
    parar = () => laco.stop();
  })();

  return {
    pronto,
    descartar() {
      descartado = true;
      parar?.();
    },
  };
}
```

```bash
npm run dev
```

Abra `http://localhost:3000/pt/` e confirme no console que não há erro de API.
**Se houver**, ajuste as chamadas conforme `npx -y vgpu docs cat Effect` e
`cat Surface` — e anote a divergência entre o exemplo v0.3.1 e a API instalada,
porque ela vai se repetir na Tarefa 19.

- [ ] **Step 4: Escrever o teste de montagem que falha**

`tests/unit/heroi-montagem.test.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Heroi from '../../componentes/heroi/index.tsx';

describe('o herói', () => {
  it('no servidor, rende só o pôster — nunca o canvas', () => {
    const html = renderToStaticMarkup(<Heroi />);
    expect(html).toContain('heroi__poster');
    expect(html).not.toContain('<canvas');
  });

  it('mantém o pôster como elemento de LCP, com alt vazio', () => {
    const html = renderToStaticMarkup(<Heroi />);
    expect(html).toMatch(/<img[^>]*src="\/poster\/heroi\.webp"[^>]*alt=""/);
  });

  it('não marca o pôster como lazy: ele é o LCP', () => {
    const html = renderToStaticMarkup(<Heroi />);
    expect(html).not.toContain('loading="lazy"');
  });
});
```

- [ ] **Step 5: Rodar para ver falhar**

```bash
npm test -- tests/unit/heroi-montagem.test.tsx
```

Esperado: FALHA com módulo não encontrado.

- [ ] **Step 6: Escrever os dois arquivos de cliente**

`next/dynamic` com `ssr: false` **não é permitido dentro de um Server Component**,
e as páginas são todas Server Components — por isso o ponto de entrada é um par.
Os dois vivem no mesmo chunk e contam como **um** ponto de entrada (spec §5).

`componentes/heroi/index.tsx`:

```tsx
'use client';

import dynamic from 'next/dynamic';

// O canvas entra sem SSR: ele só existe depois de navigator.gpu responder, e
// renderizá-lo no servidor produziria um <canvas> vazio no HTML — peso morto
// para quem nunca vai pintá-lo.
const Canvas = dynamic(() => import('./Canvas.tsx').then((m) => m.Canvas), {
  ssr: false,
});

export default function Heroi() {
  return (
    <>
      <img className="heroi__poster" src="/poster/heroi.webp" alt="" />
      <Canvas />
    </>
  );
}
```

`componentes/heroi/Canvas.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { criarRenderer } from './renderer.ts';

export function Canvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [pintando, setPintando] = useState(false);

  useEffect(() => {
    // Três motivos para não montar, todos terminando no pôster: sem
    // navigator.gpu, movimento reduzido pedido, ou falha de init. Com um
    // buraco negro em rotação, honrar prefers-reduced-motion não é boa
    // prática — é necessidade.
    const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (movimentoReduzido) return;
    if (navigator.gpu === undefined) return;

    const canvas = ref.current;
    if (canvas === null) return;

    let cancelado = false;
    const renderer = criarRenderer({ canvas });
    void renderer.pronto
      .then(() => {
        if (!cancelado) setPintando(true);
      })
      .catch(() => {
        // Falha de init ou de compilação: o pôster permanece e nada mais
        // acontece. Silenciar aqui é a decisão certa — o visitante não tem o
        // que fazer com um erro de WebGPU.
      });

    return () => {
      cancelado = true;
      renderer.descartar();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={pintando ? 'heroi__canvas heroi__canvas--visivel' : 'heroi__canvas'}
      aria-hidden="true"
    />
  );
}
```

O `aria-hidden="true"` é deliberado: o canvas é decoração atrás do texto do
herói, e não tem conteúdo que um leitor de tela deva anunciar. O pôster tem
`alt=""` pelo mesmo motivo.

- [ ] **Step 7: Trocar o pôster solto pelo `Heroi` na home**

Em `app/[lang]/page.tsx`, substituir a linha do `<img className="heroi__poster" …>`
por `<Heroi />`, e acrescentar o import:

```tsx
import Heroi from '../../componentes/heroi/index.tsx';
```

- [ ] **Step 8: Acrescentar as classes a `estilos/base.css`**

```css
.heroi__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
  opacity: 0;
  transition: opacity 500ms ease;
}
.heroi__canvas--visivel { opacity: 1; }

/* Quem pediu movimento reduzido nunca vê o canvas — o componente sequer o
   monta. Esta regra é a segunda linha de defesa, para o caso de a preferência
   mudar depois da montagem. */
@media (prefers-reduced-motion: reduce) {
  .heroi__canvas { display: none; }
}
```

- [ ] **Step 9: Escrever o E2E do fallback**

`tests/e2e/heroi.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('sem navigator.gpu, o canvas não monta e o pôster continua visível', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'gpu', { value: undefined, configurable: true });
  });
  await page.goto('/pt/');
  await expect(page.locator('.heroi__poster')).toBeVisible();
  await expect(page.locator('.heroi__canvas')).toHaveCount(0);
});

test('com movimento reduzido, o canvas não monta', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/pt/');
  await expect(page.locator('.heroi__poster')).toBeVisible();
  await expect(page.locator('.heroi__canvas')).toBeHidden();
});

test('o pôster nunca sai do DOM, mesmo quando o canvas pinta', async ({ page }) => {
  await page.goto('/pt/');
  await expect(page.locator('.heroi__poster')).toHaveCount(1);
});

test('o h1 continua legível sobre o herói', async ({ page }) => {
  await page.goto('/pt/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('h1')).toHaveText('Iniciativa Sephir');
});
```

- [ ] **Step 10: Rodar tudo**

```bash
npm test
npm run build && npx playwright test
```

Esperado: unit e build verdes; os quatro do herói verdes. A varredura de
`'use client'` da Tarefa 16 continua passando, porque os dois arquivos novos
estão dentro de `componentes/heroi/`.

- [ ] **Step 11: Commit**

```bash
npm run typecheck
git add -A
git commit -m "herói: a fronteira de cliente, o fallback pelo pôster e o primeiro pixel"
```

---

## Tarefa 19: Portar o pipeline e os shaders do exemplo

**Files:**
- Create: `componentes/heroi/pipeline.ts`, `componentes/heroi/settings.ts`, `componentes/heroi/noise-volume.mjs`, `componentes/heroi/*.wgsl` (nove arquivos)
- Modify: `componentes/heroi/renderer.ts`
- Test: `tests/unit/heroi-settings.test.ts`

**Interfaces:**
- Consumes: os arquivos do `.zip`.
- Produces: de `pipeline.ts`, os nomes que o exemplo já exporta — `createEffects`, `createTargets`, `destroyTargets`, `prewarm`, `renderChain`, `setBakeUniforms`, `setBindings`, `setPostUniforms`, `setShadeUniforms`, e os tipos `Effects` e `Targets`. De `settings.ts`: `defaultHeroSettings(): HeroSettings`, mais os tipos `DiskLook`, `StarLook`, `BloomLook`, `HeroSettings`. **Os nomes ficam em inglês**, como no upstream — ver a justificativa abaixo.

Os nove `.wgsl` (`bake`, `bloom`, `composite`, `disk`, `gbuffer`, `geodesic`,
`refine`, `shade`, `stars`), mais `pipeline.ts`, `settings.ts` e
`noise-volume.mjs`, entram **com adaptação mínima**: nomes de função em inglês
ficam como estão, porque são código de terceiro e renomear dificulta comparar com
a origem quando ela mudar. O `index.tsx` do exemplo **não** entra — o nosso já
existe e faz mais.

- [ ] **Step 1: Copiar os arquivos e carimbar a origem**

```bash
cd /tmp && rm -rf bh && mkdir bh && cd bh
unzip -q /home/alzahir/Downloads/optimized-black-hole.zip
cd ~/Documents/sephir-site
cp /tmp/bh/optimized-black-hole/{pipeline.ts,settings.ts,noise-volume.mjs} componentes/heroi/
cp /tmp/bh/optimized-black-hole/*.wgsl componentes/heroi/
ls componentes/heroi/
```

- [ ] **Step 2: Pôr o cabeçalho de procedência em cada `.wgsl`**

No topo de cada um dos nove, antes de qualquer `import`:

```wgsl
// Derivado do exemplo `optimized-black-hole` da vgpu.
// Fonte: https://vgpu.sh/examples/optimized-black-hole
// Obtido pela skill `vgpu` v0.3.1 em 2026-09-24. Licença do projeto vgpu.
```

O mesmo cabeçalho, em `//`, no topo de `pipeline.ts`, `settings.ts` e
`noise-volume.mjs`. Isto não é formalidade: é código de terceiro dentro do
repositório, e quem abrir daqui a um ano precisa saber de onde veio para
comparar com o upstream.

- [ ] **Step 3: Escrever o teste da configuração**

Este teste trava as decisões de enquadramento da spec §5, que são a única parte
do exemplo que mudamos de propósito.

`tests/unit/heroi-settings.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { defaultHeroSettings } from '../../componentes/heroi/settings.ts';

describe('a configuração do herói', () => {
  it('no desktop, desloca o buraco negro para a direita', () => {
    const c = defaultHeroSettings();
    expect(c.centerX).toBe(0.8);
    expect(c.centerY).toBe(0.3);
  });

  it('mantém o roll e o yaw do exemplo', () => {
    const c = defaultHeroSettings();
    expect(c.cameraRoll).toBeCloseTo(-0.27);
    expect(c.mouseYaw).toBeCloseTo(0.15);
  });

  it('não esmaece o centro no desktop', () => {
    expect(defaultHeroSettings().centerFade).toBe(0);
  });
});
```

- [ ] **Step 4: Rodar para ver falhar, depois passar**

```bash
npm test -- tests/unit/heroi-settings.test.ts
```

Se falhar por caminho de módulo, corrija o import. Os valores já são os do
exemplo — este teste é uma trava contra mudança acidental, não um vermelho a
resolver com código novo.

- [ ] **Step 5: Adaptar o `renderer.ts` ao pipeline real**

Substitua o gradiente provisório da Tarefa 18 pela cadeia do exemplo. Traga do
`renderer.ts` de origem, adaptando os nomes ao nosso contrato
(`criarRenderer`, `pronto`, `descartar`):

- o `matchMedia('(max-width: 767px)')` que troca para
  `{ centerX: 0, centerY: 0, cameraRoll: 0, mouseYaw: 0, centerFade: 1 }`;
- o ajuste de `bloom.radius` e `bloom.strength` por `devicePixelRatio`;
- o `ResizeObserver`, o `IntersectionObserver` e o `document.hidden` — os três
  param o laço quando o herói não está à vista, e isso é o que impede o canvas
  de queimar bateria numa aba de fundo;
- o pacing de quadro. **Troque `TARGET_FPS = 60` por `30`** — é a política da
  spec §5, decidida antes de medir.

Mantenha o `await import('vgpu')` e o `throw` quando `navigator.gpu` é `undefined`.

- [ ] **Step 6: Verificar no navegador**

```bash
npm run dev
```

Abra `http://localhost:3000/pt/`. Confirme, lado a lado com
`Main.dc.html` aberto no navegador:

1. o buraco negro fica **à direita**, sem invadir o `<h1>` a 154 px da esquerda;
2. os dois gradientes continuam intactos;
3. o `<h1>` e a ficha técnica continuam legíveis.

**Se o contraste do texto cair, corrija no shader** — `centerFade`, brilho do
disco — e **nunca** no gradiente, que é parte do mock aprovado (spec §5).

- [ ] **Step 7: Verificar o perfil móvel**

Reduza a janela para 390 px. O buraco negro deve recentrar e o miolo esmaecer
(`centerFade: 1`), deixando o `<h1>`, que ocupa a largura toda, legível.

- [ ] **Step 8: Commit**

```bash
npm test && npm run typecheck
git add -A
git commit -m "herói: o pipeline e os nove shaders do exemplo, com a procedência carimbada"
```

---

## Tarefa 20: A degradação por saúde de quadro

**Files:**
- Create: `componentes/heroi/frame-health.ts`
- Modify: `componentes/heroi/renderer.ts`
- Test: `tests/unit/frame-health.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `criarMonitorDeQuadro(opcoes): { registrar(amostra): void; reiniciar(): void }` onde `amostra = { deltaMs: number; ativo: boolean; renderizado: boolean; fpsAlvo: number }` e `opcoes = { aoDegradar: (motivo: string) => void }`.

Sem `detect-gpu`, sem Battery Status, sem segunda pipeline: o guia da vgpu
recomenda explicitamente não adotar o padrão completo enquanto o shader ainda
está sendo calibrado, e aponta este par — monitor de quadro mais queda de DPR —
como o menor passo útil.

- [ ] **Step 1: Escrever o teste que falha**

O monitor é puro: alimentado com amostras sintéticas, sem navegador e sem relógio.

`tests/unit/frame-health.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { criarMonitorDeQuadro } from '../../componentes/heroi/frame-health.ts';

const amostra = (deltaMs: number) => ({ deltaMs, ativo: true, renderizado: true, fpsAlvo: 30 });

describe('o monitor de saúde de quadro', () => {
  it('não pede queda quando o FPS está no alvo', () => {
    const aoDegradar = vi.fn();
    const m = criarMonitorDeQuadro({ aoDegradar });
    for (let i = 0; i < 200; i++) m.registrar(amostra(1000 / 30));
    expect(aoDegradar).not.toHaveBeenCalled();
  });

  it('pede queda quando o FPS fica sob 80% do alvo por 2 s de tempo ativo', () => {
    const aoDegradar = vi.fn();
    const m = criarMonitorDeQuadro({ aoDegradar });
    // 20 fps = 50 ms por quadro. 2 s de tempo ativo = 40 quadros.
    for (let i = 0; i < 60; i++) m.registrar(amostra(50));
    expect(aoDegradar).toHaveBeenCalledOnce();
    expect(aoDegradar).toHaveBeenCalledWith('frame-health');
  });

  it('não pede queda antes de 2 s, mesmo com FPS ruim', () => {
    const aoDegradar = vi.fn();
    const m = criarMonitorDeQuadro({ aoDegradar });
    for (let i = 0; i < 10; i++) m.registrar(amostra(50));
    expect(aoDegradar).not.toHaveBeenCalled();
  });

  it('pede queda uma vez só, nunca em sequência', () => {
    const aoDegradar = vi.fn();
    const m = criarMonitorDeQuadro({ aoDegradar });
    for (let i = 0; i < 400; i++) m.registrar(amostra(50));
    expect(aoDegradar).toHaveBeenCalledOnce();
  });

  it('um intervalo acima de 250 ms reinicia a janela, em vez de contar como queda', () => {
    const aoDegradar = vi.fn();
    const m = criarMonitorDeQuadro({ aoDegradar });
    for (let i = 0; i < 30; i++) m.registrar(amostra(50));
    m.registrar(amostra(4000)); // aba oculta, ociosidade
    for (let i = 0; i < 30; i++) m.registrar(amostra(50));
    // A primeira janela foi descartada; a segunda ainda não fechou 2 s.
    expect(aoDegradar).not.toHaveBeenCalled();
  });

  it('ignora quadro inativo', () => {
    const aoDegradar = vi.fn();
    const m = criarMonitorDeQuadro({ aoDegradar });
    for (let i = 0; i < 200; i++) {
      m.registrar({ deltaMs: 50, ativo: false, renderizado: true, fpsAlvo: 30 });
    }
    expect(aoDegradar).not.toHaveBeenCalled();
  });

  it('ignora tique que não apresentou quadro', () => {
    const aoDegradar = vi.fn();
    const m = criarMonitorDeQuadro({ aoDegradar });
    for (let i = 0; i < 200; i++) {
      m.registrar({ deltaMs: 50, ativo: true, renderizado: false, fpsAlvo: 30 });
    }
    expect(aoDegradar).not.toHaveBeenCalled();
  });

  it('reiniciar zera a janela', () => {
    const aoDegradar = vi.fn();
    const m = criarMonitorDeQuadro({ aoDegradar });
    for (let i = 0; i < 30; i++) m.registrar(amostra(50));
    m.reiniciar();
    for (let i = 0; i < 30; i++) m.registrar(amostra(50));
    expect(aoDegradar).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

```bash
npm test -- tests/unit/frame-health.test.ts
```

Esperado: FALHA com módulo não encontrado.

- [ ] **Step 3: Escrever `componentes/heroi/frame-health.ts`**

```ts
// Política de saúde de quadro. Pura de propósito: sem relógio, sem navegador,
// alimentada por amostras. É o teste que decide se ela está certa, não a tela.
//
// Não medir a taxa crua de requestAnimationFrame: um cap intencional de 30 fps
// ou um monitor de 120 Hz produzem queda falsa. Medir quadro APRESENTADO
// contra o alvo que o trabalho realmente tem.

const FRACAO_DO_ALVO = 0.8;
const JANELA_MS = 2000;
const INTERVALO_DE_CORTE_MS = 250;

export interface AmostraDeQuadro {
  deltaMs: number;
  ativo: boolean;
  renderizado: boolean;
  fpsAlvo: number;
}

export function criarMonitorDeQuadro({ aoDegradar }: { aoDegradar: (motivo: string) => void }) {
  let acumuladoMs = 0;
  let quadros = 0;
  let jaDegradou = false;

  function reiniciar() {
    acumuladoMs = 0;
    quadros = 0;
  }

  return {
    reiniciar,
    registrar(amostra: AmostraDeQuadro) {
      if (jaDegradou) return;
      if (!amostra.ativo || !amostra.renderizado) return;

      // Aba oculta ou ociosidade: a janela é descartada, não contada como
      // queda. Um intervalo de 4 s não é o site engasgando.
      if (amostra.deltaMs > INTERVALO_DE_CORTE_MS) {
        reiniciar();
        return;
      }

      acumuladoMs += amostra.deltaMs;
      quadros += 1;
      if (acumuladoMs < JANELA_MS) return;

      const fpsApresentado = (quadros * 1000) / acumuladoMs;
      if (fpsApresentado < amostra.fpsAlvo * FRACAO_DO_ALVO) {
        jaDegradou = true;
        aoDegradar('frame-health');
        return;
      }
      reiniciar();
    },
  };
}
```

Nada volta a subir sozinho: `jaDegradou` é de mão única. O FPS apresentado
melhora no instante em que a qualidade cai, o que argumentaria imediatamente pela
volta — e aí o herói oscilaria para sempre. Só o visitante reverteria, e esta
rodada não expõe controle para isso.

- [ ] **Step 4: Rodar para ver passar**

```bash
npm test -- tests/unit/frame-health.test.ts
```

Esperado: 8 passando.

- [ ] **Step 5: Ligar o monitor ao renderer**

Em `componentes/heroi/renderer.ts`:

1. crie a superfície com `autoResize: false` e um DPR que você controla —
   `Math.min(Math.max(devicePixelRatio, 1), 2)` no começo;
2. dentro do laço de quadro, chame
   `monitor.registrar({ deltaMs, ativo: visivel && intersectando, renderizado: true, fpsAlvo: 30 })`;
3. no `aoDegradar`, fixe o DPR em `1`, redimensione a superfície e os alvos, e
   chame `monitor.reiniciar()`;
4. se depois da queda o laço ainda não sustentar — um segundo monitor, agora com
   `jaDegradou` próprio — pare o laço e deixe o pôster. Um sinalizador
   `desligado` no componente basta: o `Canvas` volta `pintando` para `false` e o
   CSS devolve `opacity: 0`.

**Deixe a superfície fora do `autoResize`.** Ela relê `devicePixelRatio` a cada
quadro e sobrescreveria o DPR 1 da degradação — o modo de falha exato que o guia
da vgpu lista como anti-padrão.

- [ ] **Step 6: Commit**

```bash
npm test && npm run typecheck
git add -A
git commit -m "herói: degradação por saúde de quadro, com queda de DPR antes do desligamento"
```

---

## Tarefa 21: Medir o chunk do herói contra o limiar declarado

**Files:**
- Create: `ferramentas/medir.mjs`, `tests/build/peso-heroi.test.ts`
- Test: `tests/build/peso-heroi.test.ts`

**Interfaces:**
- Consumes: `out/` depois de `npm run build`; `baseline-main-ed68bd4/` para a comparação da Tarefa 23.
- Produces, de `ferramentas/medir.mjs`: `brotli(caminho: string): number`; `medirRota(raiz: string, rota: string): { rota: string; documento: number; css: number; js: number; total: number }`; `medirHeroi(raiz: string): number`. As três recebem a raiz como primeiro argumento de propósito — é o que permite medir `out/` e `baseline-main-ed68bd4/` com o mesmo instrumento.

**O limiar é 95 kB brotli, e foi declarado na spec §8 antes de qualquer medição.**
A conta: 11 806 B br de WGSL + 6 422 B br do TS do exemplo ≈ 18 kB nosso, deixando
~77 kB para o runtime da vgpu, estimado em 40–70 kB br. **Se estourar, registre o
número real e não suba o limiar** — está escrito assim na tabela de riscos.

- [ ] **Step 1: Escrever o medidor**

`ferramentas/medir.mjs`:

```js
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

function listar(raiz, sufixo) {
  const achados = [];
  for (const entrada of readdirSync(raiz)) {
    const caminho = join(raiz, entrada);
    if (statSync(caminho).isDirectory()) achados.push(...listar(caminho, sufixo));
    else if (entrada.endsWith(sufixo)) achados.push(relative(raiz, caminho));
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
```

- [ ] **Step 2: Escrever o teste do limiar**

`tests/build/peso-heroi.test.ts`:

```ts
import { execFileSync } from 'node:child_process';
import { beforeAll, describe, expect, it } from 'vitest';
import { medirHeroi, medirRota } from '../../ferramentas/medir.mjs';

const LIMIAR_HEROI_BR = 97_280; // 95 kB, declarado na spec §8 antes de medir

describe('o peso do herói', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
  }, 300_000);

  it('mede alguma coisa: o herói não pode custar zero', () => {
    // Piso, não só teto. `medirHeroi` calcula home − sobre. Se o Next puser o
    // chunk do herói num pedaço compartilhado que TODA rota baixa, a diferença
    // dá ~0 e o teste do limiar passaria medindo nada — um verde que não prova
    // nada é pior que um vermelho. Se este teste falhar, a medida por diferença
    // é inválida para este build: troque para atribuição por chunk (ver o
    // Step 3) antes de confiar no número do teste seguinte.
    expect(medirHeroi('out')).toBeGreaterThan(10_240);
  });

  it('o chunk do herói cabe no limiar declarado', () => {
    const bytes = medirHeroi('out');
    console.log(`chunk do herói: ${bytes} B brotli (limiar ${LIMIAR_HEROI_BR})`);
    expect(bytes).toBeLessThanOrEqual(LIMIAR_HEROI_BR);
  });

  it('as rotas sem herói não pagam por ele', () => {
    const sobre = medirRota('out', 'pt/sobre/index.html');
    const comoEFeito = medirRota('out', 'pt/como-e-feito/index.html');
    // As duas carregam o mesmo piso de framework, sem nada do canvas.
    expect(Math.abs(sobre.js - comoEFeito.js)).toBeLessThan(2_048);
  });

  it('a casca de / não carrega o herói', () => {
    const casca = medirRota('out', 'index.html');
    const home = medirRota('out', 'pt/index.html');
    expect(casca.js).toBeLessThan(home.js);
  });
});
```

- [ ] **Step 3: Rodar e registrar o número**

```bash
npm test -- tests/build/peso-heroi.test.ts
node ferramentas/medir.mjs out
```

Anote a saída inteira — ela entra no relatório da Tarefa 23.

**Se o teste de limiar falhar**, não toque no limiar: registre o número real,
marque o teste com `.fails()` documentando que é achado conhecido, e leve a
diferença para a Tarefa 23.

**Se o teste de piso falhar** (herói medindo ~0), a medida por diferença não
serve para este build: o Next pôs o canvas num chunk compartilhado. Troque
`medirHeroi` por atribuição direta — some o brotli dos chunks que aparecem em
`pt/index.html` e **não** em `pt/sobre/index.html`:

```js
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
```

Se **nem isso** achar chunk exclusivo da home, então o canvas está mesmo dentro
do pedaço comum — e isso é o achado a registrar, não um número a forjar.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "medida: o peso do chunk do herói contra o limiar declarado na spec"
```

---

## Tarefa 22: O pôster gerado do shader

**Files:**
- Create: `ferramentas/capturar-poster.md`
- Modify: `public/poster/heroi.webp`
- Test: `tests/build/poster.test.ts`

**Interfaces:**
- Consumes: o site servido em `localhost:4173`.
- Produces: `public/poster/heroi.webp` substituído.

Hoje quem não tem WebGPU, ou pediu movimento reduzido, vê uma nebulosa enquanto
todo o resto vê um buraco negro. O fallback precisa ser o mesmo assunto.

**Rede de segurança declarada na spec §5:** se a captura não sair nesta máquina
sem placa, o `heroi.webp` atual fica e isso vira nota no relatório — **não é
bloqueio da rodada.**

- [ ] **Step 1: Escrever o teste que falha**

`tests/build/poster.test.ts`:

```ts
import { statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('o pôster do herói', () => {
  it('existe', () => {
    expect(() => statSync('public/poster/heroi.webp')).not.toThrow();
  });

  it('cabe no orçamento do LCP: até 60 kB', () => {
    // O pôster atual tem 35 372 B. O gerado pode crescer — um buraco negro com
    // disco tem mais detalhe que uma nebulosa difusa — mas não sem limite: ele
    // é o elemento de LCP e entra no caminho crítico.
    expect(statSync('public/poster/heroi.webp').size).toBeLessThan(61_440);
  });
});
```

- [ ] **Step 2: Preparar o ambiente de captura**

```bash
npm i -g agent-browser@latest
sudo pacman -S --needed vulkan-swrast xorg-server-xvfb
agent-browser doctor --webgpu --headed
```

O `doctor` roda uma sonda de duas etapas com verificação de pixel. Esperado:
renderização por `google swiftshader` e captura passando. **Se o `doctor`
reprovar, pule para o Step 6** — é o caso da rede de segurança.

Nunca use headless sem `--webgpu`: o Chrome não expõe WebGPU por padrão e produz
um canvas preto em silêncio. E no Linux o headless captura o canvas como preto
mesmo com WebGPU — por isso `--headed`, com Xvfb entrando sozinho se `DISPLAY`
faltar.

- [ ] **Step 3: Capturar**

```bash
npm run build
node tests/support/servidor-estatico.mjs &
SERVIDOR=$!
SESSAO=sephir-heroi

agent-browser --session "$SESSAO" --webgpu --headed open http://localhost:4173/pt/
agent-browser --session "$SESSAO" --webgpu --headed wait 6000
agent-browser --session "$SESSAO" --webgpu --headed eval \
  'new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))'
agent-browser --session "$SESSAO" --webgpu --headed screenshot /tmp/heroi-bruto.png
agent-browser --session "$SESSAO" close
kill $SERVIDOR
```

SwiftShader é software: seis segundos de espera e dois `requestAnimationFrame`
antes de capturar não é superstição, é o tempo que a cena leva para estabilizar
sem placa.

- [ ] **Step 4: Validar que a captura não é preta**

`screenshot` pode ter sucesso com WebGPU falhado e imagem preta. Sempre validar
pixel:

```bash
magick identify -format '%[fx:standard_deviation]\n' /tmp/heroi-bruto.png
```

Esperado: um número bem acima de `0.01`. Se vier `0` ou quase, a cena não pintou
— **vá para o Step 6.**

- [ ] **Step 5: Converter e instalar**

```bash
cwebp -q 80 -resize 1920 0 /tmp/heroi-bruto.png -o /tmp/heroi.webp
ls -l /tmp/heroi.webp
cp /tmp/heroi.webp public/poster/heroi.webp
npm test -- tests/build/poster.test.ts
```

Se passar de 60 kB, baixe a qualidade em passos de 5 até caber. Depois **abra a
home no navegador e confira**: o pôster novo precisa funcionar sob os dois
gradientes sem matar o contraste do `<h1>`. Se matar, recapture com o
`centerFade` ajustado — não mexa no gradiente.

- [ ] **Step 6: Se a captura não saiu — registrar e seguir**

Escreva `ferramentas/capturar-poster.md` com: o comando exato que você tentou, a
saída do `agent-browser doctor`, e o desvio-padrão que o `identify` devolveu.
Mantenha o `heroi.webp` original. **Isto não bloqueia a rodada** — é a nota que
a Tarefa 23 vai incorporar.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "pôster: o fallback passa a mostrar a mesma cena que o canvas"
```

ou, no caminho da rede de segurança:

```bash
git add -A
git commit -m "pôster: a captura headless não saiu nesta máquina, e o porquê está registrado"
```

---

## Tarefa 23: Os quatro números e o veredito

**Files:**
- Create: `docs/superpowers/relatorios/2026-XX-XX-comparacao.md`
- Test: nenhum — é tarefa de relatório.

**Interfaces:**
- Consumes: `ferramentas/medir.mjs`; `baseline-main-ed68bd4/`; a spec §8.
- Produces: o relatório que fecha o experimento.

- [ ] **Step 1: Medir as duas árvores com o mesmo instrumento**

```bash
npm run build
node ferramentas/medir.mjs out > /tmp/zero.txt
node ferramentas/medir.mjs baseline-main-ed68bd4 > /tmp/main.txt
diff -y /tmp/main.txt /tmp/zero.txt || true
```

O `baseline-main-ed68bd4/` é o build do `main` em `ed68bd4`, preservado antes de
a branch órfã nascer. Medir os dois com o **mesmo** script é o que torna a
comparação honesta — dois medidores diferentes mediriam duas coisas.

- [ ] **Step 2: Medir LCP e CLS nos dois**

```bash
node tests/support/servidor-estatico.mjs out 4173 &
ZERO=$!
npx lhci collect --url=http://localhost:4173/pt/ --numberOfRuns=5 \
  --settings.preset=perf --settings.formFactor=mobile
kill $ZERO

node tests/support/servidor-estatico.mjs baseline-main-ed68bd4 4174 &
BASE=$!
npx lhci collect --url=http://localhost:4174/pt/ --numberOfRuns=5 \
  --settings.preset=perf --settings.formFactor=mobile
kill $BASE
```

Cinco execuções com mediana, porque uma só mede o ruído da máquina. As duas
árvores são servidas pelo **mesmo** servidor, mudando só a raiz e a porta — dois
servidores diferentes mediriam duas coisas diferentes. O servidor aceita a raiz
em `argv[2]` e a porta em `argv[3]` desde a Tarefa 17.

- [ ] **Step 3: Contar o custo da rodada**

Separe **brainstorm** de **implementação**: a sessão de brainstorm produziu a
spec e o plano; a implementação consumiu o plano. Misturar os dois compara maçã
com pomar, e isso está listado como risco na spec §10.

O canvas de design custou US$ 3,32, medido nos transcritos. Os relatórios do
`main` no vault `sephir-site-workspace` trazem o que a pipeline de portões
gastou.

- [ ] **Step 4: Escrever o relatório**

Estrutura obrigatória — **preencha com números medidos, nunca com impressão:**

```markdown
# Redesign do zero — o que os quatro números disseram

## A hipótese, como estava escrita

[copiar literalmente da spec §1, sem suavizar]

## Os quatro números

| Número | Limiar declarado | Medido | Veredito |
|---|---|---|---|
| chunk do herói | 95 kB br | ? | ? |
| LCP (móvel, mediana de 5) | não pior que o main | main ? → zero ? | ? |
| CLS | ≤ 0,02 e não pior que o main | main ? → zero ? | ? |
| axe | 0 violações | ? | ? |

## O custo

| | brainstorm | implementação | total |
|---|---|---|---|
| tempo de parede | | | |
| US$ | | | |

Contra: US$ 3,32 do canvas de design, e [o que os relatórios do main registram].

## O veredito

A hipótese [foi confirmada / falhou]. [Se falhou, dizer em qual número e por quê,
sem atenuar.]

## O que o experimento descobriu sobre processo

1. **O orçamento da pipeline mirou na coisa errada.** 25 kB orçados de CSS, 1,5 kB
   gastos, e 149 kB de JS passando sem orçamento nenhum — 96,9% do peso da home.
   [confirmar com o medido]
2. **As quatro camadas de teste convergiram para os oráculos W\* descartados.**
   [dizer quais, nominalmente, e qual medida cada uma reproduziu] Se dois
   processos independentes chegam nas mesmas medidas, a medida era necessária e
   a cerimônia em volta é que era opcional.
3. [o que mais apareceu]

## Divergências conscientes do mock

- grade dos portões em 4 colunas, não 8 (Tarefa 10)
- [as demais]

## O que ficou por fazer

- [devlog, e o que mais]
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "relatório: os quatro números do experimento, e o que eles disseram sobre processo"
```

- [ ] **Step 6: Abrir as duas branches lado a lado**

```bash
git log --oneline main | wc -l
git log --oneline zero/redesign | wc -l
git diff --stat main zero/redesign -- ':!docs'
```

Conte commits, arquivos e linhas. Não é medida de qualidade — é contexto para
quem ler o relatório entender o tamanho das duas coisas que estão sendo
comparadas.
