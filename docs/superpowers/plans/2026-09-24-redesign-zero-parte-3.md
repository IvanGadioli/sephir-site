# Redesign do zero — plano, parte 3: as cinco páginas

> Continuação de `2026-09-24-redesign-zero-parte-2.md`. As **Global Constraints** da parte 1 valem aqui integralmente.

O texto de todas as páginas vem **literalmente** dos artboards em
`~/vaults/sephir-site-workspace/sistemas/02_superficie/design/*.dc.html`. Não
reescreva, não melhore, não resuma: o artboard é o mock aprovado e a fidelidade
é julgada contra ele. Se uma frase parecer errada, isso é achado para o relatório
da Tarefa 23, não licença para editar.

---

## Tarefa 10: A home (`/pt/`)

**Files:**
- Create: `app/[lang]/layout.tsx`, `app/[lang]/page.tsx`
- Modify: `estilos/base.css`
- Test: `tests/build/home.test.ts`

**Interfaces:**
- Consumes: `Rodape`, `Topo`, `Secao`, `Linha`, `Seta`; `brand` de `lib/marca.ts`; `IDIOMAS` de `lib/rotas.ts`.
- Produces: `out/pt/index.html`.

- [ ] **Step 1: Escrever o teste que falha**

`tests/build/home.test.ts`:

```ts
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

let html = '';

describe('a home em /pt/', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
    html = readFileSync('out/pt/index.html', 'utf8');
  }, 300_000);

  it('estampa o produto como h1, nunca a empresa nem a fase', () => {
    expect(html).toMatch(/<h1[^>]*>Iniciativa Sephir<\/h1>/);
    expect(html).not.toMatch(/<h1[^>]*>Sephir Studio</);
    expect(html).not.toMatch(/<h1[^>]*>Semente Cósmica</);
  });

  it('traz o selo de fase como selo, não como título', () => {
    expect(html).toContain('fase Semente Cósmica · rumo à 1.0');
  });

  it('traz a ficha técnica do herói', () => {
    expect(html).toContain('Unreal Engine 5');
    expect(html).toContain('cônicas emendadas');
  });

  it('carrega o pôster como imagem do herói', () => {
    expect(html).toMatch(/<img[^>]*src="\/poster\/heroi\.webp"/);
  });

  it('tem as três seções numeradas, com a âncora que o menu usa', () => {
    expect(html).toContain('id="o-que-e"');
    expect(html).toContain('Estado atual');
    expect(html).toContain('Como é feito');
  });

  it('lista os sete itens do estado atual', () => {
    const existe = html.match(/linha__rotulo--existe/g) ?? [];
    const construcao = html.match(/linha__rotulo--construcao/g) ?? [];
    const ausente = html.match(/linha__rotulo--ausente/g) ?? [];
    expect(existe).toHaveLength(3);
    expect(construcao).toHaveLength(1);
    expect(ausente).toHaveLength(3);
  });

  it('desenha a grade dos oito portões, com quatro cumpridos', () => {
    const cumpridos = html.match(/portao--cumprido/g) ?? [];
    expect(cumpridos).toHaveLength(4);
  });

  it('fecha com o rodapé e o CNPJ', () => {
    expect(html).toContain('CNPJ 63.037.641/0001-30');
  });

  it('não carrega fonte de CDN de terceiro', () => {
    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).not.toContain('fonts.gstatic.com');
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

```bash
npm test -- tests/build/home.test.ts
```

Esperado: FALHA — `out/pt/index.html` não existe (ENOENT no `beforeAll`).

- [ ] **Step 3: Escrever `app/[lang]/layout.tsx`**

Este layout **não** tem `<html>` nem `<body>`: quem tem é `app/layout.tsx`. Dois `<html>` aninhados é erro de marcação, e o axe reprova.

```tsx
import type { ReactNode } from 'react';
import { Rodape } from '../../componentes/Rodape.tsx';
import { IDIOMAS } from '../../lib/rotas.ts';

export function generateStaticParams() {
  return IDIOMAS.map((lang) => ({ lang }));
}

export default function LayoutIdioma({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Rodape />
    </>
  );
}
```

- [ ] **Step 4: Escrever `app/[lang]/page.tsx`**

```tsx
import { Linha } from '../../componentes/Linha.tsx';
import { Secao } from '../../componentes/Secao.tsx';
import { Seta } from '../../componentes/Seta.tsx';
import { Topo } from '../../componentes/Topo.tsx';
import { brand } from '../../lib/marca.ts';

const FICHA = [
  { rotulo: 'motor', valor: 'Unreal Engine 5' },
  { rotulo: 'simulação', valor: 'cônicas emendadas' },
  { rotulo: 'fase', valor: brand.phase },
] as const;

const ESTADO = [
  { tom: 'existe', rotulo: 'existe', texto: 'O motor N-corpos: física de dois corpos de verdade, renderizada em tempo real.' },
  { tom: 'existe', rotulo: 'existe', texto: 'O pipeline de produção documentado em oito portões — escopo, spec, oráculo, teste, implementação, verificação, relatório, encerramento.' },
  { tom: 'existe', rotulo: 'existe', texto: 'Este site, publicado como export estático, sem servidor por trás.' },
  { tom: 'construcao', rotulo: 'em construção', texto: 'Capturas de tela e vídeo do jogo em execução — quando existir, entra numa rota nova, não numa reescrita desta.' },
  { tom: 'ausente', rotulo: 'não existe', texto: 'Página de devlog.' },
  { tom: 'ausente', rotulo: 'não existe', texto: 'Versão jogável pública.' },
  { tom: 'ausente', rotulo: 'não existe', texto: 'Suporte a mais de um idioma.' },
] as const;

const PORTOES = ['00', '01', '02', '03', '04', '05', '06', '07'] as const;
const PORTOES_CUMPRIDOS = 4;

export default function Home() {
  return (
    <>
      <div className="heroi">
        <img className="heroi__poster" src="/poster/heroi.webp" alt="" />
        <div className="heroi__veu-lateral" />
        <div className="heroi__veu-vertical" />
        <Topo ativo="projeto" />
        <div className="heroi__texto">
          <p className="selo mono">
            <span className="selo__ponto" />
            {brand.phaseBadge}
          </p>
          <h1>{brand.product}</h1>
          <p className="heroi__linha">uma exploração orbital construída em público</p>
          <dl className="ficha">
            {FICHA.map((item) => (
              <div key={item.rotulo} className="ficha__item">
                <dt className="mono">{item.rotulo}</dt>
                <dd>{item.valor}</dd>
              </div>
            ))}
          </dl>
          <div className="apenas-movel">
            <Seta href="#o-que-e" direcao="baixo" regua>
              descer para o projeto
            </Seta>
          </div>
        </div>
      </div>

      <Secao numero="01" rotulo="o que é" titulo="O que é" id="o-que-e">
        <div className="colunas">
          <p>
            Iniciativa Sephir é um jogo de exploração orbital: você não pilota uma
            nave por corredores, você escolhe uma órbita e vive com as
            consequências dela — combustível, tempo, e a geometria do espaço ao
            redor de um corpo central.
          </p>
          <p>
            A escala é astrofísica, não arcade. Distâncias, massas e períodos
            seguem a física de dois corpos de verdade, renderizada em tempo real
            por um motor N-corpos próprio — não uma aproximação visual por trás
            de uma trilha fixa.
          </p>
          <p>
            A trajetória entre duas órbitas não é uma linha reta desenhada por
            cima: é uma cônica emendada à outra no ponto de manobra, resolvida
            numericamente a cada quadro. É a escolha de método que dá nome ao
            resto do projeto.
          </p>
        </div>
      </Secao>

      <Secao numero="02" rotulo="estado atual" titulo="Estado atual">
        <div className="lista">
          {ESTADO.map((item) => (
            <Linha key={item.texto} colunas="estado">
              <p className={`linha__rotulo linha__rotulo--${item.tom}`}>{item.rotulo}</p>
              <p className="linha__corpo">{item.texto}</p>
            </Linha>
          ))}
          <div className="lista__fecho" />
        </div>
      </Secao>

      <Secao numero="03" rotulo="como é feito" titulo="Como é feito">
        <div className="metodo">
          <div>
            <p className="metodo__texto">
              Cada rodada passa por uma pipeline de oito portões, e cada portão é um
              arquivo — não uma reunião, não uma promessa. Nada avança de um portão
              para o outro sem um oráculo numérico que confirme que o passo anterior
              aconteceu de verdade.
            </p>
            <Seta href="/pt/como-e-feito/" regua>
              ver o método
            </Seta>
          </div>
          <ol className="grade-portoes" aria-label="os oito portões da pipeline">
            {PORTOES.map((n, i) => (
              <li
                key={n}
                className={i < PORTOES_CUMPRIDOS ? 'portao portao--cumprido' : 'portao'}
              >
                {n}
              </li>
            ))}
          </ol>
        </div>
      </Secao>
    </>
  );
}
```

- [ ] **Step 5: Acrescentar as classes a `estilos/base.css`**

Os dois gradientes do herói são copiados do artboard sem retoque. Eles foram calibrados para uma nebulosa difusa e vão cobrir um buraco negro a partir da Tarefa 19 — a spec §5 manda mexer no shader, nunca no gradiente.

```css
.heroi { position: relative; min-height: 100svh; overflow: hidden; }
.heroi__poster {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.heroi__veu-lateral {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(5, 7, 14, 0.97) 0%, rgba(5, 7, 14, 0.72) 38%, rgba(5, 7, 14, 0.1) 62%);
}
.heroi__veu-vertical {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(5, 7, 14, 0.5) 0%, rgba(5, 7, 14, 0) 25%, rgba(5, 7, 14, 0.85) 100%);
}
.heroi__texto {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: clamp(1.5rem, 8vw, 154px);
  right: clamp(1.5rem, 8vw, 154px);
  max-width: 700px;
}
.heroi__texto h1 { font-size: clamp(2.75rem, 6vw, 4.5rem); line-height: 1.02; }
.heroi__linha {
  font-size: clamp(1.0625rem, 2vw, 1.625rem);
  font-weight: 300;
  color: var(--cor-muted);
  margin-top: 1.5rem;
  max-width: 520px;
  line-height: 1.5;
}

.selo { display: flex; align-items: center; gap: 0.625rem; color: var(--cor-faint); margin-bottom: 1.375rem; }
.selo__ponto { width: 4px; height: 4px; border-radius: 50%; background: var(--cor-amber); flex: none; }

.ficha {
  border-top: 1px solid var(--cor-border);
  margin-top: 2.5rem;
  padding-top: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 2rem 4rem;
}
.ficha__item dt { color: var(--cor-muted); margin-bottom: 0.5rem; }
.ficha__item dd { font-size: 0.9375rem; color: var(--cor-stardust); }

.colunas { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 3.5rem; }
.colunas p { color: var(--cor-muted); line-height: 1.75; }

.lista__fecho { border-top: 1px solid var(--cor-border); }

.metodo { display: grid; grid-template-columns: 1fr 380px; gap: 5rem; }
.metodo__texto { color: var(--cor-muted); line-height: 1.75; max-width: 560px; margin-bottom: 3rem; }

.grade-portoes {
  display: grid;
  grid-template-columns: repeat(4, 40px);
  grid-auto-rows: 40px;
  gap: 8px;
  align-content: start;
  justify-content: end;
  list-style: none;
}
.portao {
  border: 1px solid var(--cor-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--fonte-mono);
  font-size: 0.6875rem;
  color: var(--cor-muted);
}
.portao--cumprido {
  border-color: var(--cor-amber);
  background: rgba(232, 150, 58, 0.16);
  color: var(--cor-stardust);
}

.apenas-movel { display: none; margin-top: 2.25rem; }

@media (max-width: 767px) {
  .colunas { grid-template-columns: 1fr; gap: 1.75rem; }
  .metodo { grid-template-columns: 1fr; gap: 3rem; }
  .grade-portoes { justify-content: start; }
  .ficha { gap: 1.25rem 2rem; }
  .apenas-movel { display: block; }
}
```

A grade dos portões usa 4 colunas em vez das 8 do artboard: em 380 px de coluna, oito células de 40 px com 8 px de intervalo dão 376 px e encostam na borda. Duas fileiras de quatro é a mesma informação sem aperto. **Anote isto no relatório da Tarefa 23** — é divergência consciente do mock.

- [ ] **Step 6: Rodar para ver passar**

```bash
npm test -- tests/build/home.test.ts
```

Esperado: 9 passando.

- [ ] **Step 7: Commit**

```bash
npm run typecheck
git add -A
git commit -m "home: o herói com pôster, as três seções e a grade dos portões"
```

---

## Tarefa 11: `/pt/sobre/`

**Files:**
- Create: `app/[lang]/sobre/page.tsx`
- Modify: `estilos/base.css`
- Test: `tests/build/sobre.test.ts`

**Interfaces:**
- Consumes: `Faixa`, `Secao`.
- Produces: `out/pt/sobre/index.html`.

- [ ] **Step 1: Escrever o teste que falha**

`tests/build/sobre.test.ts`:

```ts
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

let html = '';

describe('a página Sobre', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
    html = readFileSync('out/pt/sobre/index.html', 'utf8');
  }, 300_000);

  it('tem "Sobre" como h1', () => {
    expect(html).toMatch(/<h1[^>]*>Sobre<\/h1>/);
  });

  it('usa a faixa alta, com o pôster ao fundo', () => {
    expect(html).toContain('faixa--alta');
    expect(html).toMatch(/<img[^>]*src="\/poster\/heroi\.webp"/);
  });

  it('marca "sobre" como o item ativo do menu', () => {
    expect(html).toMatch(/aria-current="page"[^>]*>sobre</);
  });

  it('tem as cinco seções numeradas', () => {
    for (const rotulo of ['quem', 'contexto', 'ferramentas', 'o projeto', 'contato']) {
      expect(html).toContain(` — ${rotulo}`);
    }
  });

  it('nomeia os dois grupos de pesquisa', () => {
    expect(html).toContain('AstroIDP');
    expect(html).toContain('IEEE Student Branch');
  });

  it('diz que não há formulário, e por quê', () => {
    expect(html).toContain('Sem formulário');
    expect(html).toContain('não há servidor por trás deste site');
  });

  it('expõe e-mail e GitHub como links de verdade', () => {
    expect(html).toContain('href="mailto:ivanilson.gadioli2@gmail.com"');
    expect(html).toContain('href="https://github.com/IvanGadioli"');
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

```bash
npm test -- tests/build/sobre.test.ts
```

Esperado: FALHA com ENOENT em `out/pt/sobre/index.html`.

- [ ] **Step 3: Escrever `app/[lang]/sobre/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { Faixa } from '../../../componentes/Faixa.tsx';
import { Secao } from '../../../componentes/Secao.tsx';

export const metadata: Metadata = { title: 'Sobre — Iniciativa Sephir' };

export default function Sobre() {
  return (
    <>
      <Faixa titulo="Sobre" ativo="sobre" imagem="/poster/heroi.webp" />

      <Secao numero="01" rotulo="quem" titulo="Quem">
        <p className="prosa">
          Ivan Gadioli, estudante de Ciência da Computação em Brasília. O
          Iniciativa Sephir nasceu como projeto pessoal de simulação orbital e
          virou o objeto principal de estudo e produção deste período do curso.
        </p>
      </Secao>

      <Secao numero="02" rotulo="contexto" titulo="Contexto">
        <p className="prosa">
          O trabalho se apoia em dois grupos: o AstroIDP, de astrofísica
          computacional, onde a física de N corpos e a integração numérica do
          projeto foram testadas fora do jogo; e o IEEE Student Branch
          Brasília, onde parte da infraestrutura e da disciplina de produção
          em público foi exercitada.
        </p>
      </Secao>

      <Secao numero="03" rotulo="ferramentas" titulo="Ferramentas">
        <p className="prosa">
          O jogo é construído em Unreal Engine 5 e C++, com Houdini para a
          geração procedural de parte dos ativos. A infraestrutura — deste
          site incluído — é própria: hospedagem, domínio e pipeline de
          produção não dependem de plataforma de terceiro além do necessário
          para publicar.
        </p>
      </Secao>

      <Secao numero="04" rotulo="o projeto" titulo="O projeto">
        <p className="prosa">
          O Iniciativa Sephir é proposto pela Sephir Studio Inova Simples
          (I.S.), CNPJ 63.037.641/0001-30, como projeto do edital FAPDF. Este
          site é o endereço público desse projeto: o código do jogo, do site
          e o histórico de decisões de produção estão nos repositórios
          ligados no rodapé.
        </p>
      </Secao>

      <Secao numero="05" rotulo="contato" titulo="Contato">
        <p className="prosa">
          Sem formulário — não há servidor por trás deste site. Escreva ou
          acompanhe o desenvolvimento pelos endereços abaixo.
        </p>
        <div className="cartoes">
          <div className="cartao">
            <p className="cartao__rotulo mono">e-mail</p>
            <a className="cartao__valor" href="mailto:ivanilson.gadioli2@gmail.com">
              ivanilson.gadioli2@gmail.com
            </a>
          </div>
          <div className="cartao">
            <p className="cartao__rotulo mono">github</p>
            <a className="cartao__valor" href="https://github.com/IvanGadioli">
              github.com/IvanGadioli
            </a>
          </div>
        </div>
      </Secao>
    </>
  );
}
```

- [ ] **Step 4: Acrescentar as classes a `estilos/base.css`**

```css
.prosa { color: var(--cor-muted); line-height: 1.75; max-width: 760px; }

.cartoes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
  max-width: 760px;
  margin-top: 2.5rem;
}
.cartao { border: 1px solid var(--cor-border); background: var(--cor-void2); padding: 2rem; }
.cartao__rotulo { color: var(--cor-muted); margin-bottom: 0.75rem; }
.cartao__valor { font-size: 1.125rem; font-weight: 300; color: var(--cor-stardust); word-break: break-word; }
.cartao__valor:hover { color: var(--cor-amber); }

@media (max-width: 767px) {
  .cartoes { grid-template-columns: 1fr; }
}
```

- [ ] **Step 5: Rodar para ver passar**

```bash
npm test -- tests/build/sobre.test.ts
```

Esperado: 7 passando.

- [ ] **Step 6: Commit**

```bash
npm run typecheck
git add -A
git commit -m "sobre: as cinco seções e os dois cartões de contato"
```

---

## Tarefa 12: `/pt/como-e-feito/`

**Files:**
- Create: `app/[lang]/como-e-feito/page.tsx`
- Modify: `estilos/base.css`
- Test: `tests/build/como-e-feito.test.ts`

**Interfaces:**
- Consumes: `Faixa`, `Linha`.
- Produces: `out/pt/como-e-feito/index.html`.

**Ponto de decisão:** esta é a tarefa onde a prop `colunas` da `Linha` é posta à
prova pela segunda variante. Se para fazer a grid de três colunas funcionar você
precisar acrescentar uma terceira prop, **pare e divida a `Linha` em dois
componentes**, conforme a nota da Tarefa 8. Anote qual caminho seguiu no commit.

- [ ] **Step 1: Escrever o teste que falha**

`tests/build/como-e-feito.test.ts`:

```ts
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

let html = '';

describe('a página Como é feito', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
    html = readFileSync('out/pt/como-e-feito/index.html', 'utf8');
  }, 300_000);

  it('tem "Como é feito" como h1', () => {
    expect(html).toMatch(/<h1[^>]*>Como é feito<\/h1>/);
  });

  it('usa a faixa baixa, sem imagem, com a régua âmbar', () => {
    expect(html).toContain('faixa--baixa');
    expect(html).toContain('faixa__regua');
    expect(html).not.toContain('faixa__fundo');
  });

  it('marca "como é feito" como item ativo', () => {
    expect(html).toMatch(/aria-current="page"[^>]*>como é feito</);
  });

  it('lista os oito portões, do 00 ao 07', () => {
    // Ancorado em `class="`, não no nome da classe solto. O Next 16 serializa
    // `className` uma segunda vez no payload RSC de hidratação, no fim do
    // documento, então uma regex crua conta o dobro — 16 em vez de 8. Isto foi
    // medido na Tarefa 10, onde a versão crua deste mesmo teste reprovava.
    const linhas = html.match(/class="[^"]*linha--portao[^"]*"/g) ?? [];
    expect(linhas).toHaveLength(8);
    for (const nome of ['escopo', 'contexto', 'spec', 'oráculo', 'testes', 'diff', 'relatório', 'encerramento']) {
      expect(html).toContain(nome);
    }
  });

  it('traz a regra dura do 04 antes do 05', () => {
    expect(html).toContain('04 antes de 05');
    expect(html).toContain('o teste é escrito antes do código, sempre');
  });

  it('explica por que o oráculo é numérico', () => {
    expect(html).toContain('não dependa de olhar a tela depois');
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

```bash
npm test -- tests/build/como-e-feito.test.ts
```

Esperado: FALHA com ENOENT.

- [ ] **Step 3: Escrever `app/[lang]/como-e-feito/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { Faixa } from '../../../componentes/Faixa.tsx';
import { Linha } from '../../../componentes/Linha.tsx';

export const metadata: Metadata = { title: 'Como é feito — Iniciativa Sephir' };

const PORTOES = [
  { n: '00', nome: 'escopo', pergunta: 'isso deve ser feito agora?' },
  { n: '01', nome: 'contexto', pergunta: 'o que o planejador leu antes de decidir?' },
  { n: '02', nome: 'spec', pergunta: 'a spec está fechada e falseável?' },
  { n: '03', nome: 'oráculo', pergunta: 'qual medida externa prova isso, e sob qual limiar?' },
  { n: '04', nome: 'testes', pergunta: 'os testes falham hoje pelo motivo certo?' },
  { n: '05', nome: 'diff', pergunta: 'o código faz os testes passarem?' },
  { n: '06', nome: 'relatório', pergunta: 'passou, e passou pelo motivo certo?' },
  { n: '07', nome: 'encerramento', pergunta: 'fechado, com como reverter.' },
] as const;

export default function ComoEFeito() {
  return (
    <>
      <Faixa titulo="Como é feito" ativo="como-e-feito" regua />

      <div className="envoltorio abertura">
        <p className="prosa prosa--larga">
          Cada portão desta pipeline é um arquivo — não uma reunião, não uma
          promessa. O arquivo existir é o estado do portão: se ele não foi
          escrito, o portão não passou, ponto final. Nada avança de uma etapa
          para a seguinte sem que a etapa anterior esteja escrita e aprovada, e a
          ordem abaixo é a ordem real em que qualquer rodada — deste site ou do
          jogo — é produzida.
        </p>
      </div>

      <div className="envoltorio">
        <div className="lista">
          {PORTOES.map((p) => (
            <Linha key={p.n} colunas="portao">
              <p className="linha__numero">{p.n}</p>
              <p className="linha__corpo">{p.nome}</p>
              <p className="linha__nota">{p.pergunta}</p>
            </Linha>
          ))}
          <div className="lista__fecho" />
        </div>
      </div>

      <div className="envoltorio regra-dura">
        <div className="caixa">
          <p className="caixa__titulo">
            04 antes de 05 — o teste é escrito antes do código, sempre
          </p>
          <p className="caixa__corpo">
            Teste escrito depois do código testa o código que existe, não o
            comportamento que deveria existir — confirma o que já está pronto, não
            o que estava certo pedir. O oráculo do portão 03 é numérico exatamente
            para que essa régua não dependa de olhar a tela depois.
          </p>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Acrescentar as classes a `estilos/base.css`**

```css
.abertura { padding-block: clamp(3rem, 6vw, 6rem) 2rem; }
.prosa--larga { max-width: 900px; }
.regra-dura { padding-block: 3rem clamp(4rem, 8vw, 8rem); }
.caixa { background: var(--cor-void2); border: 1px solid var(--cor-border); padding: 2.5rem; }
.caixa__titulo { font-size: 1.25rem; color: var(--cor-stardust); margin-bottom: 1rem; }
.caixa__corpo { font-size: 0.9375rem; line-height: 1.7; color: var(--cor-muted); max-width: 760px; }
```

- [ ] **Step 5: Rodar para ver passar**

```bash
npm test -- tests/build/como-e-feito.test.ts
```

Esperado: 6 passando.

- [ ] **Step 6: Commit**

```bash
npm run typecheck
git add -A
git commit -m "como-e-feito: os oito portões em lista e a regra dura do 04 antes do 05"
```

---

## Tarefa 13: O 404, e descobrir como o Next 16 o emite

**Files:**
- Create: `app/not-found.tsx`
- Possivelmente criar: `ferramentas/renomear-404.mjs`
- Modify: `package.json` (talvez), `estilos/base.css`
- Test: `tests/build/nao-encontrado.test.ts`

**Interfaces:**
- Consumes: `Topo`, `Seta`, `Rodape`.
- Produces: `out/404.html`.

**Incerteza real, a resolver por medição:** não está estabelecido o que o Next 16
com `output: 'export'` e `trailingSlash: true` emite a partir de
`app/not-found.tsx` — `out/404.html` diretamente, ou `out/_not-found/index.html`.
O `main` precisou de um script de poda, o que sugere a segunda. **Meça antes de
decidir**; os dois caminhos estão especificados abaixo.

- [ ] **Step 1: Escrever o teste que falha**

`tests/build/nao-encontrado.test.ts`:

```ts
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

describe('o 404', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
  }, 300_000);

  it('existe em out/404.html, que é o nome que o Cloudflare Pages serve', () => {
    expect(existsSync('out/404.html')).toBe(true);
  });

  it('traz o título do artboard', () => {
    const html = readFileSync('out/404.html', 'utf8');
    expect(html).toMatch(/<h1[^>]*>Esta órbita não existe<\/h1>/);
  });

  it('explica o que aconteceu', () => {
    const html = readFileSync('out/404.html', 'utf8');
    expect(html).toContain('A rota não corresponde a nenhuma página publicada');
  });

  it('oferece a volta para o início', () => {
    const html = readFileSync('out/404.html', 'utf8');
    expect(html).toContain('voltar para o início');
    expect(html).toContain('href="/pt/"');
  });

  it('não deixa o fallback em inglês do Next em nenhuma página', () => {
    for (const alvo of ['out/index.html', 'out/pt/index.html', 'out/404.html']) {
      expect(readFileSync(alvo, 'utf8')).not.toContain('This page could not be found');
    }
  });

  it('não deixa um diretório _not-found sobrando no export', () => {
    expect(existsSync('out/_not-found')).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

```bash
npm test -- tests/build/nao-encontrado.test.ts
```

Esperado: FALHA — `out/404.html` não existe.

- [ ] **Step 3: Escrever `app/not-found.tsx`**

```tsx
import { Rodape } from '../componentes/Rodape.tsx';
import { Seta } from '../componentes/Seta.tsx';
import { Topo } from '../componentes/Topo.tsx';

export default function NaoEncontrado() {
  return (
    <>
      <div className="erro">
        <Topo ativo={null} />
        <div className="erro__miolo">
          <img src="/marca/logo.webp" alt="Sephir Studio" width={260} height={146} />
          <p className="erro__codigo mono">404</p>
          <h1>Esta órbita não existe</h1>
          <p className="erro__texto">
            A rota não corresponde a nenhuma página publicada. Ela pode ter mudado
            de endereço ou nunca ter existido.
          </p>
          <Seta href="/pt/">voltar para o início</Seta>
        </div>
      </div>
      <Rodape />
    </>
  );
}
```

- [ ] **Step 4: Medir o que o Next emitiu**

```bash
npm run build
ls -la out/ | head -20
find out -maxdepth 2 -name '404.html' -o -maxdepth 2 -name '_not-found' -o -maxdepth 2 -name 'not-found*'
```

Anote o resultado. **Siga o Step 5A se `out/404.html` já existe; siga o 5B se não.**

- [ ] **Step 5A: `out/404.html` já existe — remover só o resto**

Se o Next também deixou `out/_not-found/`, escreva `ferramentas/limpar-export.mjs`:

```js
import { rmSync } from 'node:fs';

// O Next emite _not-found/ como rota, além do 404.html que o host serve. O
// diretório é peso morto num export estático: nenhum link aponta para ele e o
// Cloudflare Pages nunca o consulta.
rmSync(new URL('../out/_not-found', import.meta.url), { recursive: true, force: true });
console.log('export limpo: _not-found removido');
```

E em `package.json`, trocar o script: `"build": "next build && node ferramentas/limpar-export.mjs"`.

- [ ] **Step 5B: só existe `_not-found/index.html` — renomear**

Escreva `ferramentas/renomear-404.mjs`:

```js
import { existsSync, renameSync, rmSync } from 'node:fs';

// O Cloudflare Pages serve out/404.html para qualquer rota que não casa. O
// Next 16 com output:'export' emite a página de not-found como uma rota
// (_not-found/index.html), então o arquivo é movido para o nome que o host
// procura. Sem isto, um endereço errado entrega o 404 genérico do host, sem a
// marca e sem caminho de volta.
const raiz = new URL('../out/', import.meta.url);
const origem = new URL('_not-found/index.html', raiz);
const destino = new URL('404.html', raiz);

if (!existsSync(origem)) {
  throw new Error('out/_not-found/index.html ausente: o build mudou de forma, revisar ferramentas/renomear-404.mjs');
}

renameSync(origem, destino);
rmSync(new URL('_not-found', raiz), { recursive: true, force: true });
console.log('404: _not-found/index.html → 404.html');
```

O `throw` é deliberado: se uma versão futura do Next mudar a forma do export, o
build **falha alto** em vez de publicar um site sem 404. Em `package.json`:
`"build": "next build && node ferramentas/renomear-404.mjs"`.

- [ ] **Step 6: Acrescentar as classes a `estilos/base.css`**

```css
.erro { position: relative; min-height: 100svh; display: grid; place-items: center; }
.erro__miolo {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 6rem 1.5rem 3rem;
}
.erro__miolo img { opacity: 0.9; height: auto; margin-bottom: 2.5rem; max-width: 60vw; }
.erro__codigo { letter-spacing: 0.3em; color: var(--cor-amber); margin-bottom: 1.75rem; font-size: 0.875rem; }
.erro__miolo h1 { font-size: clamp(2rem, 5vw, 3.5rem); margin-bottom: 1.25rem; }
.erro__texto { color: var(--cor-muted); max-width: 520px; line-height: 1.6; margin-bottom: 2.5rem; }
```

- [ ] **Step 7: Rodar para ver passar**

```bash
npm test -- tests/build/nao-encontrado.test.ts
```

Esperado: 6 passando.

- [ ] **Step 8: Commit**

```bash
npm run typecheck
git add -A
git commit -m "404: a página do artboard, e o export entregando o nome que o host serve"
```

---

## Tarefa 14: O menu mobile, sem JavaScript

**Files:**
- Modify: `componentes/Topo.tsx`, `estilos/base.css`
- Test: `tests/unit/Topo.test.tsx` (acrescentar), `tests/build/movel.test.ts`

**Interfaces:**
- Consumes: `ITENS_MENU`.
- Produces: nada novo — o `Topo` passa a emitir um `<details>` além do `<nav>`.

O artboard `Mobile` mostra o botão hambúrguer e **não** mostra o menu aberto
(spec §6.3). A saída sem inventar tela e sem JavaScript é `<details>`/`<summary>`:
a lista aberta repete os quatro itens empilhados, com as mesmas cores de estado.

- [ ] **Step 1: Acrescentar os testes que falham**

Em `tests/unit/Topo.test.tsx`:

```tsx
  it('oferece um menu móvel em details, sem JavaScript', () => {
    const html = renderToStaticMarkup(<Topo ativo="sobre" />);
    expect(html).toContain('<details class="menu-movel"');
    expect(html).toMatch(/<summary[^>]*aria-label="abrir o menu"/);
  });

  it('repete os quatro itens no menu móvel', () => {
    const html = renderToStaticMarkup(<Topo ativo="sobre" />);
    const depoisDoSummary = html.slice(html.indexOf('</summary>'));
    for (const rotulo of ['o projeto', 'como é feito', 'devlog', 'sobre']) {
      expect(depoisDoSummary).toContain(rotulo);
    }
  });

  it('não usa button nem input no menu móvel, que precisariam de JS', () => {
    const html = renderToStaticMarkup(<Topo ativo="sobre" />);
    expect(html).not.toContain('<button');
    expect(html).not.toContain('<input');
  });
```

E `tests/build/movel.test.ts`:

```ts
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

describe('o perfil móvel', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
  }, 300_000);

  it('declara o viewport, sem o qual o mobile rende em 980px', () => {
    const html = readFileSync('out/pt/index.html', 'utf8');
    expect(html).toMatch(/<meta name="viewport"[^>]*width=device-width/);
  });

  it('não desabilita o zoom do usuário', () => {
    const html = readFileSync('out/pt/index.html', 'utf8');
    expect(html).not.toContain('user-scalable=no');
    expect(html).not.toContain('maximum-scale=1');
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

```bash
npm test -- tests/unit/Topo.test.tsx tests/build/movel.test.ts
```

Esperado: FALHA nos três testes novos do `Topo` e possivelmente no viewport.

- [ ] **Step 3: Acrescentar o `<details>` ao `Topo`**

Dentro do `<div className="topo">`, depois do `<nav>`:

```tsx
      <details className="menu-movel">
        <summary aria-label="abrir o menu">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </summary>
        <nav className="menu-movel__lista" aria-label="seções, menu móvel">
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
              >
                {item.rotulo}
              </a>
            ),
          )}
        </nav>
      </details>
```

O `aria-current` **não** se repete aqui: dois elementos com `aria-current="page"`
no mesmo documento é ambíguo para o leitor de tela. O `<nav>` do desktop já
carrega a marca; no móvel o estado vem da cor.

- [ ] **Step 4: Garantir o viewport em `app/layout.tsx`**

Acrescentar, ao lado do `metadata`:

```tsx
import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};
```

- [ ] **Step 5: Acrescentar as classes a `estilos/base.css`**

```css
.menu-movel { display: none; position: relative; }
.menu-movel > summary {
  list-style: none;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cor-stardust);
  cursor: pointer;
}
.menu-movel > summary::-webkit-details-marker { display: none; }
.menu-movel__lista {
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem 1.25rem;
  background: var(--cor-void2);
  border: 1px solid var(--cor-border-strong);
}
.menu-movel__lista a, .menu-movel__lista span { min-height: 44px; display: flex; align-items: center; }

@media (max-width: 767px) {
  .menu-movel { display: block; }
}
```

- [ ] **Step 6: Rodar para ver passar**

```bash
npm test
```

Esperado: tudo verde — 9 testes no `Topo`, 2 em `movel`.

- [ ] **Step 7: Commit**

```bash
npm run typecheck
git add -A
git commit -m "menu móvel: details/summary, alvo de 44px, e nenhum JavaScript"
```

---

## Tarefa 15: O logo derivado

**Files:**
- Create: `public/marca/logo.webp`, `ferramentas/LEIA-ME-logo.md`
- Test: `tests/build/logo.test.ts`

**Interfaces:**
- Consumes: `~/Documents/sephir/sephir-brand/00-identidade/logo/Logo_SephirStudio_v1.png` (891 719 B, 1672 × 941).
- Produces: `public/marca/logo.webp`, ~520 px de largura, abaixo de 30 kB.

O rodapé o usa a 150 px e o 404 a 260 px; 520 px cobre os dois em telas 2×. O
PNG de origem tem halo que se dissolve no preto — **serve só sobre `--cor-void`**,
nunca sobre fundo claro (LEIA-ME da pasta de marca).

- [ ] **Step 1: Escrever o teste que falha**

`tests/build/logo.test.ts`:

```ts
import { statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('o logo derivado', () => {
  it('existe em public/marca/logo.webp', () => {
    expect(() => statSync('public/marca/logo.webp')).not.toThrow();
  });

  it('cabe no orçamento de 30 kB', () => {
    const bytes = statSync('public/marca/logo.webp').size;
    expect(bytes).toBeLessThan(30_720);
  });

  it('é muito menor que o PNG de origem, que tem 891 719 B', () => {
    const bytes = statSync('public/marca/logo.webp').size;
    expect(bytes).toBeLessThan(891_719 / 10);
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

```bash
npm test -- tests/build/logo.test.ts
```

Esperado: FALHA — o arquivo não existe.

- [ ] **Step 3: Confirmar a ferramenta de conversão**

```bash
which cwebp convert magick
```

Se `cwebp` existir, use-o (é o codificador de referência). Se não, `magick`.
Se nenhum dos dois, instale: `sudo pacman -S libwebp`.

- [ ] **Step 4: Converter**

```bash
mkdir -p public/marca
cwebp -q 82 -resize 520 0 \
  ~/Documents/sephir/sephir-brand/00-identidade/logo/Logo_SephirStudio_v1.png \
  -o public/marca/logo.webp
ls -l public/marca/logo.webp
```

Alternativa com ImageMagick, se `cwebp` não estiver disponível:

```bash
magick ~/Documents/sephir/sephir-brand/00-identidade/logo/Logo_SephirStudio_v1.png \
  -resize 520x -quality 82 -define webp:alpha-quality=100 public/marca/logo.webp
```

O `-resize 520 0` preserva a proporção: 1672 × 941 → 520 × 293. Se o arquivo
passar de 30 kB, baixe a qualidade em passos de 5 até caber, **sem** reduzir
abaixo de `-q 70` — abaixo disso o halo ganha bandas visíveis sobre o `--cor-void`.
Se nem a 70 couber, registre o número real e trate como achado da Tarefa 23.

- [ ] **Step 5: Anotar a procedência**

`ferramentas/LEIA-ME-logo.md`:

```markdown
# public/marca/logo.webp — procedência

Derivado de `Logo_SephirStudio_v1.png` (1672 × 941, 891 719 B), em
`~/Documents/sephir/sephir-brand/00-identidade/logo/`, que é o arquivo oficial
enviado à FAPDF em 03/09/2026.

Comando:

    cwebp -q 82 -resize 520 0 Logo_SephirStudio_v1.png -o public/marca/logo.webp

520 px de largura serve o rodapé a 150 px e o 404 a 260 px em telas 2×.

**A marca tem halo que se dissolve no preto.** Usar só sobre `--cor-void`
(#05070E) ou fundo escuro equivalente. Sobre fundo claro o halo aparece como
mancha cinza, e a versão para fundo claro precisa ser gerada — não basta
inverter.
```

- [ ] **Step 6: Rodar para ver passar**

```bash
npm test -- tests/build/logo.test.ts
```

Esperado: 3 passando.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "logo: WebP a 520px derivado do PNG oficial, com a procedência anotada"
```

---

**Continua em `2026-09-24-redesign-zero-parte-4.md`** — Tarefas 16 a 23: os testes de árvore e integridade, o E2E de acessibilidade e marca, o herói WebGPU, e a medição final.
