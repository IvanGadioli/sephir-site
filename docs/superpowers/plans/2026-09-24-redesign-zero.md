# Redesign do zero — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruir o site do Iniciativa Sephir do zero — cinco rotas estáticas fiéis aos artboards, com herói WebGPU — sem a pipeline de portões, para comparar processo contra o `main`.

**Architecture:** Next 16 App Router com `output: 'export'`. Um único root layout (`app/layout.tsx`) com `<html lang="pt-BR">`; as rotas de conteúdo vivem sob `app/[lang]/` com `generateStaticParams` devolvendo `['pt']`. Seis componentes de servidor cobrem os padrões que os artboards repetem; `componentes/heroi/` é o único ponto de entrada cliente do site. Tokens de cor e fonte são **gerados** de `lib/marca.ts` por script, e um teste prova que o CSS commitado é exatamente o que o script emite.

**Tech Stack:** Next 16.3.4, React 19.2.8, TypeScript 7.0.2, Vitest 5.0.0, Playwright 1.62.1 (Chromium do sistema), axe-core 4.13, `@lhci/cli` 0.15, vgpu (versão fixada na Tarefa 18), `brotli` do sistema, `agent-browser` para captura headless.

**Spec:** `docs/superpowers/specs/2026-09-24-redesign-zero-design.md` — leia antes da primeira tarefa. O plano argumenta a partir dela.

## Global Constraints

Todo requisito abaixo vale para **todas** as tarefas.

- **Node 26.7.0** (`.node-version`), npm 12.0.2. Chromium do sistema em `/usr/bin/chromium` (152.0.7977.82) — nunca baixar o binário do Playwright.
- **Export estático:** `output: 'export'`, `trailingSlash: true`, `images: { unoptimized: true }`. Sem rota de API, sem middleware, sem Server Action, sem `revalidate`. Sem `basePath` e sem `assetPrefix`.
- **`'use client'` só dentro de `componentes/heroi/`.** Nenhuma rota, nenhum layout e nenhum dos seis componentes é cliente.
- **Cores, literais:** `--cor-void: #05070E`, `--cor-void2: #0C1220`, `--cor-void3: #141C30`, `--cor-amber: #E8963A`, `--cor-amber-dim: #C77A28`, `--cor-teal: #3FB89E`, `--cor-teal-dim: #329680`, `--cor-stardust: #F4EFE6`, `--cor-muted: #8A93A8`, `--cor-faint: #4A5468`, `--cor-border: rgba(244, 239, 230, 0.10)`, `--cor-border-strong: rgba(244, 239, 230, 0.18)`. Nunca hardcode hex em componente — sempre `var(--cor-*)`.
- **Fontes:** display `'Space Grotesk', system-ui, sans-serif`; mono `'Space Mono', ui-monospace, monospace`; corpo `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` — o corpo **não baixa byte de fonte**.
- **Peso de `h1`, `h2`, `h3`: `300`.** É o valor dos sete artboards, e diverge do `weight: 500` do `theme.ts`. A divergência está anotada em `lib/marca.ts` e é deliberada (spec §6.1).
- **Nomenclatura travada, não inverter:** `Sephir Studio` = a empresa (só no wordmark e no rodapé). `Iniciativa Sephir` = o jogo, protagonista, é o `<h1>` e o `<title>`. `Semente Cósmica` = fase, só como selo discreto, **nunca** como título.
- **CNPJ literal no rodapé:** `Sephir Studio Inova Simples (I.S.) — CNPJ 63.037.641/0001-30`.
- **Todo texto visível em português**, dentro dos componentes. Sem biblioteca de i18n, sem catálogo de mensagens.
- **Commits frequentes**, um por tarefa no mínimo, em português, no imperativo ou no presente.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `package.json`, `tsconfig.json`, `tsconfig.tests.json`, `next.config.ts`, `.node-version` | configuração; dois programas de tipo (produção × testes) |
| `app/layout.tsx` | o único `<html>`/`<body>`; importa os dois CSS; `metadata.title` |
| `app/page.tsx` | casca de `/`: `<meta refresh>` para `/pt/` mais um `<a>` visível |
| `app/[lang]/layout.tsx` | `{children}` + `<Rodape/>`; `generateStaticParams` → `['pt']` |
| `app/[lang]/page.tsx` | Main — herói, seções 01/02/03 |
| `app/[lang]/sobre/page.tsx` | Sobre — faixa com imagem, seções 01–05 |
| `app/[lang]/como-e-feito/page.tsx` | Como é feito — faixa sem imagem, os oito portões |
| `app/not-found.tsx` | o 404 do artboard `Erro404` |
| `lib/marca.ts` | cópia carimbada de `theme.ts`; fonte única de cor e fonte |
| `lib/rotas.ts` | tabela de rotas; fonte do menu e dos testes |
| `ferramentas/gerar-tokens.mjs` | emite `estilos/tokens.css` de `lib/marca.ts` |
| `estilos/tokens.css` | **gerado**, não editar à mão |
| `estilos/base.css` | `@font-face`, reset, tipografia de elemento, classes dos componentes |
| `componentes/Topo.tsx` … `Seta.tsx` | os seis padrões dos artboards |
| `componentes/heroi/index.tsx`, `Canvas.tsx`, `renderer.ts`, `pipeline.ts`, `*.wgsl` | o único ponto de entrada cliente |
| `tests/unit/`, `tests/build/`, `tests/e2e/` | as quatro camadas da spec §7 |
| `ferramentas/medir.mjs` | peso brotli por rota e do chunk do herói; Tarefas 21 e 23 |
| `docs/superpowers/relatorios/` | a linha de base (Tarefa 0) e a comparação final (Tarefa 23) |

---

## Tarefa 0: A linha de base do `main`, antes de escrever uma linha

**Files:**
- Create: `docs/superpowers/relatorios/2026-09-24-linha-de-base-main.md`
- Test: nenhum — é tarefa de medição.

**Interfaces:**
- Consumes: `baseline-main-ed68bd4/`, o build do `main` em `ed68bd4` preservado antes de a branch órfã nascer.
- Produces: os números de LCP e CLS que a spec §8 usa como limiar ("não pior que o `main`").

A spec §8 exige que os limiares sejam declarados **antes** de a vgpu ser medida.
O limiar de peso do herói já está declarado (95 kB br, spec §8). Faltam LCP e
CLS, que são relativos ao `main` — e o número do `main` precisa existir antes,
senão "não pior" não quer dizer nada.

O peso brotli do `main` já foi medido e está na spec §3. Esta tarefa fecha o resto.

- [ ] **Step 1: Confirmar que a linha de base está intacta**

```bash
cd ~/Documents/sephir-site
ls baseline-main-ed68bd4/pt/index.html baseline-main-ed68bd4/404.html
```

Esperado: os dois existem. Se não, reconstrua:
`git stash && git checkout main && npm ci && npm run build && mv out baseline-main-ed68bd4 && git checkout zero/redesign`.

- [ ] **Step 2: Servir a linha de base**

Sem `package.json` ainda, use um servidor de uma linha:

```bash
npx -y serve baseline-main-ed68bd4 -l 4174 &
SERVIDOR=$!
```

- [ ] **Step 3: Medir LCP e CLS, com mediana de cinco execuções**

Uma execução só mede o ruído da máquina, não o site.

```bash
npx -y @lhci/cli@0.15 collect \
  --url=http://localhost:4174/pt/ \
  --numberOfRuns=5 \
  --settings.formFactor=mobile \
  --settings.preset=perf
npx -y @lhci/cli@0.15 assert --preset=lighthouse:no-pwa || true
kill $SERVIDOR
```

Colha da saída: **LCP** (`largest-contentful-paint`), **CLS**
(`cumulative-layout-shift`) e o peso total transferido.

- [ ] **Step 4: Escrever a linha de base**

`docs/superpowers/relatorios/2026-09-24-linha-de-base-main.md`:

```markdown
# Linha de base — `main` em `ed68bd4`

Medido em 2026-09-24, antes de qualquer código da branch `zero/redesign`.
Instrumento: `@lhci/cli` 0.15, perfil móvel, mediana de 5 execuções, sobre
`baseline-main-ed68bd4/` servido estático.

## Peso brotli, por rota

| rota | documento | CSS | JS | total |
|---|---|---|---|---|
| `/pt/` | 3 325 B | 1 493 B | 145 877 B | 153 763 B |
| `/pt/sobre/` | 2 894 B | 1 493 B | 145 877 B | 153 332 B |
| `404.html` | 1 256 B | 1 493 B | 145 877 B | 151 694 B |
| `/` (casca) | 1 000 B | 1 493 B | 145 877 B | 151 438 B |

## Núcleos vitais

| métrica | mediana de 5 | vira limiar de |
|---|---|---|
| LCP | ___ ms | "não pior que isto" |
| CLS | ___ | "≤ 0,02 **e** não pior que isto" |
| transferido | ___ kB | contexto |

## Nota

Estes números são o denominador do experimento. Não voltar aqui para ajustá-los
depois de medir a branch nova — se algo estiver errado nesta medição, o conserto
é refazer as duas, não retocar uma.
```

Substitua os `___` pelos valores medidos. Se o Lighthouse não rodar nesta
máquina, registre isso explicitamente no lugar dos números e trate LCP e CLS como
não medidos na Tarefa 23 — **um número ausente e declarado é honesto; um número
inventado não é.**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "linha de base: o que o main entrega, medido antes de a branch nova existir"
```

---

## Tarefa 1: Esqueleto que compila vazio

**Files:**
- Create: `package.json`, `.node-version`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `estilos/base.css`
- Create: `public/fontes/*.woff2`, `public/poster/heroi.webp` (resgatados do `main`)
- Test: `tests/build/casca.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `next build` gera `out/index.html`; scripts npm `build`, `test`, `typecheck`.

- [ ] **Step 1: Resgatar os três binários do `main`**

```bash
cd ~/Documents/sephir-site
git checkout main -- public/fontes public/poster
ls -l public/fontes public/poster
```

Esperado: `space-grotesk-latin.woff2` (22284 B), `space-mono-latin.woff2` (15836 B), `heroi.webp` (35372 B). Nada mais vem do `main` — o resto é escrito.

- [ ] **Step 2: Escrever `package.json`**

```json
{
  "name": "sephir-site",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "typecheck": "tsc -p tsconfig.tests.json --noEmit",
    "tokens": "node ferramentas/gerar-tokens.mjs"
  },
  "dependencies": {
    "next": "16.3.4",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@axe-core/playwright": "^4.13.0",
    "@lhci/cli": "^0.15.1",
    "@playwright/test": "1.62.1",
    "@types/node": "26.4.1",
    "@types/react": "19.2.18",
    "@types/react-dom": "19.2.7",
    "axe-core": "^4.13.0",
    "typescript": "7.0.2",
    "vitest": "5.0.0"
  }
}
```

E `.node-version` com o conteúdo `26.7.0`.

- [ ] **Step 3: Escrever `next.config.ts`**

```ts
import type { NextConfig } from 'next';

// `adr-fab-001` fica de pé: export estático, sem servidor por trás. É
// restrição do Cloudflare Pages, não preferência — ver spec §1.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
```

- [ ] **Step 4: Escrever `tsconfig.json`**

Dois programas de tipo, de propósito: produção em `tsconfig.json`, testes em `tsconfig.tests.json`. Assim um teste que importa um módulo de tarefa futura não trava o `next build`.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["node"],
    "allowJs": true,
    "incremental": true,
    "jsx": "react-jsx",
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "lib", "app", "componentes", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

E `tsconfig.tests.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "incremental": true, "tsBuildInfoFile": "./tsconfig.tests.tsbuildinfo" },
  "include": ["next-env.d.ts", "lib", "app", "componentes", "tests", "ferramentas"]
}
```

- [ ] **Step 5: Escrever `estilos/base.css` mínimo**

Só o suficiente para a casca compilar. A tipografia completa é da Tarefa 2.

```css
@font-face {
  font-family: 'Space Grotesk';
  src: url('/fontes/space-grotesk-latin.woff2') format('woff2');
  font-weight: 300 500;
  font-style: normal;
  font-display: optional;
}

@font-face {
  font-family: 'Space Mono';
  src: url('/fontes/space-mono-latin.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: optional;
}

*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; padding: 0; }
```

- [ ] **Step 6: Escrever `app/layout.tsx`**

Um único root layout. O `lang` é fixo em `pt-BR` — com `IDIOMAS = ['pt']` derivar do segmento não muda nada, e `pt-BR` é mais exato que `pt`. O `<title>` não é enfeite: sem ele o axe reprova `document-title` como `serious`.

```tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../estilos/tokens.css';
import '../estilos/base.css';

export const metadata: Metadata = {
  title: 'Iniciativa Sephir',
  description: 'Simulação física do cosmos, jogável.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
```

`estilos/tokens.css` ainda não existe — crie-o vazio agora (`touch estilos/tokens.css`); a Tarefa 2 o substitui pelo gerado.

- [ ] **Step 7: Escrever `app/page.tsx`, a casca de `/`**

React 19 iça `<meta>` para o `<head>`. O `<a>` visível existe para quem tem o refresh bloqueado, e porque um documento sem conteúdo navegável é um beco sem saída.

```tsx
export default function Casca() {
  return (
    <>
      <meta httpEquiv="refresh" content="0; url=/pt/" />
      <a href="/pt/">Iniciativa Sephir</a>
    </>
  );
}
```

- [ ] **Step 8: Escrever o teste que falha**

`tests/build/casca.test.ts`:

```ts
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

describe('a casca de /', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
  }, 300_000);

  it('gera out/index.html', () => {
    const html = readFileSync('out/index.html', 'utf8');
    expect(html).toContain('<html lang="pt-BR"');
  });

  it('encaminha para /pt/ por meta refresh', () => {
    const html = readFileSync('out/index.html', 'utf8');
    expect(html).toMatch(/http-equiv="refresh"[^>]*content="0; url=\/pt\/"/);
  });

  it('oferece um link visível para o mesmo destino', () => {
    const html = readFileSync('out/index.html', 'utf8');
    expect(html).toContain('href="/pt/"');
  });
});
```

E `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/build/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    // Vários arquivos de tests/build/ rodam `npm run build` no beforeAll. Em
    // paralelo disputam out/ e .next/, e o vermelho vem do runner, não do site.
    fileParallelism: false,
    testTimeout: 300_000,
    hookTimeout: 600_000,
  },
});
```

- [ ] **Step 9: Instalar e rodar o teste para ver falhar**

```bash
npm install
npm test -- tests/build/casca.test.ts
```

Esperado: FALHA. Sem `app/[lang]/` ainda não há `/pt/`, mas `out/index.html` deve existir — a falha esperada aqui é só se algo da configuração estiver errado. Se passar de primeira, confirme que `out/index.html` existe de verdade antes de seguir.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "esqueleto: o export estático compila e a casca de / encaminha para /pt/"
```

---

## Tarefa 2: Tokens gerados da marca, com guarda de deriva

**Files:**
- Create: `lib/marca.ts`, `ferramentas/gerar-tokens.mjs`, `estilos/tokens.css` (gerado)
- Modify: `estilos/base.css`
- Test: `tests/unit/tokens.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `lib/marca.ts` exporta `colors`, `fonts`, `brand` (objetos `as const`). `ferramentas/gerar-tokens.mjs` exporta `gerarTokens(): string`.

- [ ] **Step 1: Escrever `lib/marca.ts`**

Cópia carimbada de `~/Documents/sephir/sephir-brand/00-identidade/tokens/theme.ts`, lida em 2026-09-24. Só o que o site usa: `colors`, `fonts`, `brand`. A escala `type` do original **não** entra — o peso 300 dos artboards a contradiz, e importar uma escala que não se obedece é convidar a deriva.

```ts
/**
 * lib/marca.ts — cópia carimbada da identidade oficial.
 *
 * Origem: ~/Documents/sephir/sephir-brand/00-identidade/tokens/theme.ts
 * Carimbada em: 2026-09-24
 *
 * Fonte única de cor e fonte deste repositório. Não editar valor aqui sem
 * antes mudar a origem. `estilos/tokens.css` é GERADO daqui por
 * `npm run tokens` — não editar o CSS à mão.
 *
 * DIVERGÊNCIA DELIBERADA: o theme.ts de origem declara `weight: 500` para
 * hero/h1/h2. Os sete artboards do design declaram `font-weight: 300` para
 * h1, h2 e h3. Este site segue os artboards (spec §6.1), porque é contra o
 * artboard que a fidelidade é julgada. A escala `type` do original não foi
 * copiada para cá justamente para não criar duas verdades.
 */

export const colors = {
  void: '#05070E',
  void2: '#0C1220',
  void3: '#141C30',
  amber: '#E8963A',
  amberDim: '#C77A28',
  teal: '#3FB89E',
  tealDim: '#329680',
  stardust: '#F4EFE6',
  muted: '#8A93A8',
  faint: '#4A5468',
  border: 'rgba(244, 239, 230, 0.10)',
  borderStrong: 'rgba(244, 239, 230, 0.18)',
} as const;

export const fonts = {
  display: "'Space Grotesk', system-ui, sans-serif",
  // Corpo é pilha de sistema por decisão do titular: não baixa byte de fonte
  // para a maior massa de texto de qualquer página.
  body: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: "'Space Mono', ui-monospace, monospace",
} as const;

export const brand = {
  studio: 'Sephir Studio',
  product: 'Iniciativa Sephir',
  phase: 'Semente Cósmica',
  phaseBadge: 'fase Semente Cósmica · rumo à 1.0',
  tagline: 'Simulação física do cosmos, jogável.',
  cnpj: 'Sephir Studio Inova Simples (I.S.) — CNPJ 63.037.641/0001-30',
} as const;
```

- [ ] **Step 2: Escrever o gerador**

Node 26 faz type-stripping nativo, então o `.mjs` importa o `.ts` direto.

`ferramentas/gerar-tokens.mjs`:

```js
import { writeFileSync } from 'node:fs';
import { colors, fonts } from '../lib/marca.ts';

const kebab = (nome) => nome.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

export function gerarTokens() {
  const linhasCor = Object.entries(colors).map(([k, v]) => `  --cor-${kebab(k)}: ${v};`);
  const linhasFonte = Object.entries(fonts).map(([k, v]) => `  --fonte-${kebab(k)}: ${v};`);
  return [
    '/* GERADO por ferramentas/gerar-tokens.mjs a partir de lib/marca.ts.',
    ' * Não editar à mão: tests/unit/tokens.test.ts reprova qualquer divergência.',
    ' */',
    ':root {',
    ...linhasCor,
    '',
    ...linhasFonte,
    '}',
    '',
  ].join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(new URL('../estilos/tokens.css', import.meta.url), gerarTokens());
}
```

- [ ] **Step 3: Escrever o teste que falha**

`tests/unit/tokens.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { gerarTokens } from '../../ferramentas/gerar-tokens.mjs';
import { colors } from '../../lib/marca.ts';

describe('tokens.css', () => {
  it('é exatamente o que o gerador emite', () => {
    expect(readFileSync('estilos/tokens.css', 'utf8')).toBe(gerarTokens());
  });

  it('traz uma variável para cada cor da marca', () => {
    const css = readFileSync('estilos/tokens.css', 'utf8');
    for (const valor of Object.values(colors)) {
      expect(css).toContain(valor);
    }
  });

  it('não inventa cor fora da marca', () => {
    const css = readFileSync('estilos/tokens.css', 'utf8');
    const hexes = css.match(/#[0-9A-Fa-f]{6}/g) ?? [];
    const daMarca = new Set(Object.values(colors).map((c) => c.toUpperCase()));
    for (const hex of hexes) {
      expect(daMarca).toContain(hex.toUpperCase());
    }
  });
});
```

- [ ] **Step 4: Rodar para ver falhar**

```bash
npm test -- tests/unit/tokens.test.ts
```

Esperado: FALHA — `estilos/tokens.css` está vazio (criado na Tarefa 1).

- [ ] **Step 5: Gerar**

```bash
npm run tokens
```

- [ ] **Step 6: Rodar para ver passar**

```bash
npm test -- tests/unit/tokens.test.ts
```

Esperado: 3 passando.

- [ ] **Step 7: Completar `estilos/base.css`**

Acrescentar ao que a Tarefa 1 escreveu, depois dos dois `@font-face`:

```css
body {
  background: var(--cor-void);
  color: var(--cor-stardust);
  font-family: var(--fonte-body);
  font-size: 1.0625rem;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}

/* Peso 300 é o valor dos artboards, e diverge do theme.ts de propósito.
   Ver lib/marca.ts. */
h1, h2, h3 {
  font-family: var(--fonte-display);
  font-weight: 300;
  letter-spacing: -0.02em;
  line-height: 1.05;
}

a { color: var(--cor-amber); text-decoration: none; }
a:hover { color: var(--cor-amber-dim); }
a:focus-visible, summary:focus-visible {
  outline: 2px solid var(--cor-amber);
  outline-offset: 3px;
}

img { max-width: 100%; display: block; }

.mono {
  font-family: var(--fonte-mono);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.6875rem;
}

.envoltorio { max-width: 1200px; margin: 0 auto; padding-inline: clamp(1.5rem, 8vw, 154px); }
```

- [ ] **Step 8: Verificar que o build ainda passa e commitar**

```bash
npm run build && npm test
git add -A
git commit -m "tokens: cor e fonte geradas de lib/marca.ts, com guarda de deriva"
```

---

## Tarefa 3: A tabela de rotas

**Files:**
- Create: `lib/rotas.ts`
- Test: `tests/unit/rotas.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `IDIOMAS: readonly ['pt']`; `type Idioma = 'pt'`; `ROTAS: readonly { rota: string; arquivo: string }[]`; `HTML_ESPERADOS: readonly string[]`; `ITENS_MENU: readonly { rotulo: string; href: string | null; chave: ChaveMenu }[]`; `type ChaveMenu = 'projeto' | 'como-e-feito' | 'devlog' | 'sobre'`.

- [ ] **Step 1: Escrever o teste que falha**

`tests/unit/rotas.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { HTML_ESPERADOS, ITENS_MENU, ROTAS } from '../../lib/rotas.ts';

describe('a tabela de rotas', () => {
  it('declara as cinco rotas da spec', () => {
    expect(ROTAS.map((r) => r.rota)).toEqual([
      '/', '/pt/', '/pt/sobre/', '/pt/como-e-feito/',
    ]);
  });

  it('espera exatamente cinco arquivos HTML', () => {
    expect([...HTML_ESPERADOS]).toEqual([
      '404.html', 'index.html', 'pt/como-e-feito/index.html',
      'pt/index.html', 'pt/sobre/index.html',
    ]);
  });

  it('só aponta o menu para rota que existe, ou para nenhuma', () => {
    const conhecidas = new Set(ROTAS.map((r) => r.rota));
    for (const item of ITENS_MENU) {
      if (item.href === null) continue;
      const semFragmento = item.href.split('#')[0];
      expect(conhecidas).toContain(semFragmento);
    }
  });

  it('deixa devlog sem href, porque a página não existe', () => {
    const devlog = ITENS_MENU.find((i) => i.chave === 'devlog');
    expect(devlog?.href).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

```bash
npm test -- tests/unit/rotas.test.ts
```

Esperado: FALHA com "Cannot find module '../../lib/rotas.ts'".

- [ ] **Step 3: Escrever `lib/rotas.ts`**

```ts
// A tabela de rotas desta rodada. Fonte do menu e dos testes de árvore e de
// integridade de link — se um href não estiver aqui, o teste reprova.

export const IDIOMAS = ['pt'] as const;
export type Idioma = (typeof IDIOMAS)[number];

export interface Rota {
  readonly rota: string;
  readonly arquivo: string;
}

export const ROTAS: readonly Rota[] = [
  { rota: '/', arquivo: 'index.html' },
  { rota: '/pt/', arquivo: 'pt/index.html' },
  { rota: '/pt/sobre/', arquivo: 'pt/sobre/index.html' },
  { rota: '/pt/como-e-feito/', arquivo: 'pt/como-e-feito/index.html' },
];

export const ARQUIVO_404 = '404.html';

export const HTML_ESPERADOS: readonly string[] = [
  ARQUIVO_404,
  ...ROTAS.map((r) => r.arquivo),
].sort();

export type ChaveMenu = 'projeto' | 'como-e-feito' | 'devlog' | 'sobre';

export interface ItemMenu {
  readonly rotulo: string;
  readonly href: string | null;
  readonly chave: ChaveMenu;
}

// `devlog` sai com href nulo: a seção "Estado atual" da home declara que a
// página não existe, e prometer ao visitante uma página que não há é pior que
// um item apagado. Vira texto, não link — e sem `aria-disabled`, que num
// <span> sem papel é atributo proibido e o axe reporta.
export const ITENS_MENU: readonly ItemMenu[] = [
  { rotulo: 'o projeto', href: '/pt/#o-que-e', chave: 'projeto' },
  { rotulo: 'como é feito', href: '/pt/como-e-feito/', chave: 'como-e-feito' },
  { rotulo: 'devlog', href: null, chave: 'devlog' },
  { rotulo: 'sobre', href: '/pt/sobre/', chave: 'sobre' },
];
```

- [ ] **Step 4: Rodar para ver passar**

```bash
npm test -- tests/unit/rotas.test.ts
```

Esperado: 4 passando.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "rotas: a tabela que o menu e os testes de árvore consultam"
```

---

**Continua em `2026-09-24-redesign-zero-parte-2.md`** — Tarefas 4 a 23 (os seis componentes, as cinco páginas, o logo, o herói WebGPU, os testes de build e E2E, e a medição final).
