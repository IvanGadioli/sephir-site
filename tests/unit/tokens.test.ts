import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { gerarTokens } from '../../ferramentas/gerar-tokens.mjs';
import { colors } from '../../lib/marca.ts';

describe('tokens.css', () => {
  it('é exatamente o que o gerador emite', () => {
    expect(readFileSync('estilos/tokens.css', 'utf8')).toBe(gerarTokens());
  });

  it('traz uma variável para cada cor da marca', () => {
    const css = readFileSync('estilos/tokens.css', 'utf8');
    for (const valor of Object.values(colors)) {
      expect(css).toContain(valor);
    }
  });

  it('não inventa cor fora da marca', () => {
    const css = readFileSync('estilos/tokens.css', 'utf8');
    const hexes = css.match(/#[0-9A-Fa-f]{6}/g) ?? [];
    const daMarca = new Set(Object.values(colors).map((c) => c.toUpperCase()));
    for (const hex of hexes) {
      expect(daMarca).toContain(hex.toUpperCase());
    }
  });
});
