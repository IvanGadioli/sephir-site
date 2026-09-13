import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const tokens = () => readFileSync('styles/tokens.css', 'utf8');

describe('a paleta é cópia literal de theme.ts', () => {
  const doze = ['#05070E','#0C1220','#141C30','#E8963A','#C77A28','#3FB89E',
                '#329680','#F4EFE6','#8A93A8','#4A5468',
                'rgba(244, 239, 230, 0.10)','rgba(244, 239, 230, 0.18)'];
  it('os doze valores estão lá', () => {
    const t = tokens().toLowerCase();
    for (const v of doze) expect(t).toContain(v.toLowerCase());
  });
  it('as três pilhas estão lá, entrada por entrada', () => {
    const t = tokens();
    expect(t).toContain(`'Space Grotesk', system-ui, sans-serif`);
    expect(t).toContain(`system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`);
    expect(t).toContain(`'Space Mono', ui-monospace, monospace`);
  });
  it('não sobrou a pilha herdada da rodada 01', () => {
    expect(tokens()).not.toContain('-apple-system');
  });
});

describe('H, lint de higiene — nenhuma cor fora de tokens.css', () => {
  // não é o oráculo de H (esse é W9, sobre o DOM computado). É convenção.
  it('nenhum hex nem rgba( em app/, components/ ou styles/base.css', () => {
    const alvos = [...globSync('app/**/*.tsx'), ...globSync('components/**/*.tsx'),
                   'styles/base.css'];
    for (const f of alvos) {
      const s = readFileSync(f, 'utf8');
      expect(s, f).not.toMatch(/#[0-9a-fA-F]{6}\b/);
      expect(s, f).not.toContain('rgba(');
    }
  });
});

describe('zero arquivo de fonte web nesta rodada', () => {
  it('nenhum .woff2 no repo', () =>
    expect(
      ['app', 'lib', 'components', 'styles', 'public', 'out']
        .flatMap((d) => globSync(`${d}/**/*.woff2`)),
    ).toEqual([]));
  it('nenhum @font-face', () =>
    expect(tokens() + readFileSync('styles/base.css', 'utf8')).not.toContain('@font-face'));
});
