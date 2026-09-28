# Redesign do zero — o que os quatro números disseram

**Data:** 2026-09-26
**Branch medida:** `zero/redesign` em `7726259` (53 commits, os 53 assinados)
**Linha de base:** `baseline-main-ed68bd4/`, o build do `main` em `ed68bd4`
**Instrumentos:** `ferramentas/medir.mjs` (brotli -q 11), `@lhci/cli` 0.15.1 com
`CHROME_PATH=/usr/bin/chromium`, `axe-core` via `@axe-core/playwright`.

Todo número deste relatório vem de comando rodado nesta sessão, com a saída
colada no `task-23-report.md` ao lado. Onde não foi possível medir, está escrito
"não medido" e o motivo.

Uma ressalva de reprodutibilidade: no `medir.mjs`, as colunas `css` e `js`
reproduzem byte a byte entre builds, mas a coluna **`doc` varia alguns bytes**
(≤ 14 B observados) de um `next build` para o outro, por churn de build id. Nenhum
número publicado aqui depende da coluna `doc`. A árvore do `main`, sendo build
congelado em disco, reproduz inteira ao byte.

---

## A hipótese, como estava escrita

Copiada literalmente da spec §1, sem suavizar:

> Partindo do mesmo design aprovado, o processo do Superpowers entrega **cinco
> rotas** com LCP e CLS não piores que os do `main`, zero violação de axe, e o
> herói WebGPU dentro do limiar declarado na seção 8 — por custo de rodada menor
> que o da pipeline de portões.

E a condição de falseamento, também literal:

> Se qualquer um desses falhar, o experimento falhou e isso fica registrado. O
> limiar não se renegocia depois de medido.

---

## Os quatro números

| Número | Limiar declarado | Medido | Veredito |
|---|---|---|---|
| chunk do herói | ≤ 95 kB br (97 280 B) | **68 233 B br** | **PASSA** — 29 047 B de folga (29,9%) |
| LCP (móvel, mediana de 5) | não pior que o `main` | main **2 004,42 ms** → zero **1 834,72 ms** | **PASSA** — 169,70 ms mais rápido |
| CLS | ≤ 0,02 **e** não pior que o `main` | main **0** → zero **0** | **PASSA** — zero nas 20 execuções |
| axe | **0** violações | **10 nós em violação** | **NÃO CUMPRIDO** |

### O chunk do herói — 68 233 B

Medido pelo terceiro método de `ferramentas/medir.mjs`
(`medirHeroiPorNavegador`), que usa o navegador real como autoridade sobre
*quais* arquivos são pedidos e o brotli em disco como autoridade sobre *quanto*
cada um pesa. Composição:

```
    1529 br  /_next/static/chunks/2mml24trngo8q.js     (glue do next/dynamic)
   52109 br  /_next/static/chunks/2pb0n4umx0_i8.js
     161 br  /_next/static/chunks/36zn_8inpik2m.js
   14434 br  /_next/static/chunks/43_vn40bfipxn.js
   ─────────
   68233 br  TOTAL   (limiar 97 280)
```

Os dois métodos anteriores — diferença home−sobre e atribuição por chunk
referenciado em `<script>` — **medem 1 529 B e estão estruturalmente errados**:
os dois leem HTML, e HTML não vê `import()` dinâmico. Eles seguem na suíte
marcados `it.fails()` de propósito, para que a invalidez fique registrada em
asserção e não em prosa.

### LCP e CLS — e uma divergência de instrumento que precisou ser resolvida

O ledger registra a linha de base da T0 como **1 920,52 ms**. Ao remedir, obtive
**2 004,42 ms** — e a explicação não é ruído: **a T0 serviu a linha de base com
`npx serve`, que comprime, e o `tests/support/servidor-estatico.mjs` não
comprime.** Verificado, não inferido:

```
=== servidor-estatico.mjs (o nosso) ===
HTTP/1.1 200 OK
(sem content-encoding = sem compressao)

=== npx serve (o que a T0 usou) ===
HTTP/1.1 200 OK
Content-Encoding: br
```

Comparar o lado novo sem compressão contra uma linha de base comprimida seria
comparar duas coisas. Então medi **as duas árvores nos dois servidores**, nesta
sessão, mediana de cinco, perfil móvel:

| servidor | main | zero | diferença |
|---|---|---|---|
| `servidor-estatico.mjs` (sem compressão) | 2 004,42 ms | **1 834,72 ms** | zero 169,70 ms mais rápido |
| `npx serve` (brotli) | 1 924,03 ms | **1 636,19 ms** | zero 287,84 ms mais rápido |

**CLS = 0 em todas as 20 execuções**, nas duas árvores e nos dois servidores.

A identificação do instrumento está confirmada por um número independente: o
`main` sob `npx serve` hoje transferiu **217 303 B**, exatamente o valor que a T0
registrou, e o LCP deu 1 924,03 ms contra os 1 920,52 ms dela — 3,5 ms de
diferença. A máquina está no mesmo estado; o que mudou foi só o servidor.

**O veredito é o mesmo sob os dois enquadramentos**, inclusive no desfavorável
(zero sem compressão contra a linha de base comprimida do ledger: 1 834,72 vs
1 920,52, ainda 85,80 ms mais rápido). Isso é o que torna o resultado robusto —
não depende de qual das duas comparações se escolhe.

Contexto que corta contra a intuição: **o lado novo é mais pesado no fio e
ainda assim pinta mais rápido.** Transferido sob brotli: main 217 303 B, zero
310 910 B (+93 607 B, +43%). O herói entra por `import()` dinâmico depois do
`load`, fora do caminho crítico do LCP.

> **Corrigido em 2026-09-26, achado pela revisão final (I3).** A frase acima
> terminava com "e o elemento de LCP é o pôster". **Isso é falso nesta branch, e
> a razão real é melhor para o `zero` e pior para a comparação.**
>
> O elemento de LCP do `zero` é o **`<h1>`**; o do `main` é a **`<img>`**. Medido
> pelo mesmo instrumento, em dez execuções (cinco por árvore) nesta sessão, sem
> uma exceção:
>
> ```
> zero  LCPel: body > div.heroi > div.heroi__texto > h1     5/5
> main  LCPel: body > header.heroi > img.heroi__fundo       5/5
> ```
>
> **Mecanismo, estabelecido por experimento.** A causa é `.heroi { min-height:
> 100svh }`: o Chromium trata imagem que cobre o viewport inteiro como fundo de
> página e a tira da disputa de LCP. Servindo a mesma árvore com `70svh`, o pôster
> volta a ser o elemento de LCP. Remover os véus ou acrescentar
> `width`/`height`/`fetchpriority="high"` não muda nada. No `main` a mesma imagem
> contava porque lá o `<header class="heroi">` tinha altura de conteúdo.
>
> **Consequência para o veredito:** o `zero` não espera 35 kB de imagem porque o
> que ele mede não é a imagem. O limiar "não pior que o `main`" passa, os números
> são honestos, e **os dois lados medem tipos de elemento diferentes** — o que está
> agora registrado na tabela do veredito. `100svh` é o design aprovado e fica: um
> LCP de texto a ~1,8 s é melhor que um de imagem a ~2,0 s.
>
> E o que os quatro números não diziam: o LCP desta branch é **~99% render
> delay** — governado por bloqueio de main thread, não por byte de imagem. O que
> leva ao número seguinte, que eu havia declarado como não medido.

### TBT — medido agora, e reprova nas duas árvores

O `W4` tem três métricas; esta rodada mediu duas e declarou a terceira como
dívida. **Medir custava o mesmo comando.** Medido, mediana de cinco, perfil
móvel, mesmo instrumento e mesmos dois servidores:

| árvore | TBT (5 execuções, ms) | mediana | teto `W4` | veredito |
|---|---|---|---|---|
| `main` | 234 · 237 · 282 · 389 · 407 | **282 ms** | 200 ms | **estoura 1,4×** |
| `zero` | 311 · 331 · 345 · 440 · 562 | **345 ms** | 200 ms | **estoura 1,7×** |

**As duas árvores reprovam o teto, e o `zero` é a pior das duas.** É a única das
medidas desta rodada em que o `zero` não ganha.

Duas honestidades sobre a magnitude. Primeira: **o TBT é métrica ruidosa** — a
amplitude é de 251 ms no `zero` e 173 ms no `main`, e as distribuições se
sobrepõem (o máximo do `main`, 407 ms, fica acima da mediana do `zero`, 345 ms).
Segunda: a revisão final mediu o mesmo com n=3 e obteve `main` 328 ms / `zero`
334 ms — **6 ms** de diferença contra os 63 ms desta medição. **A direção é
consistente nas duas medições independentes; a magnitude não está resolvida**, e
afirmar mais que "o `zero` é pior, por uma margem dentro do ruído do
instrumento" seria inventar precisão.

O que **não** é ruído é o estouro: 282 e 345 contra um teto de 200 não se
explicam por variância. E isto fecha o argumento da seção 1 no lugar certo. Não
é só que esta branch não tem asserção de tempo — é que **a asserção que falta
teria ficado vermelha**, nas duas árvores, desde o começo. "TBT não medido" lia
como lacuna neutra; medido, é o quarto número que ninguém queria ver.

**Não muda o veredito da hipótese:** TBT não é um dos seis termos. Muda o que a
seção "o que ficou por fazer" pode dizer, e muda para pior.

### axe — 10 nós em violação, e o experimento falha este número

Contei as violações **cruas**, sem o filtro `CONTRASTE_ACEITO` que a suíte
aplica, nas cinco rotas × dois viewports:

```
=== TOTAL de nos em violacao: 10 ===
  10x  color-contrast|.rodape__tagline|ratio=2.64
```

Um nó por rota, nas dez combinações, sempre o mesmo par de cores e sempre o
mesmo seletor. Nenhuma outra violação em nenhuma rota.

**O experimento falha este número por escolha declarada do titular, não por
limitação técnica.** `--cor-faint` (#4A5468) sobre `--cor-void` (#05070E) dá
**2,64:1**, contra os 4,5:1 que a WCAG 2 AA exige para texto pequeno — e o axe
confirma o 2,64 por conta própria. A causa está na **paleta da marca**, não no
site: o `theme.ts` define `faint` como "texto terciário, captions,
placeholders", uso que a cor não serve sobre o fundo da própria marca. Dos cinco
tons é o único que reprova (muted 6,54:1, amber 8,49:1, teal 8,21:1, stardust
17,58:1).

**Usuários com baixa visão não conseguem ler a tagline do rodapé.** Isso vale em
todas as cinco rotas e nos dois viewports. O titular escolheu aceitar e
documentar, para preservar fidelidade ao mock aprovado; a correção de marca
ficou fora desta rodada.

Uma correção de escopo ao registro anterior: a spec §8 e o ledger dizem que a
violação aparece em **dois** elementos — a tagline do rodapé (13 px) e o selo de
fase (11 px). **A medição diz um só.** O `.selo` fica sobre os véus de gradiente
do herói, onde o axe devolve `color-contrast` como `incomplete` e não como
violação, porque o pixel por baixo depende da imagem. A T17 já havia achado isso
na sua rodada de correção (o seletor real era só `.rodape__tagline`); o texto da
spec §8 não foi atualizado. O elemento continua ilegível — o que muda é que o
axe não o classifica como violação, e portanto ele não entra na contagem.

Fora das violações, o axe devolveu `color-contrast: incomplete` em 15 nós no
desktop e 12 no móvel na home, 7 e 3 em `/pt/sobre/`, e nenhum nas duas rotas
sem imagem de fundo. São indeterminações estruturais — texto sobre gradiente
semitransparente sobre imagem — e com o canvas do herói no lugar da foto elas
são **permanentemente** indetermináveis por ferramenta automática.

---

## O custo

### Tokens — medidos, por fase

Da tabela `custo-subagentes.md`, que o controlador escreveu porque estes números
vivem nas notificações de conclusão de subagente e não em arquivo nenhum. São
**máximos por agente**, não somas de leituras intermediárias.

| | agentes | tokens |
|---|---|---|
| **brainstorm** (spec + 5 arquivos de plano + 24 tarefas, 160 passos) | 0 subagentes | **não disponível** — rodou no controlador |
| implementação (T0–T22) | 24 (T15 com 2) | 2 639 469 |
| revisão | 23 (sonnet) | 1 861 580 |
| re-revisão | 9 (haiku) | 385 575 |
| **total de subagente** | **56** | **4 886 624** |

Por modelo: haiku **914 475**, sonnet **3 972 149**. Opus só nesta tarefa, e o
custo dela não está na tabela.

Tempo de parede somado dos dispatches de implementação: **252,2 min (4,20 h)**.
Não é o tempo de parede da rodada — exclui revisão, re-revisão, o trabalho do
controlador e as duas interrupções de sessão.

**O que este total não inclui, e não é pouco:** o contexto do controlador — 24
dispatches longos, as 23 revisões e as 9 re-revisões da tabela acima **mais as
rodadas de fix que não geram agente novo** (é daí que vinham os "24 revisões, 14
re-revisões" da ressalva 2 do `custo-subagentes.md`, que contam trabalho do
controlador e não seats de subagente), a leitura do ledger e as
verificações próprias. A tabela é explícita sobre isso. O número de 4 886 624
tokens é portanto um **piso** do custo da rodada, não o custo.

### US$ — a conversão não foi possível

**Não é possível converter estes tokens em US$ com os dados registrados, e
inventar uma taxa seria pior que não responder.**

Existe tabela de preço (Sonnet US$ 3,00/US$ 15,00 por MTok de entrada/saída;
Haiku US$ 1,00/US$ 5,00; leitura de cache ≈ 0,1× da entrada; escrita 1,25×).
O que não existe é a **repartição** dos tokens: a tabela registra um total
indiferenciado por agente, sem separar entrada, saída, leitura de cache e
escrita de cache. E as taxas dessas categorias diferem por até **50×** — saída
de sonnet a US$ 15,00/MTok contra leitura de cache a US$ 0,30/MTok.

Os limites aritméticos brutos são estes:

| | piso (tudo leitura de cache) | teto aritmético (tudo saída) |
|---|---|---|
| haiku, 914 475 tk | US$ 0,09 | US$ 4,57 |
| sonnet, 3 972 149 tk | US$ 1,19 | US$ 59,58 |
| **total** | **US$ 1,28** | **US$ 64,15** |

> **Correção de 2026-09-26, achada pela revisão desta tarefa.** A redação
> original parava aqui e concluía que "uma faixa de 50× não é uma estimativa, é
> a declaração de que o dado não suporta a pergunta". **Essa conclusão
> over-claims**, e o dado que a refuta está nesta mesma seção.
>
> O teto supõe que os 4 886 624 tokens sejam **todos de saída**. Mas os 252,2 min
> de tempo de parede medidos para os 2 639 469 tokens de implementação dão 10 466
> tokens/min — **174 tokens/s sustentados** se tudo fosse saída. Não é atingível,
> e a maior parte desse tempo de parede é espera de ferramenta e não geração (a
> T19: 350 chamadas de ferramenta em 57 min). **O teto "tudo saída" está
> descartado por medição**, e a faixa real é bem mais estreita que 50×.

**Uma estimativa ancorada, explícita e falseável.** O canvas de design custou
**US$ 3,32 em 31 min** de duas sessões de subagente — mesma máquina, mesma
ferramenta, mistura de modelo e densidade de chamada comparáveis. São US$
0,107/min. Aplicado aos 252,2 min de implementação: **~US$ 27**. A premissa é
nomeada e é o ponto fraco — se a mistura de modelo ou a densidade de ferramenta
divergirem, a estimativa anda com elas. Mas é um número que se pode derrubar,
que é mais do que a faixa oferecia.

O que continua verdadeiro: **não dou número único para o custo da rodada.** A
repartição entrada/saída/cache não existe no dado registrado, e inventar uma
taxa seria pior que não responder. O que muda é que a recusa agora vem com um
intervalo útil e uma âncora medida, em vez de uma faixa de 50× apresentada como
impossibilidade.

**Contra o que se compararia:** nada. Os relatórios da pipeline de portões no
vault `sephir-site-workspace` não foram lidos nesta tarefa, então **o lado
direito da comparação de custo não foi medido** — e sem ele a cláusula de custo
da hipótese não é decidível, com ou sem a estimativa acima.

### Instrumentação que a próxima rodada precisa

O custo é o único dos seis termos da hipótese que esta rodada não conseguiu
decidir, e a causa é instrumentação ausente, não medição difícil. Registrar por
agente: tokens de entrada, de saída, de leitura de cache e de escrita de cache,
mais o modelo e a versão. São quatro números em vez de um, e tornam a conversão
aritmética.

---

## O veredito

**A hipótese falhou.** Falhou em um dos seis termos, passou em quatro, e um não é
decidível.

| termo da hipótese | veredito |
|---|---|
| cinco rotas | **cumprido** — `/`, `/pt/`, `/pt/sobre/`, `/pt/como-e-feito/`, `404.html`, travadas por igualdade estrita de HTML, mais uma lista fechada de extensões permitidas em `out/` (correção I6: a igualdade estrita sozinha só via HTML, e "nem mais nem menos" valia sobre os HTML da árvore, não sobre a árvore) |
| LCP não pior que o `main` | **cumprido** — melhor sob os dois instrumentos. **Ressalva medida:** os dois lados medem **tipos de elemento diferentes** — `<h1>` no `zero`, `<img>` no `main` (I3). O limiar passa e os números são honestos; o que eles comparam não é a mesma coisa. |
| CLS não pior que o `main` e ≤ 0,02 | **cumprido** — 0 nas 20 execuções |
| herói WebGPU dentro do limiar da spec §8 | **cumprido** — 68 233 B contra 97 280 B, 29 047 B de folga |
| zero violação de axe | **FALHOU** — 10 nós, por escolha declarada do titular |
| custo de rodada menor que a pipeline de portões | **não decidível** — o lado da pipeline não foi medido |

> **Correção de 2026-09-26, achada pela revisão desta tarefa.** Esta tabela tinha
> cinco linhas e falava de "os cinco termos". A hipótese da spec §1 — copiada
> literalmente vinte linhas acima neste mesmo documento — tem **seis**, e o que
> ficou de fora foi o limiar do herói. Ele é um dos quatro números do título deste
> relatório e **passou com 29 047 B de folga**, então a omissão foi contra a
> rodada. Mas era a tabela de veredito do experimento, e ela contava errado.

A regra da spec §1 é explícita: *"Se qualquer um desses falhar, o experimento
falhou e isso fica registrado."* O axe falhou. Registrado.

Vale separar duas coisas que é tentador misturar. A falha do axe **não é falha
do processo do Superpowers**: o processo achou a violação, mediu 2,64:1,
apresentou três saídas com o custo de cada uma, e travou o escopo exato do que
foi aceito para que violação nova continue reprovando. O que falhou foi o
**número**, por uma decisão de produto tomada com o dado na mão. O processo fez
exatamente o que um processo deve fazer; o resultado ficou fora do limiar de
todo modo, e o limiar não se renegocia.

E vale registrar o que mais incomoda neste veredito: **91 testes em 18 arquivos
não pegaram a violação**, porque nenhum deles abria navegador. A T17 foi a
primeira tarefa a abrir um, e achou na primeira execução. Dezessete tarefas de
verde não provaram nada sobre acessibilidade.

---

## O que o experimento descobriu sobre processo

### 1. O orçamento da pipeline mirou na coisa errada — mas não como a spec dizia

A spec §3 afirma que "149 kB de JS passaram sem orçamento". **Isso é falso, e a
verificação era um arquivo de distância.** O oráculo W3 do vault
(`_fabrica/oraculos-web.md`) orça JS explicitamente:

| Recurso | Teto do W3 | Medido (`main`) | Medido (`zero`) |
|---|---|---|---|
| HTML (doc da home) | 20 kB | 3 325 B (16,2%) | 4 125 B (20,1%) |
| CSS | 25 kB | 1 493 B (5,8%) | 2 232 B (8,7%) |
| JS de primeira carga | 130 kB | **148 945 B** | **149 164 B** |
| pôster (LCP) | 150 kB | 35 372 B (1280×720) | 35 606 B (1280×726) |
| total da home | 325 kB | 153 763 B (46,2%) | 157 050 B (47,2%) |

*(As cinco linhas do `W3`, não um recorte. As duas que eu havia omitido — HTML e
total da home — passam com folga larga, e a segunda reforça a tese desta seção:
o orçamento de total também mirou em risco que não existia, por um fator de 2.)*

*(kB = 1024 B nesta tabela, como na spec §8, que escreve "95 kB br (97 280 B)".
O pôster novo é 6 px mais alto que o antigo — diferença medida, sem efeito no
CLS, que deu 0 nas duas árvores.)*

A metade do CSS da afirmação se sustenta exatamente: 25 kB orçados, 1,5–2,2 kB
gastos. A metade do JS é pior do que "sem orçamento" — **havia orçamento, de 130
kB, e as duas árvores o estouram por ~16 kB.** O teto foi calibrado contra uma
base que o próprio W3 declara "medida em 113.787 B", e o total por rota que
`medir.mjs` computa é 148 945 B. São **35 158 B** de diferença entre a base que
o orçamento assume e o número que o mesmo método de compressão produz por rota.

**Não medi** a que chunks essa diferença de 35 158 B corresponde, então não
afirmo a causa. O que a medição sustenta: um portão que checasse contra a base
declarada passaria, enquanto o visitante baixa 16 kB acima do teto declarado. Um
orçamento cujo denominador mede outra coisa que o numerador é pior que nenhum
orçamento, porque produz verde.

E o ponto de fundo sobrevive intacto: **97% do peso é runtime de React/Next**,
igual nas duas árvores (148 945 vs 149 164 B, 219 B de diferença), e nenhum dos
dois processos moveu esse número. A casca de `meta refresh` em `/`, uma página
sem uma linha de interação, baixa 149 164 B de JS.

### 2. As quatro camadas de teste convergiram para os oráculos W\* — cinco de onze, não oito

A spec §7 previu a convergência. **Verifiquei nominalmente, oráculo por oráculo,
contra `_fabrica/oraculos-web.md` e os arquivos de teste da branch:**

| Oráculo W\* | O que mede | Reproduzido por | Mesma medida? |
|---|---|---|---|
| W1 contrato de rota | toda rota gera arquivo; nenhuma rota fora da tabela | `tests/build/arvore.test.ts` — "é exatamente os cinco HTML, nem mais nem menos" + "não vaza rota de devlog" | **sim**, nos dois sentidos; ferramenta diferente (fs vs playwright) |
| W2 integridade de link | zero `href` interno sem destino | `tests/build/links.test.ts` | **sim** |
| W3 orçamento de peso | peso por rota, brotli -q 11 | `ferramentas/medir.mjs` (ferramenta de mão, **sem limiar**) + `peso-heroi.test.ts` (mede o herói, não a rota) | **medida convergente, asserção ausente** — nada nesta branch reprova se uma rota estourar 130 kB |
| W4 orçamento de tempo | LCP ≤ 2,5 s · CLS ≤ 0,05 · TBT ≤ 200 ms, perfil móvel | este relatório, **à mão, uma vez** | **não reproduzido** — mesmo instrumento e perfil, mas o TBT **reprova nas duas árvores** (282 / 345 ms contra 200) e nenhum teste reprova regressão. Contar como convergência era o erro que o I3/I4 expôs. |
| W5 acessibilidade | axe + contraste ≥ 4,5:1 | `tests/e2e/acessibilidade.spec.ts` | **sim** — e os dois réguas reprovam no mesmo elemento |
| W6 degradação sem WebGPU | pôster aparece, texto aparece, zero erro de console | `tests/e2e/heroi.spec.ts` | **quase** — pôster e canvas sim; "zero erro no console" não é afirmado |
| W8 caminhos internos | zero `href`/`src` interno quebrado | `links.test.ts` (src + fragmento) | **parcial** — sem helper de rota nesta branch, a regra do helper não se aplica |
| W9 token de cor | zero matiz fora dos tokens | `tests/e2e/marca.spec.ts` | **sim** |
| W11 família de fonte | zero pilha fora das três; família confirmada carregada | `marca.spec.ts` — `document.fonts.check()` + zero CDN | **sim** |
| W7 citação íntegra | frontmatter do devlog | — | **não** — devlog fora de escopo (spec §2) |
| W10 fidelidade ao mock | pixelmatch, ≤ 0,5% dos pixels | — | **não** — fidelidade julgada a olho e por diff de texto |

**Cinco reproduzidos, quatro parciais, dois não.**

> **Correção de 2026-09-26, achada pela revisão desta tarefa — e é o achado mais
> importante dela.** Esta seção dizia "oito reproduzidos, um parcial, dois não",
> e concluía que "a asserção existe nos dois lados, o arquivo numerado por portão
> existe só num". **Os dois números estavam inflados a favor desta rodada, e a
> conclusão era falsa em dois oráculos.**
>
> A contagem: o `W6` estava marcado "quase" na própria tabela — e este mesmo
> relatório escreve, mais abaixo, que "zero erro no console" não é afirmado por
> nenhum teste desta branch — mas era contado entre os oito, enquanto o `W8`,
> marcado "parcial", ficava fora. Duas linhas com o mesmo status, dois
> tratamentos, e o arredondamento na direção favorável.
>
> A conclusão, que é pior: **nada nesta branch reprova se uma rota estourar os
> 130 kB de JS do `W3`.** Os únicos tetos de peso afirmados são o chunk do herói
> (97 280 B), o pôster (61 440 B) e o logo (30 720 B). O `medir.mjs` é ferramenta
> de linha de comando sem limiar; o `peso-heroi.test.ts` mede o herói, não a rota.
> O `W4` é medido uma vez, à mão, neste documento, por ninguém automaticamente.
>
> E isso fecha um círculo desconfortável com a seção anterior. Um parágrafo acima
> eu condeno a pipeline por *"um orçamento cujo denominador mede outra coisa que
> o numerador é pior que nenhum orçamento, porque produz verde"* — e **esta
> branch não tem orçamento de rota nenhum**, que é estritamente pior que o
> defeito que eu acabei de imputar. Eu tinha marcado isso como convergência.

A previsão da spec §7 se confirma **em parte, e menos do que eu escrevi**: onde a
convergência é real — contrato de rota, integridade de link, acessibilidade,
token de cor, família de fonte — dois processos independentes partindo do mesmo
design chegaram na mesma asserção com outros nomes, e ali **a medida era
necessária e a cerimônia em volta era opcional**. Mas em peso e tempo houve
convergência de *medida* sem convergência de *asserção*: os dois lados olham o
número, e só um lado reprova quando ele passa do teto. A ausência de teto de rota
nesta branch está registrada em "O que ficou por fazer", onde pertence.

As exceções restantes qualificam ainda mais a conclusão:

- **W10 (fidelidade ao mock por pixelmatch) não foi reproduzido, e é exatamente
  o oráculo que pegaria as divergências da seção seguinte.** Esta rodada
  substituiu um oráculo numérico por julgamento humano mais registro escrito.
  As três divergências foram todas deliberadas e estão documentadas — então o
  substituto funcionou *nesta* rodada. Mas "funcionou porque quem decidiu
  anotou" não é a mesma garantia que "reprova se passar de 0,5% dos pixels", e
  a diferença só aparece na rodada em que alguém não anota.
- **W7 não foi reproduzido porque o devlog está fora de escopo.** Isso não é
  convergência nem divergência — é escopo, e não deve contar como nenhum dos
  dois.

### 3. Os defeitos estruturais eram do plano, não dos implementadores

Esta é a descoberta que interessa mais que qualquer um dos quatro números.
Contado do ledger, nas 24 tarefas:

| severidade | quantidade |
|---|---|
| Crítico | **0** em 21 revisões com contagem registrada |
| Importante | **6** (T13 ×1, T15 ×2, T16 ×1, T19 ×2) |
| Menor | **25** em 21 revisões com contagem registrada |

*(T20 e T22 fecharam com "review clean após 1 fix round" e o ledger não registra
contagem numérica para elas — logo 21 revisões, não 23.)*

Dos 6 Importantes, o ledger marca **2 explicitamente como defeito do plano**:
o Importante 2 da T15 ("plan-mandated, defeito MEU" — o comando do LEIA-ME que
não rodava de diretório nenhum, achado porque o revisor **testou** em vez de
ler) e o Importante da T16 (`toContain('use client')` cru, `plan-mandated`).

E fora da contagem de severidade, o ledger tem **ao menos 13 pontos onde o
controlador atribui o defeito ao próprio plano ou brief** — é piso, não contagem
fechada: a revisão desta tarefa achou um 14º explícito (`progress.md:810`, o
comentário do `renderer.ts:14` que reproduz a leitura errada do brief) e um 15º
candidato (Ruling Q, "dois dos **meus** testes afirmavam comportamento default do
framework"). O erro é contra a tese desta seção, que fica **mais** forte com os
números certos. A lista dos 13 verificados, com o que cada um era:

| # | Defeito do plano | Onde |
|---|---|---|
| 1 | coluna de JS errada em 3 068 B (145 877 em vez de 148 945) | Ruling F, achado pela T0 |
| 2 | testes de contagem contavam o dobro — o payload RSC serializa `className` outra vez | Ruling M, T10 |
| 3 | exceção de cor escrita estreita demais (só parada de gradiente) | Ruling N, T10 |
| 4 | regra `.lista` faltando no bloco de CSS do brief | Ruling O, T10 e T12 |
| 5 | comando de procedência do LEIA-ME que não rodava | T15, Importante 2 |
| 6 | lista de rotas do E2E duplicada em vez de derivada de `lib/rotas.ts` | Ruling X, T17 |
| 7 | `Canvas.tsx` do brief contradizia o E2E do mesmo brief | Ruling Y, T18 |
| 8 | Step 4 autocontraditório — `reiniciar()` não zera `jaDegradou` | Ruling AD, T20 |
| 9 | regex de hook cega a tipo genérico (`useRef<T>(null)` não casava) | Ruling V, T16 |
| 10 | **os dois métodos de medição do herói liam HTML e não viam `import()` dinâmico** | Ruling AE, T21 |
| 11 | `allowImportingTsExtensions` faltando no programa de produção | Ruling H, pré-T4 |
| 12 | linha `Interfaces` do brief dizia que o `Topo` consome `brand` | Ruling I, T4 |
| 13 | instrumento de verificação errado — pedi julgar report por diff, e report é git-ignored | Ruling P, T13 |

Contra isso: **0 Crítico em 23 tarefas revisadas** — 21 com contagem registrada
no ledger, mais T20 e T22, que fecharam "review clean" sem número; a T23 não
tinha revisão quando esta linha foi escrita. E o ledger registra que os
implementadores acharam defeitos por conta própria com regularidade — a T13
achou o resíduo `out/404/` antes da revisão, a T20 achou e corrigiu uma corrida
de uso-após-descarte durante a implementação, a T21 recusou o próprio resultado
de 1 529 B em vez de celebrá-lo, a T19 parou e perguntou na terceira divergência
de API, a T15 parou em vez de descer abaixo do piso de qualidade.

**A conclusão de método:** num processo de subagente com plano escrito antes do
código, o gargalo de qualidade não é a execução — é a especificação. Os 13
defeitos acima teriam virado defeitos no artefato se a revisão não existisse, e
nenhum deles seria pego por um implementador obediente. **O item 10 é o caso
limite:** um instrumento de medição estruturalmente cego, que dava um número
plausível e pequeno, e que só foi desmascarado porque o Ruling C acrescentara
um teste de *piso* — a asserção de que o herói não pode custar zero. Um verde
que não prova nada é pior que um vermelho, e essa foi a única coisa que impediu
o experimento de publicar 1 529 B como o custo do herói.

### 4. O que a régua não sustentou

**"Vermelho primeiro, sempre" (spec §7) não sobreviveu inteiro.** O Ruling Q
registra que **três dos cinco testes da T14 passavam antes do código** — o de
ausência de `<button>`/`<input>` (não havia nenhum dos dois) e os dois de
viewport, porque o **Next 16 já emite viewport padrão** sem `user-scalable=no`.
Dois dos meus testes afirmavam comportamento default do framework, não código
nosso: passariam mesmo se o export `viewport` fosse removido.

Não é defeito a corrigir — são asserções de *saída*, e default de framework muda
entre versões sem aviso, então valem como trava de regressão. Mas desmente a
alegação de TDD estrito nesses três, e a lição é geral: **num plano escrito
antes do código, parte dos testes inevitavelmente afirma o que já era verdade.**
A régua "vermelho primeiro" pressupõe que o autor do teste saiba o que o
framework já garante, e num framework opinado ele não sabe.

**A amostra única de contraste do herói acertou o pior caso por sorte.** O
Ruling AC registra que a medição de contraste do `<h1>` sobre o canvas amostrava
**um instante de um sinal que varia no tempo** — `disk.wgsl` gira a textura de
turbulência com `omega = look.speed * 0.55 / pow(radius, 1.5)`, alimentada por
`shade.time`. A geometria do arco é estática; o brilho local não é. A amostra foi
tomada em `t≈0`, instante arbitrário, e deu **5,37:1**. A reamostragem com nove
amostras ao longo de quatro segundos deu mínimo **5,38:1**.

A amostra arbitrária ficou a **0,05 do pior caso amostrado**. Acertou. Por sorte.
**Alguém lendo só o número concluiria que amostrar um quadro basta** — e isso
propagaria exatamente o erro de método que a rodada corrigiu. O registro existe
para que não se conclua isso.

Isto pesa mais do que parece porque a T17 já estabeleceu que o axe devolve
`incomplete` nesse texto: com canvas, o fundo depende do pixel renderizado, e o
**axe nunca vai ter veredito ali**. A amostragem é a única defesa que existe, e
ela é amostragem — não prova.

**Receita de conversão não se copia entre tarefas sem medir.** A T15 descartou o
canal alfa e o logo caiu de 33 524 B para 8 264 B. A T22 aplicou `-alpha off` no
pôster e a flag **quebrou a cor no Chromium e inflou o arquivo**. Mesma flag,
efeito oposto, duas pastas de distância. A implementadora relatou o
comportamento medido duas vezes e rotulou a intuição sobre a causa (áreas planas
contra foto ruidosa) como não investigada — forma certa.

**Conhecimento registrado em prosa não protege; só asserção protege.** O Ruling
AF: a T22 escreveu o achado do alfa no documento de procedência e **não o
transformou em asserção**, repetindo um buraco que a T15 já havia fechado duas
pastas antes (`tests/build/logo.test.ts` ganhou dimensão e alfa, com o
comentário "não é otimização, é contrato"). Número anotado vale uma vez;
asserção vale sempre.

### 5. O modelo barato transcreve bem e conta mal

Foram **nove** tarefas de implementação em haiku (T3, T5, T6, T7, T8, T9, T11,
T12, T15). **Oito fecharam com revisão limpa**; a **T15 voltou "PRECISA DE
CORREÇÃO", com 2 Importantes e 2 Menores, e precisou de duas rodadas de fix** — e
um dos Importantes dela era de implementação, não defeito de plano meu (a suíte
do logo não travava largura nem ausência de alfa).

> **Correção de 2026-09-26, achada pela revisão desta tarefa.** Esta seção dizia
> "cinco de cinco tarefas de haiku saíram com código correto e revisão limpa".
> Isso era **citação literal do `Ruling K refinado` no ledger, escrita quando só
> cinco tarefas de haiku haviam rodado** — um placar parcial apresentado como
> final, que excluía o único contraexemplo. A própria seção discutia a T9, que é
> a sexta, o que deveria ter me avisado.
>
> É exatamente o modo de falha que eu declaro ter evitado quatro linhas abaixo:
> *"o relatório do subagente não é fonte de número"*. Apliquei a regra aos quatro
> números medidos e não a este. **O ledger também não é fonte de número** quando
> a linha citada é um instantâneo de uma rodada em andamento.

Em duas delas (T6, T8) o **autorrelato quantitativo** estava errado — 28 linhas
onde o diff tinha 32, "todas as 8 classes" numa frase que lista 7. O Ruling K e
seu refinamento resolveram proibindo a contagem em prosa, não trocando o modelo:
*cole saída de ferramenta, ou descreva qualitativamente.* Funcionou em uma
rodada, custo zero, e a T9 saiu com todo número reproduzindo saída colada.

A conclusão da seção sobrevive — **o modelo barato transcreve bem e conta mal**,
e os dois defeitos de contagem são de prosa, não de código. Mas a base amostral
é de nove e não de cinco, e um em nove exigiu duas rodadas de correção.

A mitigação que pegou o problema já existia: os prompts de revisão mandam tratar
o report como afirmação não verificada. **O relatório do subagente não é fonte
de número** — e esta tarefa aplicou a mesma regra ao ledger, remedindo os quatro
números em vez de citá-los.

### 6. Abstração validada por uso, não por opinião

A `Linha` era a abstração que a spec §4 registrou como "a mais discutível do
conjunto", com gatilho de reversão armado na T8 e ponto de decisão na T12. **O
gatilho não disparou:** a prop `colunas` bastou para a segunda variante de grid,
sem prop nova e sem parâmetro extra. O revisor confirmou pelo mérito —
`Linha.tsx` não aparece no diff da T12, a assinatura segue `'estado' | 'portao'`
sem terceira opção, e o JSX passa três filhos sem `style` inline. Era o único
lugar do plano onde eu previa reversão de desenho, e a previsão estava errada na
direção boa.

---

## Divergências conscientes do mock

Três, todas deliberadas, todas com motivo registrado no ledger. Nenhuma foi
pega por oráculo — o W10 não existe nesta branch (ver item 2 acima); todas
foram decididas e anotadas por pessoa.

**1. A grade dos oito portões em 4 colunas, não 8 (T10).** O artboard dispõe os
oito portões numa fileira; a home os dispõe em 4×2. Declarada no próprio passo
do plano, antes da implementação.

**2. `SATURATION` do disco de 0.0 para 1.0 (T19, Ruling AB).** **Única alteração
de valor em código de terceiro nesta rodada.** O `composite.wgsl` traz
`SATURATION: f32 = 0.0` literal do upstream, o que tornava o render
genuinamente em escala de cinza. O que decidiu: o gradiente térmico do disco
calcula **#FF8F2B** e **#FFF0D4**, contra `--cor-amber` **#E8963A** e
`--cor-stardust` **#F4EFE6** — quase idênticos. **O shader já computava a paleta
da marca, e a constante a jogava fora.** Não é "acrescentar cor", é parar de
descartar cor que é da marca por coincidência quase exata. Exigida nota de
procedência no cabeçalho com o valor upstream, o novo, e o porquê. Custo de
reverter: uma constante — mas exige refazer a checagem visual, porque os 5,37:1
foram calculados em cinza.

**3. O logo achatado sobre `--cor-void`, perdendo o canal alfa para sempre (T15,
Ruling S).** O dilema chegou como binário — aceitar 33 524 B ou violar o piso de
qualidade q70 — e o binário era falso: **o custo não estava na cor, estava no
alfa.** O halo é um gradiente suave em canvas cheio, e `alpha-quality=100`
custava ~25 kB dos 33 kB. Achatando sobre `#05070E`: **8 264 B a q88** —
qualidade *maior* que os 70 a que a tarefa se viu obrigada, com folga de 4× no
teto. **O que se perde de verdade:** o arquivo deixa de servir sobre qualquer
outro fundo, para sempre. Mas o LEIA-ME da marca já restringia o arquivo a fundo
escuro e já dizia que a versão clara "precisa ser gerada — não basta inverter".
O PNG oficial de 891 719 B continua intacto na pasta de marca.

Mais duas divergências que não são do mock mas precisam sobreviver ao registro:

**4. Peso de `h1`/`h2`/`h3` em 300, contra `weight: 500` do `theme.ts` (spec
§6.1).** Os sete artboards declaram 300; o `theme.ts` declara 500. Não dá para
obedecer aos dois. Escolhido 300, o valor do artboard, porque o artboard é o
mock que será aberto lado a lado para julgar fidelidade, e Space Grotesk é
variável declarada em `font-weight: 300 500`. A divergência está anotada em
`lib/marca.ts`; corrigir a fonte da marca é trabalho de outro dono.

**5. Os `AGENTS.md`/`CLAUDE.md` gerados pelo Next são commitados (Ruling Z).**
Artefato de ferramenta versionado, ~700 B, registrado aqui para que a comparação
de tamanho entre as branches não o confunda com conteúdo escrito.

---

## As duas branches lado a lado

Contexto de tamanho, não medida de qualidade.

| | `main` | `zero/redesign` |
|---|---|---|
| commits | 25 | **53** (os 53 assinados, `%G?` = `G`) — medido em `7726259`, antes do commit deste relatório, que faz 54 |
| arquivos versionados, sem `docs/` | 63 | 83 |
| arquivos de fonte (sem lock, sem binário) | 59 | 78 |
| linhas de fonte | 3 019 | **5 624** |
| rotas | 4 HTML | **5 HTML** |
| testes | não medido | 115 passando + 2 `it.fails()` = 117, em 23 arquivos |
| E2E | não medido | 37 passando + 1 skip condicional |

`git diff --stat main zero/redesign -- ':!docs'`: **122 arquivos, 5 602
inserções, 2 845 deleções.** As duas branches não têm ancestral comum — a órfã
nasceu vazia —, então o diff é reescrita completa, não evolução.

A contagem de testes do `main` **não foi medida**: exigiria rodar a suíte dele,
e a linha de base preservada é o `out/` do build, não a árvore de fontes.

Uma correção ao registro: o brief desta tarefa diz **58 commits**; a contagem é
**53**. O ledger é consistente com 53 — ele registra "40 commits na branch" no
fechamento da T17, e `git log --oneline 9482cfc | wc -l` devolve exatamente 40.
O 58 do brief não reproduz.

---

## O que ficou por fazer

**Fora de escopo por decisão, registrado na spec §2:**

- `/pt/devlog/` e `/pt/devlog/[slug]/`. Os dois artboards existem, mas exigem
  sistema de conteúdo (MDX, frontmatter, ordenação, navegação
  anterior/próxima) e posts reais que não foram escritos — o próprio artboard de
  post admite no corpo que seus números são de exemplo. Com eles vem o W7
  (citação íntegra), que não tem o que verificar até existirem.

**Dívida de verificação, medida e não fechada:**

- **A correção de `--cor-faint` na marca.** O `theme.ts` define `faint` como
  cor de texto terciário, uso que ela não serve sobre `--cor-void`. Enquanto não
  for corrigido, o experimento continua falhando o número de axe e a tagline do
  rodapé continua ilegível para quem tem baixa visão. É trabalho de dono de
  marca, não de site.
- **W10 — fidelidade ao mock por pixelmatch.** Nunca implementado nesta branch.
  As três divergências conscientes foram decididas por pessoa e anotadas; a
  quarta, se houver, não tem quem a pegue.
- ~~**TBT nunca foi medido.**~~ **Medido, e reprova nas duas árvores**: `main`
  282 ms, `zero` 345 ms, contra o teto de 200 ms do `W4` — 1,4× e 1,7×. Fica na
  lista porque continua sem asserção que reprove regressão, e porque **a dívida
  agora é maior do que quando eu a declarei**: não é uma métrica não medida, é uma
  métrica vermelha. Ver a seção "TBT" acima para a ressalva de ruído.
- **O terceiro caso de fallback do herói — falha de `init()` ou de compilação —
  não tem E2E** (lacuna conhecida da T18, deixada de propósito: simular falha de
  compilação de WebGPU em navegador é caro e frágil). Os outros dois casos
  (`navigator.gpu` ausente, movimento reduzido) têm.
- **A degradação por DPR foi provada só sinteticamente** (T20): a iGPU Intel
  gen-12lp sustenta o cap de 30 fps com folga, então o caminho de queda nunca
  disparou em hardware. O monitor é puro e testado com amostras sintéticas; a
  integração nunca foi exercida por um dispositivo lento de verdade.
- **"Zero erro no console" do W6 não é afirmado** por nenhum teste desta branch.
- **Nenhuma asserção reprova regressão de tempo.** O TBT foi medido (282 / 345 ms
  contra teto de 200) mas à mão, uma vez, neste documento — como o LCP e o CLS.
  A métrica está vermelha e nada a segura vermelha.
- **A amostragem temporal de contraste do herói é não determinística.** O
  `heroi-pintando.spec.ts` (achado I9) tira nove amostras espaçadas de 500 ms com
  o canvas pintando em GPU real, mas o Chromium estrangula o `requestAnimationFrame`
  numa janela headed sem foco: o número de instantes **distintos** varia por
  execução e chegou a degenerar para **um** numa das duas medidas aqui (a outra
  deu quatro). O teste protege ordem de grandeza — pega um `SATURATION` revertido,
  que era o objetivo — e **não** protege contra um transiente estreito dentro do
  ciclo de 10 s. Estabilizar exigiria forçar foco ou dirigir o relógio do `vgpu`
  por ticker externo.
- **Nenhum teto de peso por rota é afirmado.** É a lacuna que a revisão desta
  tarefa achou, e é a mais embaraçosa da lista: os únicos tetos de peso que
  reprovam nesta branch são o chunk do herói (97 280 B), o pôster (61 440 B) e o
  logo (30 720 B). **Nada reprova se uma rota estourar os 130 kB de JS, os 20 kB
  de HTML ou os 325 kB de total do `W3`** — o `medir.mjs` é ferramenta de mão sem
  limiar, e o `peso-heroi.test.ts` mede o herói, não a rota. Eu havia contado isso
  como convergência com o `W3` (ver a correção na seção 2). O `W4` tem o mesmo
  problema: medido uma vez, à mão, neste documento. Enquanto isso não existir como
  asserção, esta branch está **estritamente pior** que a pipeline no ponto que
  este relatório usa para condená-la: lá o orçamento existe e mede a coisa errada;
  aqui não existe.
- **O lado da pipeline de portões na comparação de custo.** Os relatórios do
  `main` no vault `sephir-site-workspace` não foram lidos nesta tarefa. Sem
  eles, a cláusula de custo da hipótese fica indecidível — e é a única das seis
  que fica. **Consequência direta:** as afirmações da seção 1 sobre o que os
  relatórios de portão registraram ou não registraram não têm base, e a spec §3
  foi corrigida para dizer isso.
- **Repartição de tokens por categoria** (entrada / saída / leitura de cache /
  escrita de cache), sem a qual nenhuma rodada futura converte tokens em US$.

**Indetermináveis por ferramenta, registrado para não voltar como surpresa:**

- Os `color-contrast: incomplete` do axe sobre os véus do herói. Com canvas no
  lugar da foto, o pixel de fundo é renderizado em runtime e o axe nunca terá
  veredito ali. A defesa é amostragem temporal, e ela é amostragem — a medição
  de 5,38:1 (mínimo de nove amostras) não é prova, e o Ruling AC existe para que
  ninguém a leia como tal.
