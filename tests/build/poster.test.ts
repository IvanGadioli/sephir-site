import { statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('o pôster do herói', () => {
  it('existe', () => {
    expect(() => statSync('public/poster/heroi.webp')).not.toThrow();
  });

  it('cabe no orçamento do LCP: até 60 kB', () => {
    // O pôster atual tem 35 372 B. O gerado pode crescer — um buraco negro com
    // disco tem mais detalhe que uma nebulosa difusa, então pode crescer — mas
    // não sem limite: ele é o elemento de LCP e entra no caminho crítico.
    expect(statSync('public/poster/heroi.webp').size).toBeLessThan(61_440);
  });
});
