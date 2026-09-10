// O bloco do que `verificar` não mediu nesta rodada, e por quê — texto
// literal de 04_plano.md, Tarefa 11. Sai sempre, em todo código de saída
// (inclusive 0): comando que nasce parcial e cala sobre o que não mediu vira
// verde falso, e esta rodada nasce parcial por construção.

export const NAO_MEDIDOS = [
  {
    item: 'B, metade pública',
    motivo: 'deploy ainda não passou; medida uma vez no portão 07',
  },
  {
    item: 'J, igualdade ao segmento',
    motivo:
      'asserção fora do catálogo (tests/build/arvore.test.ts); ADR de conformidade de idioma antes de /en/ ou /it/',
  },
  { item: 'K, nomenclatura', motivo: 'W10 informativo + leitura humana, datada no 07' },
  { item: 'I, segunda metade', motivo: 'document.fonts.check() desligado: zero fonte web' },
  {
    item: 'H, token não usado',
    motivo: 'W9 varre o DOM; token que nada pinta não é medível',
  },
  { item: 'C, alvo do meta refresh', motivo: 'o limiar de W2 diz href; estender é ADR' },
  {
    item: 'equivalência origem local ↔ Pages',
    motivo: 'conferida no portão 07, contra a origem viva',
  },
  { item: 'W6', motivo: 'degradação sem WebGPU — 03_render inalterado nesta rodada' },
  { item: 'W7', motivo: 'citação em post de devlog — 04_devlog não existe' },
  { item: 'W10', motivo: 'comparação de pixel — vive em verificar:visual, sai 0 sempre' },
  {
    item: 'incomplete de color-contrast',
    motivo: 'impressos acima; conferência humana no portão 07',
  },
];

export const ROTA_PENDENTE = {
  rota: '/pt/sobre/',
  arquivoQueADeclarará: 'app/(site)/[lang]/sobre/page.tsx',
};

export function imprimirNaoMedidos() {
  console.log('NÃO MEDIDO NESTA RODADA');
  for (const { item, motivo } of NAO_MEDIDOS) {
    console.log(`  ${item}  ${motivo}`);
  }
  console.log('ROTA PENDENTE');
  console.log(`  ${ROTA_PENDENTE.rota}  será declarada em ${ROTA_PENDENTE.arquivoQueADeclarará}`);
}
