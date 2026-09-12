---
name: marca-sephir
description: Use sempre que houver trabalho de cor, tipografia, layout, espaçamento, borda/raio ou texto de interface no site do Iniciativa Sephir — escrever ou revisar CSS/tokens, criar ou editar um componente, escolher uma cor de fundo/texto/acento, definir fonte de título/corpo/label, ou escrever qualquer copy de UI que mencione o nome do estúdio, do jogo ou da fase. Dispara antes de qualquer hex, nome de fonte ou nome de marca ser digitado num componente.
---

# marca-sephir

A marca do Iniciativa Sephir como restrição **aplicada** no estágio Design —
não um ponteiro de catálogo que alguém precisa lembrar de ler. Foi o não ter
isto que produziu, em 2026-09-03, um site com um fundo quase-preto inventado,
um acento azul claro inventado, e fonte de sistema — nenhum dos três presente
em `theme.ts` — oito horas antes de o redesign oficial existir. Ver
`adr-fab-005`, Fato 2, no vault `sephir-site-workspace`.

## As duas regras que esta skill impõe

1. **`theme.ts` é a fonte; `styles/tokens.css` deste repo é derivado dela.**
   Toda mudança de cor, fonte, escala, espaçamento ou raio entra primeiro em
   `~/Documents/sephir/sephir-brand/00-identidade/tokens/theme.ts` e só depois
   é copiada para `styles/tokens.css`. Nunca o contrário — editar `tokens.css`
   direto é o mesmo erro que criou o Fato 2, só que menor.
2. **Nenhum hex literal em componente.** CSS, TSX ou inline style que escreva
   uma cor como `#RRGGBB` ou `rgba(...)` fora de `styles/tokens.css` é bug.
   Sempre referencie o token (`var(--cor-void)`, `colors.void`, etc.).

Os valores abaixo são copiados literalmente de `theme.ts`, a fonte única de
verdade. Não use a memória do agente, não use resumos — se este arquivo e
`theme.ts` divergirem algum dia, `theme.ts` vence e esta skill está desatualizada.

## As doze cores

Superfícies (fundo → elevação):

| Token | Hex | Papel |
|---|---|---|
| `void` | `#05070E` | preto-azulado do espaço profundo — fundo da página |
| `void2` | `#0C1220` | elevação: cards, seções alternadas |
| `void3` | `#141C30` | elevação 2: inputs, bordas ativas |

Acentos (nebulosa):

| Token | Hex | Papel |
|---|---|---|
| `amber` | `#E8963A` | acento primário — CTAs, destaques, wordmark accent |
| `amberDim` | `#C77A28` | amber hover/pressed |
| `teal` | `#3FB89E` | acento secundário — links, badges, dados de validação |
| `tealDim` | `#329680` | teal hover |

Texto:

| Token | Hex | Papel |
|---|---|---|
| `stardust` | `#F4EFE6` | texto principal (branco-quente estelar) |
| `muted` | `#8A93A8` | texto secundário (cinza-azulado) |
| `faint` | `#4A5468` | texto terciário, captions, placeholders |

Utilitário:

| Token | Valor | Papel |
|---|---|---|
| `border` | `rgba(244, 239, 230, 0.10)` | hairline sobre fundo escuro |
| `borderStrong` | `rgba(244, 239, 230, 0.18)` | hairline mais forte |

São doze tokens de cor, não nove — se algum outro documento deste projeto disser
"os nove tokens", esse documento está errado; esta skill e `theme.ts` são a
contagem certa.

## As três famílias de fonte

| Token | Valor | Uso |
|---|---|---|
| `display` | `'Space Grotesk', system-ui, sans-serif` | títulos, wordmark |
| `body` | `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | corpo, UI |
| `mono` | `'Space Mono', ui-monospace, monospace` | labels técnicos, TRL, dados |

**O corpo do texto é a pilha de sistema, não Space Grotesk** — decisão do
titular em `adr-fab-008` (2026-09-12), aceitando o que o mock aprovado sempre
declarou. `Inter` **saiu da marca**; se você a tem na memória de uma versão
anterior desta skill, a memória está velha. Space Grotesk é só para título e
wordmark (`display`); quem escreve `font-family: 'Space Grotesk'` num parágrafo
de corpo errou o token, e quem escreve `Inter` em qualquer lugar usa um valor
que não existe mais.

**Só duas famílias são baixadas:** Space Grotesk (pesos 300, 400, 500) e Space
Mono. O corpo renderiza sem baixar byte de fonte — é isso que deixa o orçamento
de peso de pé para o pôster do herói.

## Escala tipográfica (`type`)

| Nome | Tamanho | Peso | Altura de linha | Tracking |
|---|---|---|---|---|
| `hero` | `clamp(2.5rem, 7vw, 4.5rem)` | 500 | 1.05 | `-0.02em` |
| `h1` | `clamp(2rem, 4vw, 3rem)` | 500 | 1.1 | `-0.01em` |
| `h2` | `clamp(1.5rem, 3vw, 2rem)` | 500 | 1.2 | `0` |
| `body` | `1.0625rem` | 400 | 1.7 | `0` |
| `small` | `0.875rem` | 400 | 1.6 | `0` |
| `label` | `0.75rem` | 400 | 1.4 | `0.18em` (uppercase mono) |

## Espaçamento (`space`)

`xs: 0.5rem` · `sm: 0.75rem` · `md: 1rem` · `lg: 1.5rem` · `xl: 2.5rem` ·
`xxl: 4rem` · `section: 6rem`

## Raio (`radius`)

`sm: 8px` · `md: 12px` · `lg: 16px` · `pill: 999px`

## Nomenclatura travada em 30/07/2026 — NÃO inverter

Travada pelo titular. Reproduzida aqui porque é a parte da marca mais fácil de
inverter por engano num texto de UI:

- **`studio`** = **Sephir Studio** — a empresa. O CNPJ, quem assina e ganha
  edital. Não é o nome que aparece no hero.
- **`product`** = **Iniciativa Sephir** — o jogo. É o herói do fold. Se o hero
  da landing não estampa este nome, o hero está errado.
- **`phase`** = **Semente Cósmica** — codinome da fase de desenvolvimento até
  a 1.0. **Não é nome de produto. Só aparece como selo discreto
  (`phaseBadge`: "fase Semente Cósmica · rumo à 1.0"), nunca como título.**
  Um `<h1>` ou título de página com o nome da fase inverteu a hierarquia.

Lockup completo: `Sephir Studio — Iniciativa Sephir`.
Tagline: `Simulação física do cosmos, jogável.`

Fonte: `~/Documents/sephir/sephir-brand/00-identidade/tokens/theme.ts`,
comentário do bloco `brand`, e `sephir-vault/30-knowledge/identidade-visual.md`.

## Ao editar `styles/tokens.css`

Antes de tocar `styles/tokens.css`, confirme que o valor já existe (ou foi
mudado primeiro) em `theme.ts`. Se `tokens.css` tiver um valor que não está em
`theme.ts`, o `tokens.css` é que está errado — não adicione uma exceção, corrija
a origem.
