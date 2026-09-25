import { writeFileSync } from 'node:fs';
import { colors, fonts } from '../lib/marca.ts';

const kebab = (nome) => nome.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

export function gerarTokens() {
  const linhasCor = Object.entries(colors).map(([k, v]) => `  --cor-${kebab(k)}: ${v};`);
  const linhasFonte = Object.entries(fonts).map(([k, v]) => `  --fonte-${kebab(k)}: ${v};`);
  return [
    '/* GERADO por ferramentas/gerar-tokens.mjs a partir de lib/marca.ts.',
    ' * Não editar à mão: tests/unit/tokens.test.ts reprova qualquer divergência.',
    ' */',
    ':root {',
    ...linhasCor,
    '',
    ...linhasFonte,
    '}',
    '',
  ].join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(new URL('../estilos/tokens.css', import.meta.url), gerarTokens());
}
