# Redesign do zero — plano, parte 2: os seis componentes

> Continuação de `2026-09-24-redesign-zero.md`. As **Global Constraints** daquele arquivo valem aqui integralmente. Leia a spec antes: `docs/superpowers/specs/2026-09-24-redesign-zero-design.md`.

Todas as tarefas desta parte usam a mesma camada de teste: **unit render**, com `renderToStaticMarkup` de `react-dom/server`. Sem jsdom, sem `@testing-library` — os seis componentes são de servidor e não têm estado, então a marcação estática é o contrato inteiro. Roda em milissegundos.

---

## Tarefa 4: `Topo`

**Files:**
- Create: `componentes/Topo.tsx`
- Modify: `estilos/base.css` (acrescentar as classes), `vitest.config.ts` (aceitar `.tsx`)
- Test: `tests/unit/Topo.test.tsx`

**Interfaces:**
- Consumes: `ITENS_MENU`, `ChaveMenu` de `lib/rotas.ts`. **Não** consome `brand`.
- Produces: `export function Topo({ ativo }: { ativo: ChaveMenu | null })`. Usado por `Faixa` (Tarefa 6) e pela home (Tarefa 10).

**Por que o wordmark é literal e não vem de `brand.studio`:** o lockup dos
artboards é bicolor — `Sephir` em âmbar, ` Studio` em stardust, dois `<span>`
irmãos. `brand.studio` é a string única `'Sephir Studio'`, e derivar duas metades
coloridas dela exigiria `split(' ')`, que quebra em silêncio no dia em que o nome
ganhar uma terceira palavra. Dois literais numa marca registrada e vinculada a
CNPJ são mais estáveis que um split. `brand` é a fonte para texto que **é** uma
string única — a tagline e o CNPJ do `Rodape`, na Tarefa 5.

- [ ] **Step 0: Liberar extensão explícita no programa de tipo de produção**

Este é o primeiro componente a importar um módulo do repositório, e o plano
escreve esses imports com extensão explícita (`from '../lib/rotas.ts'`,
`from './Topo.tsx'`). O TypeScript rejeita isso com **TS5097** a menos que
`allowImportingTsExtensions` esteja ligado — e a Tarefa 2 só o ligou em
`tsconfig.tests.json`, que cobre os testes, não `app/` e `componentes/`.

Em `tsconfig.json`, dentro de `compilerOptions`:

```json
    "allowImportingTsExtensions": true,
```

A opção exige `noEmit: true`, que já está lá. O Next reescreve `include` e
`plugins` deste arquivo a cada build, mas não mexe nas outras
`compilerOptions` — verificado na Tarefa 1.

**Verifique de verdade, não presuma.** Depois de escrever o `Topo.tsx` (Step 4),
rode `npm run build` e `npm run typecheck`. Se o build **ainda** reprovar o
import com extensão — porque o Turbopack não resolveu `./Topo.tsx`, ou porque o
Next sobrescreveu a opção — então o caminho é o outro: **tire a extensão dos
imports de código de produção** (`from '../lib/rotas'`, `from './Topo'`), que é
o estilo convencional em Next, e deixe os testes como estão, com extensão e a
opção ligada no programa de testes. Registre no report qual dos dois caminhos
valeu, porque as Tarefas 5 a 22 seguem o mesmo.

- [ ] **Step 1: Ensinar o vitest a ler `.tsx`**

Em `vitest.config.ts`, trocar a linha do `include`:

```ts
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/build/**/*.test.ts'],
```

- [ ] **Step 2: Escrever o teste que falha**

`tests/unit/Topo.test.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Topo } from '../../componentes/Topo.tsx';

describe('Topo', () => {
  it('estampa o wordmark com Sephir em âmbar e Studio em stardust', () => {
    const html = renderToStaticMarkup(<Topo ativo={null} />);
    expect(html).toContain('wordmark__sephir">Sephir</span>');
    expect(html).toContain('wordmark__studio"> Studio</span>');
  });

  it('marca aria-current apenas no item ativo', () => {
    const html = renderToStaticMarkup(<Topo ativo="sobre" />);
    const comAriaCurrent = html.match(/aria-current="page"/g) ?? [];
    expect(comAriaCurrent).toHaveLength(1);
    expect(html).toMatch(/aria-current="page"[^>]*>sobre</);
  });

  it('não marca nada quando nenhum item está ativo', () => {
    const html = renderToStaticMarkup(<Topo ativo={null} />);
    expect(html).not.toContain('aria-current');
  });

  it('rende devlog como texto, nunca como link', () => {
    const html = renderToStaticMarkup(<Topo ativo={null} />);
    expect(html).toContain('<span class="navegacao__ausente">devlog</span>');
    expect(html).not.toMatch(/<a[^>]*>devlog</);
  });

  it('não usa aria-disabled, que o axe reprova em span sem papel', () => {
    const html = renderToStaticMarkup(<Topo ativo={null} />);
    expect(html).not.toContain('aria-disabled');
  });

  it('dá um rótulo acessível à navegação', () => {
    const html = renderToStaticMarkup(<Topo ativo={null} />);
    expect(html).toMatch(/<nav[^>]*aria-label="seções"/);
  });
});
```

- [ ] **Step 3: Rodar para ver falhar**

```bash
npm test -- tests/unit/Topo.test.tsx
```

Esperado: FALHA com "Cannot find module '../../componentes/Topo.tsx'".

- [ ] **Step 4: Escrever `componentes/Topo.tsx`**

```tsx
import { ITENS_MENU, type ChaveMenu } from '../lib/rotas.ts';

// O Topo não mora no layout: nos artboards internos ele é position:absolute
// dentro da Faixa, e na home é absoluto sobre o herói. Além disso o item
// ativo muda por página, e lê-lo no layout exigiria usePathname — componente
// cliente, JS numa página que não precisa de nenhum. Ver spec §4.
export function Topo({ ativo }: { ativo: ChaveMenu | null }) {
  return (
    <div className="topo">
      <p className="wordmark">
        <span className="wordmark__sephir">Sephir</span>
        <span className="wordmark__studio"> Studio</span>
      </p>
      <nav className="navegacao" aria-label="seções">
        {ITENS_MENU.map((item) =>
          item.href === null ? (
            <span key={item.chave} className="navegacao__ausente">
              {item.rotulo}
            </span>
          ) : (
            <a
              key={item.chave}
              href={item.href}
              className={item.chave === ativo ? 'navegacao__ativo' : undefined}
              aria-current={item.chave === ativo ? 'page' : undefined}
            >
              {item.rotulo}
            </a>
          ),
        )}
      </nav>
    </div>
  );
}
```

- [ ] **Step 5: Rodar para ver passar**

```bash
npm test -- tests/unit/Topo.test.tsx
```

Esperado: 6 passando.

- [ ] **Step 6: Acrescentar as classes a `estilos/base.css`**

```css
.topo {
  position: absolute;
  inset-inline: 0;
  top: 0;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem clamp(1.5rem, 8vw, 154px);
}

.wordmark {
  font-family: var(--fonte-display);
  font-weight: 500;
  font-size: 1.0625rem;
  letter-spacing: 0.02em;
}
.wordmark__sephir { color: var(--cor-amber); }
.wordmark__studio { color: var(--cor-stardust); }

.navegacao { display: flex; gap: 2.75rem; }
.navegacao a, .navegacao__ausente {
  font-size: 0.875rem;
  font-weight: 300;
  letter-spacing: 0.08em;
  color: var(--cor-muted);
}
.navegacao a:hover { color: var(--cor-stardust); }
.navegacao__ativo { color: var(--cor-stardust); }

@media (max-width: 767px) {
  .topo { padding: 1.25rem 1.5rem; }
  .navegacao { display: none; }
}
```

O `display: none` abaixo de 768 px é provisório: a Tarefa 14 põe o `<details>` no lugar.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Topo: wordmark, navegação e o item ativo por aria-current"
```

---

## Tarefa 5: `Rodape`

**Files:**
- Create: `componentes/Rodape.tsx`
- Modify: `estilos/base.css`
- Test: `tests/unit/Rodape.test.tsx`

**Interfaces:**
- Consumes: `brand` de `lib/marca.ts`.
- Produces: `export function Rodape()`. Usado por `app/[lang]/layout.tsx` (Tarefa 10) e por `app/not-found.tsx` (Tarefa 13).

- [ ] **Step 1: Escrever o teste que falha**

`tests/unit/Rodape.test.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Rodape } from '../../componentes/Rodape.tsx';

describe('Rodape', () => {
  it('traz o CNPJ literal da empresa', () => {
    const html = renderToStaticMarkup(<Rodape />);
    expect(html).toContain('Sephir Studio Inova Simples (I.S.) — CNPJ 63.037.641/0001-30');
  });

  it('traz a tagline da marca', () => {
    const html = renderToStaticMarkup(<Rodape />);
    expect(html).toContain('Simulação física do cosmos, jogável.');
  });

  it('mostra o logo com alternativo textual', () => {
    const html = renderToStaticMarkup(<Rodape />);
    expect(html).toMatch(/<img[^>]*src="\/marca\/logo\.webp"/);
    expect(html).toMatch(/<img[^>]*alt="Sephir Studio"/);
  });

  it('declara largura e altura do logo, para não causar salto de layout', () => {
    const html = renderToStaticMarkup(<Rodape />);
    expect(html).toMatch(/<img[^>]*width="150"/);
    expect(html).toMatch(/<img[^>]*height="84"/);
  });

  it('liga para GitHub e para o contato por e-mail', () => {
    const html = renderToStaticMarkup(<Rodape />);
    expect(html).toContain('href="https://github.com/IvanGadioli"');
    expect(html).toContain('href="mailto:ivanilson.gadioli2@gmail.com"');
  });

  it('não estampa o codinome da fase, que nunca é título', () => {
    const html = renderToStaticMarkup(<Rodape />);
    expect(html).not.toContain('Semente Cósmica');
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

```bash
npm test -- tests/unit/Rodape.test.tsx
```

Esperado: FALHA com módulo não encontrado.

- [ ] **Step 3: Escrever `componentes/Rodape.tsx`**

A proporção do logo vem do PNG de origem, 1672 × 941 → 150 × 84 (arredondado). Declarar as duas dimensões evita CLS, que é um dos quatro números da spec §8.

```tsx
import { brand } from '../lib/marca.ts';

export function Rodape() {
  return (
    <footer className="rodape envoltorio">
      <div className="rodape__interno">
        <div className="rodape__marca">
          <img src="/marca/logo.webp" alt="Sephir Studio" width={150} height={84} />
          <p className="rodape__tagline">{brand.tagline}</p>
          <p className="rodape__cnpj">{brand.cnpj}</p>
        </div>
        <div className="rodape__links">
          <a href="https://github.com/IvanGadioli">GitHub</a>
          <a href="mailto:ivanilson.gadioli2@gmail.com">contato</a>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Rodar para ver passar**

```bash
npm test -- tests/unit/Rodape.test.tsx
```

Esperado: 6 passando. O `<img>` ainda aponta para um arquivo que só existe na Tarefa 15 — o teste unitário não abre o arquivo, e o teste de integridade de link (Tarefa 16) roda depois dela.

- [ ] **Step 5: Acrescentar as classes a `estilos/base.css`**

```css
.rodape__interno {
  border-top: 1px solid var(--cor-border);
  padding: 4rem 0 5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 2rem;
}
.rodape__marca { display: flex; flex-direction: column; gap: 1rem; }
.rodape__marca img { opacity: 0.85; height: auto; }
.rodape__tagline { font-size: 0.8125rem; color: var(--cor-faint); }
.rodape__cnpj { font-size: 0.875rem; color: var(--cor-muted); }
.rodape__links { display: flex; gap: 2rem; }

@media (max-width: 767px) {
  .rodape__interno { flex-direction: column; align-items: flex-start; gap: 2.5rem; }
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Rodape: lockup, CNPJ e os dois links, com dimensão declarada no logo"
```

---

## Tarefa 6: `Faixa`

**Files:**
- Create: `componentes/Faixa.tsx`
- Modify: `estilos/base.css`
- Test: `tests/unit/Faixa.test.tsx`

**Interfaces:**
- Consumes: `Topo` (Tarefa 4); `ChaveMenu` de `lib/rotas.ts`.
- Produces: `export function Faixa({ titulo, ativo, imagem, sub, regua }: FaixaProps)` onde `FaixaProps = { titulo: string; ativo: ChaveMenu | null; imagem?: string; sub?: string; regua?: boolean }`. Usado pelas Tarefas 11 e 12.

**Regra de altura, derivada dos artboards:** com `imagem` → 420 px (artboard `Sobre`); sem `imagem` → 340 px (artboards `ComoEFeito` e `Devlog`). Não é prop: é consequência, e prop a mais é deriva a mais.

- [ ] **Step 1: Escrever o teste que falha**

`tests/unit/Faixa.test.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Faixa } from '../../componentes/Faixa.tsx';

describe('Faixa', () => {
  it('monta o Topo dentro de si, com o item ativo recebido', () => {
    const html = renderToStaticMarkup(<Faixa titulo="Sobre" ativo="sobre" />);
    expect(html).toContain('class="topo"');
    expect(html).toMatch(/aria-current="page"[^>]*>sobre</);
  });

  it('põe o título num h1', () => {
    const html = renderToStaticMarkup(<Faixa titulo="Como é feito" ativo="como-e-feito" />);
    expect(html).toMatch(/<h1[^>]*>Como é feito<\/h1>/);
  });

  it('sem imagem, não emite img nenhuma', () => {
    const html = renderToStaticMarkup(<Faixa titulo="Como é feito" ativo="como-e-feito" />);
    expect(html).not.toContain('<img');
  });

  it('sem imagem, usa a faixa baixa', () => {
    const html = renderToStaticMarkup(<Faixa titulo="Como é feito" ativo="como-e-feito" />);
    expect(html).toContain('faixa--baixa');
  });

  it('com imagem, emite a img de fundo com alt vazio e a faixa alta', () => {
    const html = renderToStaticMarkup(
      <Faixa titulo="Sobre" ativo="sobre" imagem="/poster/heroi.webp" />,
    );
    expect(html).toMatch(/<img[^>]*src="\/poster\/heroi\.webp"/);
    expect(html).toMatch(/<img[^>]*alt=""/);
    expect(html).toContain('faixa--alta');
  });

  it('rende o subtítulo quando recebe um', () => {
    const html = renderToStaticMarkup(
      <Faixa titulo="Devlog" ativo="devlog" sub="uma nota por rodada" />,
    );
    expect(html).toContain('uma nota por rodada');
  });

  it('não rende parágrafo de subtítulo quando não recebe', () => {
    const html = renderToStaticMarkup(<Faixa titulo="Sobre" ativo="sobre" />);
    expect(html).not.toContain('faixa__sub');
  });

  it('desenha a régua âmbar só quando pedida', () => {
    const sem = renderToStaticMarkup(<Faixa titulo="Sobre" ativo="sobre" />);
    const com = renderToStaticMarkup(<Faixa titulo="Como é feito" ativo="como-e-feito" regua />);
    expect(sem).not.toContain('faixa__regua');
    expect(com).toContain('faixa__regua');
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

```bash
npm test -- tests/unit/Faixa.test.tsx
```

Esperado: FALHA com módulo não encontrado.

- [ ] **Step 3: Escrever `componentes/Faixa.tsx`**

O `alt=""` da imagem de fundo é deliberado: é decoração atrás de um gradiente, e descrevê-la só acrescenta ruído a quem usa leitor de tela. O axe aceita `alt=""` em imagem decorativa; `<img>` sem `alt` nenhum ele reprova.

```tsx
import { Topo } from './Topo.tsx';
import type { ChaveMenu } from '../lib/rotas.ts';

export interface FaixaProps {
  titulo: string;
  ativo: ChaveMenu | null;
  imagem?: string;
  sub?: string;
  regua?: boolean;
}

export function Faixa({ titulo, ativo, imagem, sub, regua }: FaixaProps) {
  // A altura é consequência da imagem, não prop: 420px com, 340px sem — é o
  // que os artboards Sobre e ComoEFeito fazem.
  const altura = imagem ? 'faixa--alta' : 'faixa--baixa';
  return (
    <header className={`faixa ${altura}`}>
      {imagem ? (
        <>
          <img className="faixa__fundo" src={imagem} alt="" />
          <div className="faixa__veu" />
        </>
      ) : null}
      <Topo ativo={ativo} />
      <div className="faixa__texto">
        {regua ? <div className="faixa__regua" /> : null}
        <h1>{titulo}</h1>
        {sub ? <p className="faixa__sub">{sub}</p> : null}
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Rodar para ver passar**

```bash
npm test -- tests/unit/Faixa.test.tsx
```

Esperado: 8 passando.

- [ ] **Step 5: Acrescentar as classes a `estilos/base.css`**

```css
.faixa { position: relative; overflow: hidden; background: var(--cor-void); }
.faixa--alta { min-height: 420px; }
.faixa--baixa { min-height: 340px; }

.faixa__fundo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 40%;
}
.faixa__veu {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(5, 7, 14, 0.75), rgba(5, 7, 14, 0.98));
}

.faixa__texto {
  position: absolute;
  bottom: 3.5rem;
  left: clamp(1.5rem, 8vw, 154px);
  right: clamp(1.5rem, 8vw, 154px);
}
.faixa__texto h1 { font-size: clamp(2.5rem, 5vw, 4rem); }
.faixa__regua { width: 64px; height: 1px; background: var(--cor-amber); margin-bottom: 1.5rem; }
.faixa__sub {
  font-size: 1.0625rem;
  font-weight: 300;
  color: var(--cor-muted);
  margin-top: 1rem;
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Faixa: cabeçalho de página interna, com e sem imagem, hospedando o Topo"
```

---

## Tarefa 7: `Secao`

**Files:**
- Create: `componentes/Secao.tsx`
- Modify: `estilos/base.css`
- Test: `tests/unit/Secao.test.tsx`

**Interfaces:**
- Consumes: nada.
- Produces: `export function Secao({ numero, rotulo, titulo, id, children }: SecaoProps)` onde `SecaoProps = { numero: string; rotulo: string; titulo: string; id?: string; children: ReactNode }`. Usado pelas Tarefas 10, 11 e 12.

- [ ] **Step 1: Escrever o teste que falha**

`tests/unit/Secao.test.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Secao } from '../../componentes/Secao.tsx';

describe('Secao', () => {
  it('estampa o número em âmbar e o rótulo em caixa alta mono', () => {
    const html = renderToStaticMarkup(
      <Secao numero="01" rotulo="o que é" titulo="O que é"><p>corpo</p></Secao>,
    );
    expect(html).toContain('<span class="eyebrow__numero">01</span>');
    expect(html).toContain('<span class="eyebrow__rotulo"> — o que é</span>');
    expect(html).toContain('class="eyebrow mono"');
  });

  it('põe o título num h2', () => {
    const html = renderToStaticMarkup(
      <Secao numero="02" rotulo="estado atual" titulo="Estado atual"><p>x</p></Secao>,
    );
    expect(html).toMatch(/<h2[^>]*>Estado atual<\/h2>/);
  });

  it('rende o conteúdo recebido', () => {
    const html = renderToStaticMarkup(
      <Secao numero="03" rotulo="como" titulo="Como"><p>corpo da seção</p></Secao>,
    );
    expect(html).toContain('<p>corpo da seção</p>');
  });

  it('aceita uma âncora, para o menu poder apontar', () => {
    const html = renderToStaticMarkup(
      <Secao numero="01" rotulo="o que é" titulo="O que é" id="o-que-e"><p>x</p></Secao>,
    );
    expect(html).toMatch(/<section[^>]*id="o-que-e"/);
  });

  it('sem âncora, não emite id vazio', () => {
    const html = renderToStaticMarkup(
      <Secao numero="01" rotulo="o que é" titulo="O que é"><p>x</p></Secao>,
    );
    expect(html).not.toContain('id=""');
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

```bash
npm test -- tests/unit/Secao.test.tsx
```

Esperado: FALHA com módulo não encontrado.

- [ ] **Step 3: Escrever `componentes/Secao.tsx`**

O rótulo vai em caixa alta pelo CSS (`.mono { text-transform: uppercase }`), não pelo texto — assim o leitor de tela lê "o que é" e não "O Q U E É", que é como alguns leitores soletram maiúsculas.

```tsx
import type { ReactNode } from 'react';

export interface SecaoProps {
  numero: string;
  rotulo: string;
  titulo: string;
  id?: string;
  children: ReactNode;
}

export function Secao({ numero, rotulo, titulo, id, children }: SecaoProps) {
  return (
    <section className="secao envoltorio" id={id}>
      <p className="eyebrow mono">
        <span className="eyebrow__numero">{numero}</span>
        <span className="eyebrow__rotulo">{` — ${rotulo}`}</span>
      </p>
      <h2>{titulo}</h2>
      {children}
    </section>
  );
}
```

- [ ] **Step 4: Rodar para ver passar**

```bash
npm test -- tests/unit/Secao.test.tsx
```

Esperado: 5 passando.

- [ ] **Step 5: Acrescentar as classes a `estilos/base.css`**

```css
.secao { padding-block: clamp(3.5rem, 8vw, 8rem); }
.eyebrow { letter-spacing: 0.18em; font-size: 0.75rem; margin-bottom: 1.5rem; }
.eyebrow__numero { color: var(--cor-amber); }
.eyebrow__rotulo { color: var(--cor-muted); }
.secao h2 { font-size: clamp(2rem, 4vw, 3.25rem); margin-bottom: 2.5rem; }
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Secao: o eyebrow numerado e o h2 que os artboards repetem"
```

---

## Tarefa 8: `Linha`

**Files:**
- Create: `componentes/Linha.tsx`
- Modify: `estilos/base.css`
- Test: `tests/unit/Linha.test.tsx`

**Interfaces:**
- Consumes: nada.
- Produces: `export function Linha({ colunas, children }: { colunas: 'estado' | 'portao'; children: ReactNode })`. Usado pelas Tarefas 10 e 12.

**Nota de projeto:** esta é a abstração mais discutível do conjunto (spec §4). São duas grids diferentes que compartilham o idioma visual: `border-top`, alinhamento por baseline, rótulo mono. `colunas` é de conjunto fechado justamente para a prop não virar string arbitrária. **Se durante a Tarefa 12 a prop começar a crescer, reverta para dois componentes e anote no commit.**

- [ ] **Step 1: Escrever o teste que falha**

`tests/unit/Linha.test.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Linha } from '../../componentes/Linha.tsx';

describe('Linha', () => {
  it('na variante estado, usa a grid de duas colunas', () => {
    const html = renderToStaticMarkup(
      <Linha colunas="estado"><span>EXISTE</span><span>o motor</span></Linha>,
    );
    expect(html).toContain('linha--estado');
    expect(html).not.toContain('linha--portao');
  });

  it('na variante portao, usa a grid de três colunas', () => {
    const html = renderToStaticMarkup(
      <Linha colunas="portao"><span>00</span><span>escopo</span><span>agora?</span></Linha>,
    );
    expect(html).toContain('linha--portao');
    expect(html).not.toContain('linha--estado');
  });

  it('rende as células recebidas, na ordem', () => {
    const html = renderToStaticMarkup(
      <Linha colunas="portao"><span>00</span><span>escopo</span><span>agora?</span></Linha>,
    );
    expect(html.indexOf('00')).toBeLessThan(html.indexOf('escopo'));
    expect(html.indexOf('escopo')).toBeLessThan(html.indexOf('agora?'));
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

```bash
npm test -- tests/unit/Linha.test.tsx
```

Esperado: FALHA com módulo não encontrado.

- [ ] **Step 3: Escrever `componentes/Linha.tsx`**

```tsx
import type { ReactNode } from 'react';

export function Linha({
  colunas,
  children,
}: {
  colunas: 'estado' | 'portao';
  children: ReactNode;
}) {
  return <div className={`linha linha--${colunas}`}>{children}</div>;
}
```

- [ ] **Step 4: Rodar para ver passar**

```bash
npm test -- tests/unit/Linha.test.tsx
```

Esperado: 3 passando.

- [ ] **Step 5: Acrescentar as classes a `estilos/base.css`**

```css
.linha {
  display: grid;
  gap: 2rem;
  align-items: baseline;
  border-top: 1px solid var(--cor-border);
  padding-block: 1.5rem;
}
.linha--estado { grid-template-columns: 140px 1fr; }
.linha--portao { grid-template-columns: 64px 240px 1fr; padding-block: 1.75rem; }

.linha__rotulo { font-family: var(--fonte-mono); font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; }
.linha__rotulo--existe { color: var(--cor-amber); }
.linha__rotulo--construcao { color: var(--cor-stardust); }
.linha__rotulo--ausente { color: var(--cor-muted); }
.linha__numero { font-family: var(--fonte-mono); font-size: 1.25rem; color: var(--cor-amber); }
.linha__corpo { font-size: 1.0625rem; color: var(--cor-stardust); }
.linha__nota { font-size: 0.9375rem; color: var(--cor-muted); }

@media (max-width: 767px) {
  .linha--estado, .linha--portao { grid-template-columns: 1fr; gap: 0.5rem; }
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Linha: a grid de border-top que serve estado atual e os oito portões"
```

---

## Tarefa 9: `Seta`

**Files:**
- Create: `componentes/Seta.tsx`
- Modify: `estilos/base.css`
- Test: `tests/unit/Seta.test.tsx`

**Interfaces:**
- Consumes: nada.
- Produces: `export function Seta({ href, direcao, regua, children }: SetaProps)` onde `SetaProps = { href: string; direcao?: 'direita' | 'baixo'; regua?: boolean; children: ReactNode }`. `direcao` tem padrão `'direita'`. Usado pelas Tarefas 10 e 13.

- [ ] **Step 1: Escrever o teste que falha**

`tests/unit/Seta.test.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Seta } from '../../componentes/Seta.tsx';

describe('Seta', () => {
  it('liga para o destino recebido', () => {
    const html = renderToStaticMarkup(<Seta href="/pt/como-e-feito/">ver o método</Seta>);
    expect(html).toContain('href="/pt/como-e-feito/"');
    expect(html).toContain('ver o método');
  });

  it('por padrão aponta para a direita', () => {
    const html = renderToStaticMarkup(<Seta href="/pt/">voltar</Seta>);
    expect(html).toContain('points="14 6 20 12 14 18"');
  });

  it('com direcao baixo, troca o glifo', () => {
    const html = renderToStaticMarkup(
      <Seta href="#o-que-e" direcao="baixo">descer para o projeto</Seta>,
    );
    expect(html).toContain('points="6 14 12 20 18 14"');
    expect(html).not.toContain('points="14 6 20 12 14 18"');
  });

  it('esconde o ícone do leitor de tela, que já lê o texto', () => {
    const html = renderToStaticMarkup(<Seta href="/pt/">voltar</Seta>);
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
  });

  it('desenha a régua âmbar só quando pedida', () => {
    const sem = renderToStaticMarkup(<Seta href="/pt/">voltar</Seta>);
    const com = renderToStaticMarkup(<Seta href="/pt/" regua>voltar</Seta>);
    expect(sem).not.toContain('seta__regua');
    expect(com).toContain('seta__regua');
  });

  it('garante alvo de toque de 44px', () => {
    const html = renderToStaticMarkup(<Seta href="/pt/">voltar</Seta>);
    expect(html).toContain('class="seta"');
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

```bash
npm test -- tests/unit/Seta.test.tsx
```

Esperado: FALHA com módulo não encontrado.

- [ ] **Step 3: Escrever `componentes/Seta.tsx`**

```tsx
import type { ReactNode } from 'react';

export interface SetaProps {
  href: string;
  direcao?: 'direita' | 'baixo';
  regua?: boolean;
  children: ReactNode;
}

export function Seta({ href, direcao = 'direita', regua, children }: SetaProps) {
  const paraBaixo = direcao === 'baixo';
  return (
    <div className="seta__bloco">
      {regua ? <div className="seta__regua" /> : null}
      <a className="seta" href={href}>
        {children}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {paraBaixo ? (
            <>
              <line x1="12" y1="4" x2="12" y2="20" />
              <polyline points="6 14 12 20 18 14" />
            </>
          ) : (
            <>
              <line x1="4" y1="12" x2="20" y2="12" />
              <polyline points="14 6 20 12 14 18" />
            </>
          )}
        </svg>
      </a>
    </div>
  );
}
```

- [ ] **Step 4: Rodar para ver passar**

```bash
npm test -- tests/unit/Seta.test.tsx
```

Esperado: 6 passando.

- [ ] **Step 5: Acrescentar as classes a `estilos/base.css`**

```css
.seta__regua { width: 64px; height: 1px; background: var(--cor-amber); margin-bottom: 1rem; }
.seta {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 44px;
  font-size: 0.875rem;
  font-weight: 300;
  letter-spacing: 0.08em;
  color: var(--cor-stardust);
}
.seta:hover { color: var(--cor-amber); }
```

- [ ] **Step 6: Rodar a suíte inteira e commitar**

```bash
npm test
npm run typecheck
git add -A
git commit -m "Seta: o CTA com régua âmbar, nas duas direções"
```

Esperado: 6 arquivos de unit passando (tokens, rotas, Topo, Rodape, Faixa, Secao, Linha, Seta), mais o build da casca.

---

**Continua em `2026-09-24-redesign-zero-parte-3.md`** — Tarefas 10 a 15: as cinco páginas, o menu mobile e o logo derivado.
