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

Tabela copiada literalmente do brief (spec §3). Não remedida nesta tarefa —
ver "Auto-revisão" abaixo para o spot-check que fiz sobre ela.

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

1. **Spot-check da tabela de peso brotli (copiada do brief).** Recalculei
   com `brotli -c -q 11` os quatro documentos HTML e o CSS único do build:
   `pt/index.html` → 3 325 B, `pt/sobre/index.html` → 2 894 B, `404.html`
   → 1 256 B, `index.html` (casca) → 1 000 B, CSS → 1 493 B. Todos batem
   exatamente com a tabela do brief. **A coluna JS (145 877 B) eu não
   consegui reproduzir de forma independente**: somando o brotli de todos
   os 6 chunks `.js` referenciados em `pt/index.html` deu 148 945 B; excluindo
   o chunk `noModule` (que browsers modernos não baixam — confirmado pelo
   `network-requests` audit do Lighthouse, que mostra só 4 scripts JS
   efetivamente transferidos) deu 113 787 B; somando todo `.js` emitido no
   build (incluindo os 3 manifests do Next) deu 149 245 B. Nenhuma dessas
   três tentativas bate com 145 877 B. Não sei que método exato produziu o
   número original da spec §3 — provavelmente outra combinação de arquivos
   ou outra ferramenta de brotli. **Não alterei a tabela**: o brief é
   explícito que os valores são normativos e usados literalmente, e a
   tarefa desta rodada é LCP/CLS, não reauditar o peso. Documento e CSS
   bateram exato, o que dá alguma confiança na origem da tabela; a coluna
   JS fica como item não totalmente reconciliado, registrado aqui para
   quem for usá-la depois.
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

- **Discrepância não resolvida na coluna JS da tabela de peso brotli**
  (item 1 da auto-revisão acima). Os valores de documento e CSS bateram
  exatos; o de JS não. Uso o valor do brief de qualquer forma, por ser
  normativo, mas registro a discrepância para quem for investigar depois.
- Só medi `/pt/` com Lighthouse (é a única rota que a spec §8 usa como
  limiar de LCP/CLS, e é a única que o brief pede no comando do passo 3).
  Não medi `/pt/sobre/`, `404.html` nem a casca `/` — não foi pedido, mas
  registro para o caso de a Tarefa 23 precisar comparar outra rota além de
  `/pt/`.
