import { statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('o logo derivado', () => {
  it('existe em public/marca/logo.webp', () => {
    expect(() => statSync('public/marca/logo.webp')).not.toThrow();
  });

  it('cabe no orçamento de 30 kB', () => {
    const bytes = statSync('public/marca/logo.webp').size;
    expect(bytes).toBeLessThan(30_720);
  });

  it('é muito menor que o PNG de origem, que tem 891 719 B', () => {
    const bytes = statSync('public/marca/logo.webp').size;
    expect(bytes).toBeLessThan(891_719 / 10);
  });
});
