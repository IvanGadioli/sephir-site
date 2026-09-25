# Linha de base — `main` em `ed68bd4`

Medido em 2026-09-24, antes de qualquer código da branch `zero/redesign`.
Instrumento: `@lhci/cli` 0.15, perfil móvel, mediana de 5 execuções, sobre
`baseline-main-ed68bd4/` servido estático.

## Peso brotli, por rota

| rota | documento | CSS | JS | total |
|---|---|---|---|---|
| `/pt/` | 3 325 B | 1 493 B | 148 945 B | 153 763 B |
| `/pt/sobre/` | 2 894 B | 1 493 B | 148 945 B | 153 332 B |
| `404.html` | 1 256 B | 1 493 B | 148 945 B | 151 694 B |
| `/` (casca) | 1 000 B | 1 493 B | 148 945 B | 151 438 B |

Coluna JS corrigida para **148 945 B** (era 145 877 B na primeira redação
da spec §3 e do brief). Os totais nunca mudaram — batiam com 148 945 B
desde o início, não com 145 877 B; o erro estava só na repartição por
coluna. Ver "Achados da auto-revisão" abaixo para como isso foi encontrado
e confirmado.

## Núcleos vitais

| métrica | mediana de 5 | vira limiar de |
|---|---|---|
| LCP | **1 920,52 ms** | "não pior que isto" |
| CLS | **0** | "≤ 0,02 **e** não pior que isto" |
| transferido | **212,21 KiB (217 303 B)** | contexto |

## Nota

Estes números são o denominador do experimento. Não voltar aqui para ajustá-los
depois de medir a branch nova — se algo estiver errado nesta medição, o conserto
é refazer as duas, não retocar uma.

---

## O que foi medido, e com qual comando exato

**Passo 1 — confirmar linha de base intacta:**

```bash
cd ~/Documents/sephir-site
ls baseline-main-ed68bd4/pt/index.html baseline-main-ed68bd4/404.html
```

Saída:
```
baseline-main-ed68bd4/404.html
baseline-main-ed68bd4/pt/index.html
```
Os dois existem. Não foi preciso reconstruir.

**Passo 2 — servir a linha de base:**

```bash
npx -y serve baseline-main-ed68bd4 -l 4174
```

Confirmado no ar por `curl`: `/pt/` respondeu `200`.

**Passo 3 — medir LCP e CLS, 5 execuções:**

```bash
CHROME_PATH=/usr/bin/chromium npx -y @lhci/cli@0.15 collect \
  --url=http://localhost:4174/pt/ \
  --numberOfRuns=5 \
  --settings.formFactor=mobile \
  --settings.preset=perf
```

Saída bruta:
```
npm notice run npx
npm notice run 'lhci' collect --url=http://localhost:4174/pt/ --numberOfRuns=5 --settings.formFactor=mobile --settings.preset=perf
Running Lighthouse 5 time(s) on http://localhost:4174/pt/
Run #1...done.
Run #2...done.
Run #3...done.
Run #4...done.
Run #5...done.
Done running Lighthouse!
```

```bash
CHROME_PATH=/usr/bin/chromium npx -y @lhci/cli@0.15 assert --preset=lighthouse:no-pwa || true
```

Saída bruta (ANSI removido para legibilidade; os únicos achados relevantes
para esta tarefa são os que citam LCP/CLS/byte-weight — o resto é ruído
esperado: o preset `perf` do `collect` não roda auditorias de a11y/SEO, então
o preset `lighthouse:no-pwa` do `assert`, que cobra essas categorias, falha
em massa por `auditRan: 0`. Isso é comportamento do próprio comando pedido
pelo brief, não um problema da linha de base):

```
npm notice run npx
npm notice run 'lhci' assert --preset=lighthouse:no-pwa
Checking assertions against 1 URL(s), 5 total run(s)

100 result(s) for http://localhost:4174/pt/ :

  ✘  accesskeys failure for auditRan assertion
        expected: >=1
           found: 0
      all values: 0, 0, 0, 0, 0

  [... 74 auditorias de a11y/SEO/best-practices adicionais, todas
  auditRan: 0 — não rodaram porque o collect usou --settings.preset=perf,
  que restringe a categoria "performance". Log completo abaixo. ...]

  ✘  legacy-javascript-insight failure for minScore assertion
       Legacy JavaScript
       https://web.dev/articles/baseline-and-polyfills

        expected: >=0.9
           found: 0.5
      all values: 0.5, 0.5, 0.5, 0.5, 0.5

  ✘  network-dependency-tree-insight failure for minScore assertion
       Network dependency tree
       https://developer.chrome.com/docs/lighthouse/performance/critical-request-chains

        expected: >=0.9
           found: 0
      all values: 0, 0, 0, 0, 0

  ✘  unused-javascript failure for maxLength assertion
       Reduce unused JavaScript
       https://developer.chrome.com/docs/lighthouse/performance/unused-javascript/

        expected: <=0
           found: 2
      all values: 2, 2, 2, 2, 2

  ✘  uses-responsive-images failure for maxLength assertion
       Properly size images
       https://developer.chrome.com/docs/lighthouse/performance/uses-responsive-images/

        expected: <=0
           found: 1
      all values: 1, 1, 1, 1, 1

  ⚠️  cache-insight warning for maxLength assertion
       Use efficient cache lifetimes
       https://web.dev/uses-long-cache-ttl/

        expected: <=0
           found: 9
      all values: 9, 9, 9, 9, 9

  ⚠️  dom-size-insight warning for minScore assertion
       Optimize DOM size
       https://developer.chrome.com/docs/lighthouse/performance/dom-size/

        expected: >=0.9
           found: 0
      all values: 0, 0, 0, 0, 0

  ⚠️  legacy-javascript warning for maxLength assertion
       Avoid serving legacy JavaScript to modern browsers
       https://web.dev/baseline

        expected: <=0
           found: 1
      all values: 1, 1, 1, 1, 1

  ⚠️  max-potential-fid warning for minScore assertion
       Max Potential First Input Delay
       https://developer.chrome.com/docs/lighthouse/performance/lighthouse-max-potential-fid/

        expected: >=0.9
           found: 0.35
      all values: 0.14, 0.27, 0.35, 0.18, 0

  ⚠️  render-blocking-insight warning for maxLength assertion
       Render blocking requests
       https://web.dev/learn/performance/understanding-the-critical-path#render-blocking_resources

        expected: <=0
           found: 1
      all values: 1, 1, 1, 1, 1

  ⚠️  render-blocking-resources warning for maxLength assertion
       Eliminate render-blocking resources
       https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources/

        expected: <=0
           found: 1
      all values: 1, 1, 1, 1, 1

  ⚠️  uses-long-cache-ttl warning for maxLength assertion
       Serve static assets with an efficient cache policy
       https://developer.chrome.com/docs/lighthouse/performance/uses-long-cache-ttl/

        expected: <=0
           found: 9
      all values: 9, 9, 9, 9, 9

Assertion failed. Exiting with status code 1.
```

(O log completo com as 100 linhas de assertion, sem cortes, está preservado
em `.lighthouseci/assertion-results.json` — não versionado, artefato de
ferramenta, reproduzível pelo comando acima.)

O `assert` não expõe LCP/CLS numéricos diretamente (ele só compara contra o
preset genérico de a11y/perf-score, que não é o que a spec §8 pede). Os
valores de LCP e CLS por execução foram extraídos direto dos relatórios
brutos que o `collect` grava em `.lighthouseci/lhr-*.json`:

```bash
for f in .lighthouseci/lhr-*.json; do
  node -e "
    const d = require('./$f');
    const lcp = d.audits['largest-contentful-paint'];
    const cls = d.audits['cumulative-layout-shift'];
    const bytes = d.audits['total-byte-weight'];
    console.log('$f',
      'LCP_ms=' + lcp.numericValue,
      'CLS=' + cls.numericValue,
      'transferredBytes=' + bytes.numericValue
    );
  "
done
```

Saída bruta:
```
.lighthouseci/lhr-1790294795457.json LCP_ms=1892.018 CLS=0 transferredBytes=217303
.lighthouseci/lhr-1790294822239.json LCP_ms=1883.894 CLS=0 transferredBytes=217303
.lighthouseci/lhr-1790294848763.json LCP_ms=1953.564 CLS=0 transferredBytes=217303
.lighthouseci/lhr-1790294875460.json LCP_ms=1932.469 CLS=0 transferredBytes=217303
.lighthouseci/lhr-1790294903753.json LCP_ms=1920.52 CLS=0 transferredBytes=217303
```

Mediana calculada sobre os 5 valores ordenados:

```
LCP ordenado (ms): [1883.894, 1892.018, 1920.52, 1932.469, 1953.564]
LCP mediana: 1920.52 ms  (valor central, índice 2 de 5)
CLS mediana: 0            (constante nas 5 execuções)
transferido mediana: 217303 B = 212,21 KiB = 217,303 kB (decimal)
```

`total-byte-weight` (217 303 B) bate exatamente com a soma dos
`transferSize` individuais do `network-requests` audit da primeira execução
(documento + poster WebP + CSS + 4 scripts JS realmente buscados + 2 fontes
+ favicon = 217 303 B) — conferido manualmente, ver seção de auto-revisão.

**Encerramento do servidor:**

```bash
pkill -f "serve baseline-main-ed68bd4"
```

Confirmado parado: `curl http://localhost:4174/pt/` voltou a falhar
(conexão recusada) depois do kill.

## O que não foi possível medir, e por quê

Nada ficou sem medir. O Lighthouse rodou normalmente nesta máquina com
`CHROME_PATH=/usr/bin/chromium`, as 5 execuções completaram sem erro, e os
três números pedidos (LCP, CLS, transferido) saíram de dados numéricos
brutos dos relatórios, não de inferência.

## Arquivos criados

- `docs/superpowers/relatorios/2026-09-24-linha-de-base-main.md` (este
  relatório).
- `.lighthouseci/` (assertion-results.json + 5×(lhr-*.json + lhr-*.html)) —
  artefato de ferramenta, não versionado (ver nota abaixo sobre
  `.gitignore`).

## Achados da auto-revisão

1. **Spot-check da tabela de peso brotli achou um erro de aritmética na
   spec §3 — corrigido.** Recalculei com `brotli -c -q 11` os quatro
   documentos HTML e o CSS único do build: `pt/index.html` → 3 325 B,
   `pt/sobre/index.html` → 2 894 B, `404.html` → 1 256 B, `index.html`
   (casca) → 1 000 B, CSS → 1 493 B. Todos bateram exato com a tabela
   original. A coluna JS (145 877 B na primeira redação) eu não consegui
   reproduzir: somando o brotli dos 6 chunks `.js` referenciados em
   `pt/index.html`, deduplicados, deu **148 945 B** — não 145 877 B.
   Reportei a discrepância ao controlador sem alterar a tabela, porque o
   brief marcava os valores como normativos.

   O controlador remediu com o mesmo método (brotli -q 11 por chunk
   referenciado no HTML, deduplicado, somado por extensão) e confirmou:
   **148 945 B é o valor correto.** O erro estava na primeira redação da
   spec §3, ao repartir o total já correto (153 763 B para `/pt/`, por
   exemplo) nas quatro colunas — um chunk ficou de fora da soma da coluna
   JS, então a coluna mostrava 145 877 B enquanto o total já continha os
   148 945 B certos. Prova disso: somando documento + CSS + 145 877 (o
   valor antigo) dá 150 695 B para `/pt/`, que **não bate** com o total
   153 763 B publicado desde sempre; somando com 148 945 B dá exatamente
   153 763 B. Ou seja, os totais sempre estiveram certos — só a coluna JS
   estava errada, e a tarefa 0 achou isso antes de virar denominador do
   experimento.

   A spec §3 e a Tarefa 0 do plano já foram corrigidas pelo controlador
   (commits `cc9dcdd` e o seguinte, fora deste repositório de relatório —
   ver `docs/superpowers/specs/` e `docs/superpowers/plans/` na branch).
   Este relatório usa o valor corrigido, 148 945 B, nas quatro linhas da
   tabela acima.
2. **`total-byte-weight` bate exato com a soma manual de `transferSize`**
   do `network-requests` audit (217 303 B), o que valida o número de
   "transferido" independentemente do audit agregado.
3. **CLS = 0 nas 5 execuções**, sem variância — plausível para uma página
   estática sem imagens sem dimensão declarada e sem fontes que causem
   reflow perceptível; não há motivo para desconfiar do valor.
4. **`.lighthouseci/`** ficou no working tree depois da medição, mas já
   estava listado no `.gitignore` (linha 10, preexistente — não fui eu que
   adicionei). Conferido com `git status` antes do commit: só
   `docs/superpowers/relatorios/` aparece como untracked, o artefato de
   ferramenta não entra no commit. Nenhuma ação necessária aqui.
5. Todo `___` do gabarito do brief foi preenchido com valor medido — nenhum
   ficou como "não medido", porque o Lighthouse rodou sem erro nesta
   máquina.

## Preocupações

- Nenhuma pendente sobre os números deste relatório. A única encontrada
  durante a auto-revisão — a coluna JS da tabela de peso brotli batendo
  145 877 B em vez de 148 945 B — já foi investigada, escalada ao
  controlador e corrigida na spec §3 e no plano (ver item 1 de "Achados da
  auto-revisão" acima). Os valores de LCP, CLS e transferido que esta
  tarefa mediu não foram tocados por essa correção.
- Só medi `/pt/` com Lighthouse (é a única rota que a spec §8 usa como
  limiar de LCP/CLS, e é a única que o brief pede no comando do passo 3).
  Não medi `/pt/sobre/`, `404.html` nem a casca `/` — não foi pedido, mas
  registro para o caso de a Tarefa 23 precisar comparar outra rota além de
  `/pt/`.
