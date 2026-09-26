# Redesign do zero — spec de design

**Data:** 2026-09-24
**Branch:** `zero/redesign` (órfã, criada vazia a partir de nada)
**Linha de base:** `main` em `ed68bd4`

---

## 1. Por que isto existe

Este não é o próximo passo do site. É um **experimento controlado sobre processo**.

O site em `main` foi produzido pela pipeline de portões do workspace
`~/vaults/sephir-site-workspace`: dez artefatos numerados por feature, oráculos
`W*` com limiar declarado, um arquivo por portão. A pergunta é se aquilo paga o
que custa.

Esta branch reconstrói o mesmo alvo visual usando **só as ferramentas do
Superpowers** — brainstorm, spec, plano, TDD — e nada da pipeline. No fim, os
dois processos são comparados em quatro números e no custo da rodada.

### Hipótese falseável

> Partindo do mesmo design aprovado, o processo do Superpowers entrega **cinco
> rotas** com LCP e CLS não piores que os do `main`, zero violação de axe, e o
> herói WebGPU dentro do limiar declarado na seção 8 — por custo de rodada menor
> que o da pipeline de portões.

Se qualquer um desses falhar, o experimento falhou e isso fica registrado. O
limiar não se renegocia depois de medido.

### O que foi descartado

| ADR | O que dizia | Por que sai |
|---|---|---|
| `adr-fab-003` | portão 03 é orçamento de peso | é cerimônia de portão |
| `adr-fab-005` | dez artefatos por feature | é a cerimônia em si |
| `adr-fab-006` | brotli como portão | a medida fica; o portão sai |
| `adr-fab-007` | design em três rodadas | é cerimônia de portão |
| — | todo o ritual de portões e oráculos `W*` | é o objeto do experimento |

### O que foi mantido, e por que não é incoerência

| Mantido | Por que não é processo |
|---|---|
| `adr-fab-001` — export estático | restrição do Cloudflare Pages. Não há servidor. Descartar não liberta: quebra o deploy. |
| tokens de marca (`theme.ts`) | identidade visual da empresa, não decisão de pipeline. Os sete artboards já os embutem — "codar do zero" chega neles por caminho independente. |
| `adr-sup-001` — rotas sob `/pt/` | decisão de produto sobre URL pública. Mantida por escolha explícita do titular, para preservar paridade de rota com o `main` e não transformar tradução futura em migração de URL. |

---

## 2. Escopo

**Cinco rotas.**

| Rota | Arquivo gerado | Artboard de origem |
|---|---|---|
| `/` | `index.html` | — (casca de `meta refresh` para `/pt/`) |
| `/pt/` | `pt/index.html` | `Main.dc.html` + `Mobile.dc.html` |
| `/pt/sobre/` | `pt/sobre/index.html` | `Sobre.dc.html` |
| `/pt/como-e-feito/` | `pt/como-e-feito/index.html` | `ComoEFeito.dc.html` |
| 404 | `404.html` | `Erro404.dc.html` |

Mais o comportamento responsivo a 390 px, conforme `Mobile.dc.html`.

**Fora de escopo, declarado:** `/pt/devlog/` e `/pt/devlog/[slug]/`. Os dois
artboards existem, mas exigem sistema de conteúdo (MDX, frontmatter, ordenação,
navegação anterior/próxima) e posts reais que não foram escritos — o próprio
artboard de post admite no corpo que seus números são de exemplo. Entram em
rodada própria.

**Design de origem:**
`~/vaults/sephir-site-workspace/sistemas/02_superficie/design/*.dc.html`.
O `.html` de 2,6 MB é o editor empacotado, não o conteúdo.

---

## 3. Stack e restrições

- Next 16, React 19, `output: 'export'`, `trailingSlash: true`,
  `images: { unoptimized: true }`.
- Sem rota de API, sem middleware, sem Server Action, sem `revalidate`.
- `generateStaticParams` em `[lang]` devolve `['pt']`.
- Resgatado do `main` **apenas binário**: `public/fontes/space-grotesk-latin.woff2`,
  `public/fontes/space-mono-latin.woff2`, `public/poster/heroi.webp`.
  `package.json`, `tsconfig.json` e `next.config.ts` são reescritos.

### O piso de framework — correção de um requisito impossível

O briefing pedia "as cinco rotas em zero JS fora o chunk do herói". **Isso não é
alcançável no Next 16 App Router** e a spec não vai fingir que é.

Medição do `main` em `ed68bd4` (brotli, por rota, do que o visitante baixa):

| rota | documento | CSS | JS | total |
|---|---|---|---|---|
| `/pt/` | 3 325 B | 1 493 B | **148 945 B** | **153 763 B** |
| `/pt/sobre/` | 2 894 B | 1 493 B | 148 945 B | 153 332 B |
| `404.html` | 1 256 B | 1 493 B | 148 945 B | 151 694 B |
| `/` (casca) | 1 000 B | 1 493 B | 148 945 B | 151 438 B |

**97% do peso é runtime de React/Next** — 96,9% na home, 98,4% na casca. A casca
de `meta refresh`, uma página sem uma linha de interação, baixa **149 kB de JS**.
O export estático não remove isso.

> Correção de 2026-09-24, achada pela Tarefa 0: a coluna de JS desta tabela dizia
> 145 877 B na primeira redação. Era erro de aritmética meu ao repartir o total
> em colunas — os totais sempre estiveram certos. O valor medido é 148 945 B, e a
> proporção de framework é pior do que a spec afirmava, não melhor.

**Consequência para a spec:** o piso de framework é **registrado como fato, não
orçado como meta**. O que esta branch promete é falseável de outro jeito:

> Nenhum componente `'use client'` além do canvas do herói, e nenhum JavaScript
> de aplicação nas cinco rotas.

Registra-se também que a pipeline de portões orçou 25 kB de CSS e gastou 1,5 kB.

> **Correção de 2026-09-26, achada pela Tarefa 23.** A primeira redação desta
> seção dizia que "149 kB de JS passaram sem orçamento". **Isso é falso**, e eu
> nunca fui verificar antes de escrever. O oráculo `W3` do vault
> (`_fabrica/oraculos-web.md`, linha 42) **orça JS de primeira carga em 130 kB**,
> calibrado contra uma base do App Router **medida** em 113 787 B em 2026-09-10,
> deixando ~16 kB de folga para código de aplicação.
>
> A correção deixa o achado **mais** afiado, não menos. A pipeline não falhou em
> orçar o JS: ela orçou, e **estourou o próprio teto em cerca de 16 kB**. O real
> é 148 945 B, ou seja **35 158 B de diferença entre a base que o orçamento
> assume e o que o mesmo método de compressão mede por rota** — mais que o dobro
> da folga prevista. **A causa dessa diferença não foi medida**, e a Tarefa 23
> recusou-se a atribuí-la: parte é definição de instrumento (o `medir.mjs` desta
> rodada soma todo `_next/static/*.js` referenciado no HTML; o `W3` manda medir
> com `lighthouse-ci`), e chamá-la de "código de aplicação" é atribuição que o
> dado não sustenta — a casca de `meta refresh` em `/`, sem uma linha de
> aplicação, mede 149 164 B pelo mesmo método.
>
> **Correção de 2026-09-26, segunda passagem.** A redação anterior desta nota
> dizia que o estouro passou "sem que isso aparecesse em nenhum relatório de
> portão" e "sem ninguém notar". Eu não tenho base para isso: **os relatórios de
> portão do vault não foram lidos nesta rodada** — a Tarefa 23 declara essa
> lacuna duas vezes. Era o mesmo modo de falha que ela tinha acabado de corrigir
> aqui: escrever sobre o vault sem abrir o arquivo. O que a medição sustenta é o
> estouro (148 945 B contra os 133 120 B do teto). Se algum relatório de portão o
> registrou, **não verificado**.
>
> A metade da afirmação que se sustenta é a do CSS: 25 kB orçados contra 1,5–2,2 kB
> gastos, medido nas duas árvores. **O orçamento de CSS mirou onde não havia
> risco, e o de JS foi estourado** — é essa a forma correta do resultado, e ela é
> pior para a pipeline que a minha versão original.

---

## 4. Arquitetura

```
app/layout.tsx                 <html lang="pt-BR">, tokens + base, nada mais
app/page.tsx                   casca em /: <meta refresh> → /pt/
app/[lang]/layout.tsx          {children} + <Rodape/>; generateStaticParams → ['pt']
app/[lang]/page.tsx            Main
app/[lang]/sobre/page.tsx      Sobre
app/[lang]/como-e-feito/page.tsx
app/not-found.tsx              → 404.html
componentes/                   Topo Rodape Faixa Secao Linha Seta  (todos servidor)
componentes/heroi/             index + Canvas (os dois 'use client') + renderer
                               + pipeline + *.wgsl
estilos/tokens.css             gerado de lib/marca.ts
estilos/base.css               reset enxuto + tipografia
lib/marca.ts                   cópia carimbada de theme.ts, com procedência
lib/rotas.ts                   tabela de rotas — fonte do menu e dos testes
public/fontes/                 as duas .woff2, resgatadas do main
public/poster/heroi.webp       resgatado do main; substituído no passo 8
public/marca/logo.webp         derivado do PNG da marca (seção 6)
next.config.ts                 export + turbopack.rules para *.wgsl
```

### Por que o `Topo` não fica no layout

Três razões independentes, todas verificáveis nos artboards:

1. Nos artboards internos o `Topo` é `position: absolute` **dentro** da faixa do
   topo; na Main é absoluto sobre o herói. Nunca é irmão no fluxo.
2. O item ativo muda por página. Ler isso no layout exigiria `usePathname`, que
   torna o componente cliente e coloca JS numa página que não precisa de nenhum.
3. A `Faixa` já é o dono do contexto visual onde o `Topo` vive.

Portanto: **a `Faixa` monta o `Topo` dentro de si**, recebendo `ativo` por prop.
O layout carrega `{children}` e o `Rodape`, e mais nada.

### Os seis componentes

| Componente | Props | Contrato |
|---|---|---|
| `Topo` | `ativo` | wordmark "Sephir"/"Studio" (âmbar/stardust) + nav de 4 itens; `aria-current="page"` no ativo, que fica em `--cor-stardust`; os demais em `--cor-muted` |
| `Rodape` | — | logo, tagline, CNPJ, links GitHub e contato |
| `Faixa` | `titulo`, `ativo`, `imagem?`, `sub?`, `regua?` | cabeçalho de página interna; monta o `Topo`; sem `imagem` não emite `<img>`; `regua` desenha o traço âmbar de 64 px |
| `Secao` | `numero`, `rotulo`, `titulo` | eyebrow mono `01 — O QUE É` (número em âmbar, rótulo em muted, `letter-spacing: .18em`, caixa alta) + `<h2>` |
| `Linha` | `colunas`, células | grid com `border-top`; `colunas` vem de conjunto fechado: `'estado'` (140px 1fr) e `'portao'` (64px 240px 1fr) |
| `Seta` | `href`, `direcao` | CTA: régua âmbar + texto + ícone; `direcao` troca o glifo entre `→` e `↓` |

`Linha` é a abstração mais discutível do conjunto: são duas grids diferentes que
compartilham o idioma visual (`border-top`, alinhamento por baseline, rótulo
mono). Um componente com `colunas` de conjunto fechado é preferível a dois
componentes quase idênticos. Se na implementação a prop começar a crescer, a
decisão se reverte em dois componentes e isso vira nota.

### Tokens

`lib/marca.ts` é cópia literal de
`~/Documents/sephir/sephir-brand/00-identidade/tokens/theme.ts`, com cabeçalho
declarando origem e data do carimbo. `estilos/tokens.css` é gerado a partir dele.
Um teste unitário prova que os dois não derivaram (seção 7).

---

## 5. O herói WebGPU

Baseado no exemplo `optimized-black-hole` da vgpu
(<https://vgpu.sh/examples/optimized-black-hole>), obtido pela skill `vgpu`
v0.3.1. A versão da biblioteca é fixada no `package.json` na instalação. Fonte e
licença citadas no cabeçalho de cada `.wgsl` derivado.

### Isolamento

`componentes/heroi/` é o **único ponto de entrada cliente do site**. Nenhuma
rota, nenhum layout e nenhum dos seis componentes da seção 4 é `'use client'`.

Atenção a uma armadilha do App Router: `next/dynamic` com `ssr: false` **não é
permitido dentro de um Server Component**, e as páginas são todas Server
Components. O ponto de entrada é portanto um par:

```
componentes/heroi/index.tsx     'use client' — faz o next/dynamic({ ssr: false })
componentes/heroi/Canvas.tsx    'use client' — o canvas e o ciclo de vida
```

Os dois vivem no mesmo chunk e contam como **um** ponto de entrada. A `vgpu`
entra mais fundo ainda, por `await import("vgpu")` dentro do renderer, como no
exemplo — não está no chunk de entrada.

`heroi.webp` continua sendo o elemento de LCP e é também o fallback.

### Quando o canvas NÃO monta

1. `navigator.gpu` ausente.
2. `prefers-reduced-motion: reduce`. Com um buraco negro em rotação isso não é
   boa prática, é necessidade.
3. Falha de `init()` ou de compilação.
4. **Falha de GPU depois de o primeiro quadro já ter pintado** — perda de device
   por reset de driver, troca de GPU num laptop híbrido, `requestDevice`
   revogado sob pressão de memória. Neste caso o canvas já está montado e
   opaco, então "não montar" não descreve a saída: o renderer **desliga**
   (`desligar()`, que dispara `aoDesligar` → `setPintando(false)` no
   `Canvas.tsx`), o `<canvas>` perde `heroi__canvas--visivel` e volta a
   `opacity: 0`, e o pôster reaparece por baixo. O erro é registrado no console
   e **não é relançado**: o `throw` viria de dentro de um callback de
   `requestAnimationFrame`, onde ninguém pode capturá-lo, e o contrato do
   `Canvas.tsx` já é "o visitante não tem o que fazer com um erro de WebGPU".

> **Acrescentado em 2026-09-26, achado pela revisão final (I10).** Esta lista
> tinha três casos, e o quarto era o único em que a promessa do parágrafo abaixo
> não valia: `lidarComFalha` chamava `descartarInterno()` em vez de `desligar()`,
> então `aoDesligar` nunca disparava e o `<canvas>` ficava morto e **opaco por
> cima** do pôster, congelado no último quadro ou em branco. E relançava de
> dentro do rAF, virando `pageerror` na aba do visitante. Corrigido em
> `componentes/heroi/renderer.ts`, com os quatro casos de
> `tests/unit/heroi-falha.test.ts` travando o comportamento — os quatro
> conferidos vermelhos contra o código anterior.

Nos quatro casos o pôster permanece visível e nada mais acontece. O pôster nunca
é removido do DOM — o canvas é sobreposto a ele.

### Enquadramento — decisão (a)

Adotados os defaults do exemplo, sem divergir:

- **Desktop:** `centerX: 0.8`, `centerY: 0.3`, `cameraRoll: -0.27`,
  `mouseYaw: 0.15` — o sujeito fica à direita, onde o pôster já o colocava, e
  não disputa leitura com o `<h1>` a 154 px da esquerda.
- **≤ 767 px:** `centerX: 0`, `centerY: 0`, `cameraRoll: 0`, `mouseYaw: 0`,
  `centerFade: 1` — recentrado, com o miolo esmaecido para o `<h1>`, que ocupa a
  largura toda, continuar legível.

Os dois overlays de gradiente do artboard são **mantidos como estão**. Foram
calibrados para uma nebulosa difusa e agora cobrem um sujeito de alto contraste;
se o contraste do texto cair, a correção é no shader (`centerFade`, brilho do
disco), não no gradiente — o gradiente é parte do mock aprovado.

### Degradação — decisão (b)

`frame-health.ts` do exemplo `adaptive-quality`, mais queda de DPR. **Sem**
`detect-gpu`, **sem** Battery Status, **sem** segunda pipeline: o guia da vgpu
recomenda explicitamente não adotar o padrão completo enquanto o shader ainda
está sendo calibrado, e aponta este par como o menor passo útil.

Política, em ordem:

| Estado | Condição | Ação |
|---|---|---|
| normal | — | cap intencional de 30 fps, `targetFps: 30` passado honestamente ao monitor |
| degradado | FPS apresentado < 24 (80% de 30) por 2 s de tempo **ativo** | DPR fixado em 1 — metade da resolução linear, um quarto dos pixels num aparelho DPR 2 —, depois `resetHealth()` |
| desligado | a condição persiste após a queda de DPR | canvas desmonta, pôster permanece |

Intervalos acima de 250 ms (aba oculta, ociosidade) reiniciam a janela em vez de
contarem como quedas. Nada volta a subir sozinho.

### Pôster — decisão (c)

`heroi.webp` serve durante a rodada. A **última tarefa** captura um quadro do
shader já calibrado em headless (guia `agent-browser-webgpu`, que cobre Linux sem
placa — o caso desta máquina) e substitui o arquivo.

Motivo: hoje quem não tem WebGPU, ou pediu movimento reduzido, vê uma nebulosa
enquanto todo o resto vê um buraco negro. O fallback precisa ser o mesmo assunto.

Restrições que o pôster gerado herda: peso na ordem do atual (35 372 B), e
precisa funcionar sob os dois gradientes sem perder o contraste do `<h1>`.

**Rede de segurança:** se a captura headless não sair nesta máquina, fica o
`heroi.webp` e isso vira nota registrada, não bloqueio da rodada.

### Wiring do loader WGSL

Os `.wgsl` do exemplo têm grafo de `import` entre si (`shade` → `gbuffer`,
`disk`, `stars`; `bake` e `refine` → `geodesic`; `stars` →
`@vgpu/wgsl-std/hash`). Isso exige o loader, que resolve o grafo em tempo de
build. Em Next 16, pela chave de topo:

```ts
turbopack: { rules: { '*.wgsl': { loaders: ['@vgpu/wgsl/loader-webpack'], as: '*.js' } } }
```

Mais a declaração ambiente de `@vgpu/wgsl` num `.d.ts`, senão `import x from
'./shade.wgsl'` não tipa.

---

## 6. Os três buracos do design, e como cada um fecha

**1 — Conflito de peso tipográfico.** Os sete artboards declaram
`h1, h2, h3 { font-weight: 300 }`. O `theme.ts` declara `weight: 500` para
`hero`, `h1` e `h2`. Não dá para obedecer aos dois.

*Resolução:* **300**, o valor do artboard. O artboard é o mock que será aberto
lado a lado para julgar fidelidade, e Space Grotesk é fonte variável declarada
em `font-weight: 300 500` — o peso existe no arquivo. A divergência com
`theme.ts` fica anotada em `lib/marca.ts`; corrigir a fonte da marca é trabalho
de outro dono.

**2 — `logo.webp` não existe.** Os rodapés (150 px) e o 404 (260 px) o
referenciam. `public/` só tem `heroi.webp` e as duas fontes. O único arquivo de
logo é
`~/Documents/sephir/sephir-brand/00-identidade/logo/Logo_SephirStudio_v1.png`,
**891 719 B, 1672 × 941**.

*Resolução:* derivar `public/marca/logo.webp` a ~520 px de largura, que serve o
rodapé a 150 px e o 404 a 260 px em telas 2×. Alvo de peso: abaixo de 30 kB.
A marca tem halo que se dissolve no preto — usar só sobre `--cor-void`, nunca
sobre fundo claro.

**3 — O menu mobile não foi desenhado.** O artboard `Mobile` mostra o botão
hambúrguer; não mostra o menu aberto.

*Resolução:* `<details>`/`<summary>` estilizado. Sem JavaScript, sem componente
cliente, alvo de toque ≥ 44 px, e o `<summary>` carrega o rótulo acessível. Não
se inventa tela que o design não tem: a lista aberta repete os quatro itens do
`Topo` empilhados, com as mesmas cores de estado.

---

## 7. Régua — os testes, escritos antes do código

Quatro camadas. Vermelho primeiro, sempre.

**1. Unit render** (`renderToStaticMarkup`, sem jsdom — roda em milissegundos).
É esta camada que dirige o TDD dos seis componentes. Um teste por contrato:

- `Topo` põe `aria-current="page"` só no item ativo;
- `Faixa` sem `imagem` não emite `<img>`;
- `Secao` põe o número em âmbar e o rótulo em caixa alta mono;
- `Seta` com `direcao="baixo"` troca o glifo;
- `Linha` com `colunas="portao"` emite a grid de três colunas;
- `Rodape` traz o CNPJ literal `63.037.641/0001-30`.

**2. Unit puro** — dois guardas de deriva:

- `estilos/tokens.css` contém exatamente os hexes de `lib/marca.ts`;
- todo `href` do menu do `Topo` existe em `lib/rotas.ts`.

**3. Build, sobre `out/`** — depois de `next build`:

- os **HTML** da árvore são exatamente os cinco arquivos da seção 2, nem mais
  nem menos — e nenhum arquivo de `out/` tem extensão fora de
  `.css .html .js .txt .webp .woff2`;
- todo `href` interno resolve para arquivo existente;
- `'use client'` aparece **só** dentro de `componentes/heroi/` — varredura na
  árvore de fontes, não no `out/`.

**4. E2E Playwright**, sobre `out/` servido estático:

- axe sem violação nas cinco rotas, em 1920 px e 390 px;
- cor computada: `body` é `#05070E`, `<h1>` é `#F4EFE6`, acento é `#E8963A`;
- `document.fonts.check()` confirma que Space Grotesk foi mesmo desenhada — a
  pilha computada dizer "Space Grotesk" não prova que o navegador a usou;
- sem `navigator.gpu`, o canvas não monta e o pôster continua visível;
- com `prefers-reduced-motion: reduce`, idem.

Unit do herói usa `vgpu/mock` (`createMockAdapter`). `frame-health` é puro:
alimentado com amostras sintéticas `{ deltaMs, active, rendered }`.

### Observação honesta

Esta lista converge para os oráculos `W*` que o experimento descartou — outros
nomes, mesmas medidas. Isso é **resultado**, não falha de método: se dois
processos independentes chegam nas mesmas medidas, a medida era necessária e a
cerimônia em volta é que era opcional. Registrar na conclusão.

---

## 8. Limiares — declarados agora, antes de medir a vgpu

O passo 0 mede o `main`. A vgpu só é medida depois. Nenhum número abaixo se
renegocia por ter estourado.

| Número | Limiar | Origem do limiar |
|---|---|---|
| chunk do herói | **≤ 95 kB brotli**, fora do payload inicial | nosso código já medido: 11 806 B br de WGSL + 6 422 B br de TS ≈ 18 kB. Sobram ~77 kB para o runtime da vgpu, estimado em 40–70 kB br. A margem é deliberada; estouro é achado registrado. |
| LCP | não pior que o `main` | medido no passo 0, perfil móvel do Lighthouse |
| CLS | ≤ 0,02 **e** não pior que o `main` | idem |
| axe | **0** violações | cinco rotas × dois viewports |

> **Este número NÃO foi cumprido, por decisão do titular em 2026-09-25.** A
> Tarefa 17 — a primeira a abrir navegador real — achou uma violação WCAG 2 AA
> `color-contrast` de verdade: `--cor-faint` (#4A5468) sobre `--cor-void`
> (#05070E) dá **2,64:1**, e texto pequeno exige 4,5:1. Ela aparece nas cinco
> rotas e nos dois viewports, sempre pelo mesmo par de cores, **num elemento**:
> a tagline do rodapé (13 px).
>
> **Correção de 2026-09-26, achada pela Tarefa 23:** esta nota dizia "dois
> elementos", incluindo o selo de fase (11 px). A medição diz **um**. O selo fica
> sobre os véus de gradiente do herói, onde o axe cai em `incomplete` em vez de
> `violation`, porque o fundo depende do pixel renderizado. A Tarefa 17 já havia
> estabelecido isso — a lista de aceitos no teste tem só `.rodape__tagline` — e eu
> deduzi "dois" lendo o CSS, sem medir, e nunca corrigi a spec. O selo **também**
> tem contraste insuficiente onde o fundo é escuro o bastante; a diferença é que o
> axe não consegue provar, não que o problema não exista.
>
> A causa está na marca, não no site: o `theme.ts` oficial define `faint` como
> "texto terciário, captions, placeholders" — um uso que essa cor não serve de
> forma acessível sobre o fundo da própria marca. Dos cinco tons, é o único que
> reprova; `muted` dá 6,54:1, `amber` 8,49:1, `teal` 8,21:1, `stardust` 17,58:1.
>
> Apresentei três saídas ao titular — trocar o token no site, corrigir a cor na
> marca, ou aceitar e documentar. **Ele escolheu aceitar e documentar**, para
> preservar a fidelidade ao mock aprovado. A consequência fica registrada sem
> atenuação: **o experimento falha este número por escolha declarada**, não por
> limitação técnica, e usuários com baixa visão não conseguem ler a tagline do
> rodapé — nem, provavelmente, o selo de fase, que o axe não consegue julgar.
> A correção de marca fica fora desta rodada.
| FPS | política da seção 5 | cap 30, queda a 24 por 2 s, desligamento |
| JS de aplicação | `'use client'` só em `componentes/heroi/` | um ponto de entrada, dois arquivos, um chunk |

Peso de framework: **registrado, não orçado** (seção 3).

**Custo da rodada:** tempo de parede e US$ lidos do transcrito da sessão,
comparados aos US$ 3,32 que o canvas de design custou e ao que os relatórios do
`main` registrarem.

---

## 9. Ordem do trabalho

0. Medir o `main`: peso brotli (feito — seção 3), LCP e CLS por Lighthouse.
1. Esqueleto que compila vazio: `package.json`, `tsconfig`, `next.config.ts`,
   `app/layout.tsx`, mais o resgate dos três binários do `main`
   (`git checkout main -- public/fontes public/poster`). `next build` produz
   `out/`.
2. `lib/marca.ts`, `estilos/tokens.css`, `estilos/base.css`, com o guarda de
   deriva.
3. Os seis componentes, um por um, em TDD.
4. As cinco páginas.
5. `logo.webp` derivado.
6. O herói: pipeline, shaders, degradação.
7. Testes de build e E2E.
8. Pôster gerado do shader.
9. Medir os quatro números e escrever a comparação.

---

## 10. Riscos

| Risco | Sinal | O que fazer |
|---|---|---|
| Captura headless de WebGPU não funciona nesta máquina sem placa | passo 8 falha | fica `heroi.webp`; vira nota, não bloqueio |
| Chunk do herói estoura 95 kB br | passo 6 | registrar o número real e a diferença; **não** subir o limiar |
| Overlays do artboard matam o contraste sobre o buraco negro | inspeção lado a lado no passo 6 | corrigir no shader, nunca no gradiente |
| `Linha` com `colunas` vira prop que cresce | passo 3 | reverter para dois componentes; anotar |
| Comparação de custo poluída por esta sessão de brainstorm | fim | contabilizar brainstorm separado da implementação, e dizer qual é qual |
