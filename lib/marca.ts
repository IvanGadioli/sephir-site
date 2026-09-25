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
