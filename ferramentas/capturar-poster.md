# Como o pôster foi capturado — Tarefa 22

O brief original (`task-22-brief.md`) manda instalar `agent-browser` e capturar
com `--webgpu --headed`, contando com SwiftShader (renderização por
software), porque foi escrito supondo que a máquina de execução não tivesse
GPU. **Essa suposição não valia para esta máquina**, e o caminho abaixo — mais
simples, sem instalar nada global — funcionou de ponta a ponta.

## 1. Por que o Playwright bastou

Esta máquina tem `DISPLAY=:0` já ativo — um X real (Hyprland/Omarchy, com
XWayland), não um framebuffer virtual. Testado antes de escrever qualquer
linha de captura:

```
$ echo $DISPLAY
:0
$ ls /tmp/.X11-unix
X0  X0_
```

Com Playwright apontando para esse display (`headless: false`, sem Xvfb, sem
`vulkan-swrast`), o adapter WebGPU é real:

```js
// verificação ad hoc, não faz parte do artefato final
const adapter = await navigator.gpu.requestAdapter();
// { isFallbackAdapter: undefined (falsy), vendor: "intel", architecture: "gen-12lp",
//   features: [... "shader-f16", "subgroups", "texture-compression-astc", ...] }
```

E o `<canvas>` do herói realmente monta e pinta (`.heroi__canvas--visivel`
presente), confirmando que não é o `adapter` nulo que o Chromium headless
padrão devolve nesta mesma máquina (testado e descartado antes de ir para o
caminho headed — ver seção 4).

Isso evita `agent-browser`, evita Xvfb/`vulkan-swrast`, e evita SwiftShader —
o pôster foi gerado com a GPU de verdade, não em software.

## 2. O comando de captura

Servidor estático já no ar (`node tests/support/servidor-estatico.mjs out
4173`, depois de `npm run build`), então:

```bash
DISPLAY=:0 node ferramentas/capturar-poster.mjs
```

Saída real desta execução:

```
canvas pintando (--visivel): true
canvas backing store: 1905 x 1080
canvas puro salvo em /tmp/heroi-bruto.png
```

O script (`ferramentas/capturar-poster.mjs`, comitado) abre `/pt/`, espera
`document.fonts.ready`, espera ativamente até `.heroi__canvas` ganhar a
classe `--visivel` (renderer pronto e primeiro quadro desenhado, teto de
20s), soma dois `requestAnimationFrame` mais 1s de folga, e então lê os
**pixels puros do `<canvas>` via `toDataURL('image/png')`** — não uma
screenshot da página composta. Screenshot de página inclui `h1`/nav/véus por
cima (mesmo retângulo absoluto); isso foi verificado diretamente: um
`canvas.screenshot()` do Playwright (que captura a página composta recortada
no retângulo do elemento, não um render isolado do canvas) trouxe o texto
"Iniciativa Sephir" e a barra de navegação **dentro** da imagem — inaceitável
para um pôster que vai ficar atrás do `<h1>` real. `toDataURL()` lê só o
backing store do canvas, sem nenhum overlay de DOM.

## 3. Validação de desvio-padrão

```bash
$ magick identify -format '%[fx:standard_deviation]\n' /tmp/heroi-bruto.png
0.141777
```

Bem acima do `0.01` exigido — a cena pintou (buraco negro com disco em âmbar
sobre campo de estrelas, mesmo assunto do canvas ao vivo).

## 4. Descartado antes: Chromium headless puro

Testado e descartado por medição direta, não por suposição:

```js
// navegador lançado com headless:true (padrão)
{ hasGpu: true, adapterInfo: "null-adapter", prm: false }
```

`navigator.gpu` existe (Chromium 152 expõe a API mesmo headless), mas
`requestAdapter()` devolve `null` — sem GPU real por trás. Isso bate com o
que a Tarefa 21 já tinha registrado ("mesmo quando o Chromium headless não
sustenta o `navigator.gpu`"). É por isso que a captura precisa do
`headless: false` contra o `DISPLAY` real, não do Chromium headless que o
`medirHeroiPorNavegador` usa (aquela função mede *rede*, não pixel — não
precisa de adapter real).

## 5. Conversão: `magick`, não `cwebp`

`cwebp` não existe nesta máquina. `magick` (ImageMagick, com libwebp
embutido) faz o mesmo trabalho.

### 5.1 — Achado: `-alpha off` quebra a cor no Chromium, e também infla o arquivo

A primeira tentativa de conversão usou `-alpha off` (para descartar o canal
alfa do canvas, que é 100% opaco — o herói é opaco sobre `--cor-void`, sem
uso para alfa, mesmo raciocínio da Tarefa 15 com o logo). Isso **piorou os
dois números**, não só um:

```bash
# COM -alpha off (descartado)
$ magick /tmp/heroi-bruto.png -alpha off -resize 1280x -quality 70 /tmp/a.webp
$ stat -c%s /tmp/a.webp
39100

# SEM -alpha off, mesma qualidade e resize (usado)
$ magick /tmp/heroi-bruto.png -resize 1280x -quality 70 /tmp/b.webp
$ stat -c%s /tmp/b.webp
33222
```

Manter o alfa saiu **menor**, não maior — o oposto do que a Tarefa 15
ensinou sobre canal alfa. Mas o achado mais sério não é o tamanho, é a cor:
qualquer arquivo gerado com `-alpha off` — não importa a qualidade —
renderizava **em cinza puro** no Chromium desta máquina quando aberto direto
(`file://` ou `http://`), apesar de a leitura de pixel por
ImageMagick/Pillow confirmar que o arquivo *tinha* cor real gravada:

```bash
$ python3 -c "
from PIL import Image
im = Image.open('/tmp/a.webp').convert('RGB')
# ... amostra de pixels ...
print(maxdiff)"
84   # com -alpha off, no arquivo lido por Pillow: tem cor
# mas o MESMO arquivo, screenshotado depois de aberto no Chromium desta
# máquina: maxdiff 0 — cinza puro
```

Removido `-alpha off` da conversão final. Não investiguei a causa exata
dentro do bitstream VP8 (não é o escopo desta tarefa mexer em decoder de
navegador) — só que é reprodutível, específico a este arquivo com este flag,
e que removê-lo resolve os dois problemas ao mesmo tempo.

### 5.2 — Achado: servidor sem `Content-Length` também produz cinza nesta máquina

Depois de tirar `-alpha off`, um teste onde o pôster era servido pelo
`tests/support/servidor-estatico.mjs` (que grava a resposta via
`createReadStream(...).pipe(res)` sem setar `Content-Length`, portanto
`Transfer-Encoding: chunked`) **ainda saía cinza** quando embutido via
`<img>` na página real — mas o mesmo arquivo, servido por um servidor que
declara `Content-Length` (`python3 -m http.server`, o que o Cloudflare Pages
também faz para todo asset estático), saía **em cor**:

```bash
$ curl -sI http://localhost:4173/poster/heroi.webp   # servidor de teste
HTTP/1.1 200 OK
content-type: image/webp
# sem Content-Length — chunked

$ curl -sI http://localhost:8901/poster/heroi.webp   # python -m http.server
HTTP/1.0 200 OK
Content-type: image/webp
Content-Length: 35606
```

Isolado por eliminação: uma imagem sintética simples (gradiente de duas
cores) **não** disparava o bug em nenhum dos dois casos; só a imagem real do
buraco negro (grande, ruidosa, alta entropia) o fazia, e só quando entregue
em chunks. **Isto não é um problema no arquivo entregue nem na produção**: o
Cloudflare Pages serve todo asset estático com `Content-Length` declarado,
igual ao `python -m http.server` usado para verificar. O que reproduz o
cinza é a combinação específica "`tests/support/servidor-estatico.mjs`
(ferramenta de QA, sem `Content-Length`) + este build exato do Chromium
(`152.0.7977.82`) decodificando um WebP grande/ruidoso em chunks". Não
alterei `servidor-estatico.mjs` — é infraestrutura compartilhada com toda a
suíte (`peso-heroi.test.ts`, os 37 E2E), fora do escopo desta tarefa, e o
bug não afeta a entrega real. Para a verificação visual (seção 6), servi
`out/` com `python3 -m http.server`, que declara `Content-Length` como
qualquer host de produção.

### 5.3 — Varredura de qualidade, sem `-alpha off`, largura 1280 (a mesma do pôster antigo)

O coordenador decidiu manter a largura em 1280px — a mesma do pôster
anterior — porque o pôster é o elemento de LCP, e LCP é um dos quatro
números que a Tarefa 23 compara contra o baseline do `main`; usar uma imagem
maior infla exatamente esse número, mesmo cabendo no teto de 60 kB. A spec
§5 pede peso "na ordem do atual (35 372 B)".

```
$ for q in 90 85 80 75 70 65 60; do
  magick /tmp/heroi-bruto.png -resize 1280x -quality $q /tmp/heroi-noalpha-1280-q$q.webp
done
q=90: 79368 bytes
q=85: 58022 bytes
q=80: 44192 bytes
q=75: 35804 bytes   ← escolhido (essencialmente empatado com os 35 372 B do pôster antigo)
q=70: 33222 bytes
q=65: 31028 bytes
q=60: 28940 bytes
```

Escolhido **q75** (a variante final, recapturada, fechou em **35 606 B** —
ver seção 7): fica dentro de ~1% do peso do pôster anterior, portanto não
infla o LCP medido na Tarefa 23, com qualidade visual boa sob os dois véus
(ver captura na seção 6). Comando final de conversão:

```bash
magick /tmp/heroi-bruto.png -resize 1280x -quality 75 public/poster/heroi.webp
```

## 6. Verificação visual — contraste do `<h1>` sobre o pôster novo

`npm run build`, depois `python3 -m http.server 8901` dentro de `out/`
(escolhido só para esta verificação, por declarar `Content-Length` como um
host real — ver 5.2). Contexto do Playwright com `reducedMotion: 'reduce'`
para o `<canvas>` nunca montar (`Canvas.tsx` decide isso de forma síncrona
na montagem) — garante que o que aparece na tela é **só o pôster**, o mesmo
caminho que quem não tem WebGPU vê.

Para medir contraste sem misturar pixel de glifo com pixel de fundo, o
`<h1>` foi escondido (`style.visibility = 'hidden'`, preserva o layout e o
`getBoundingClientRect()`) antes do screenshot — mesmo cuidado de "separar o
que está atrás do texto" que a Tarefa 19 tomou com o canvas.

```js
// script de verificação (não comitado — ad hoc, reproduzível por este trecho)
const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
const page = await context.newPage();
await page.goto('http://localhost:8901/pt/', { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready).catch(() => {});
await page.waitForTimeout(500);
const h1Box = await page.locator('h1').boundingBox();
await page.evaluate(() => { document.querySelector('h1').style.visibility = 'hidden'; });
await page.screenshot({ path: saidaPng });
```

Saída real (`canvasCount: 0` nos dois viewports — confirma que o `<canvas>`
nunca montou, e o que foi medido é o pôster puro):

```
desktop (1440×900): h1Box { x: 115.19, y: 320.03, width: 700, height: 73.44 }
móvel   (390×844):  h1Box { x: 31.19,  y: 235.22, width: 312.63, height: 44.88 }
```

Contraste WCAG (luminância relativa) calculado para cada pixel do retângulo
do `<h1>`, contra o texto `--cor-stardust` (`rgb(244,239,230)`) — reportando
o pior (menor) valor encontrado:

```
desktop: pior contraste 9.05:1 em (813,391) fundo rgb(75, 62, 45)
móvel:   pior contraste 7.35:1 em (339,265) fundo rgb(94, 73, 60)
```

Os dois folgadamente acima do mínimo AA para texto grande (3:1) — acima até
do mínimo de texto normal (4.5:1). Diferente da Tarefa 19 (canvas animado,
amostragem em vários instantes porque o brilho varia com o tempo), o pôster
é **estático**: uma medição é a medição, sem variação temporal a amostrar.

## 7. Reprodutibilidade — recaptura antes de instalar

Antes de instalar definitivamente, a captura foi repetida do zero
(`ferramentas/capturar-poster.mjs`, o script comitado) para confirmar que o
processo é reproduzível, não um acidente de uma execução:

```
$ DISPLAY=:0 node ferramentas/capturar-poster.mjs
canvas pintando (--visivel): true
canvas backing store: 1905 x 1080
canvas puro salvo em /tmp/heroi-bruto.png

$ magick identify -format '%[fx:standard_deviation]\n' /tmp/heroi-bruto.png
0.141777

$ magick /tmp/heroi-bruto.png -resize 1280x -quality 75 /tmp/heroi-final.webp
$ ls -l /tmp/heroi-final.webp
-rw-r--r-- 1 alzahir alzahir 35606 ... /tmp/heroi-final.webp
$ magick identify /tmp/heroi-final.webp
/tmp/heroi-final.webp WEBP 1280x726 1280x726+0+0 8-bit sRGB 35606B
```

Esta é a versão instalada em `public/poster/heroi.webp` — **35 606 B**,
1280×726, dentro do teto de 60 kB (61 440 B) e a ~0,7% do peso do pôster
anterior (35 372 B).
