import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('o logo derivado', () => {
  it('existe em public/marca/logo.webp', () => {
    expect(() => statSync('public/marca/logo.webp')).not.toThrow();
  });

  it('cabe no orçamento de 30 kB', () => {
    // Teto de 30 720 bytes, do brief da Tarefa 15. Garante que o arquivo cabe
    // no orçamento de banda e cache de primeira visita.
    const bytes = statSync('public/marca/logo.webp').size;
    expect(bytes).toBeLessThan(30_720);
  });

  it('é muito menor que o PNG de origem, que tem 891 719 B', () => {
    // O PNG original de 891 719 bytes (1672×941) reduz a ~1/10 depois de
    // derivado. Asserção simplista mas útil para detectar regressão gritante.
    const bytes = statSync('public/marca/logo.webp').size;
    expect(bytes).toBeLessThan(891_719 / 10);
  });

  it('tem 520px de largura, que serve o rodapé a 150 e o 404 a 260 em telas 2×', () => {
    const saida = execFileSync('magick', [
      'public/marca/logo.webp', '-format', '%wx%h', 'info:',
    ]).toString().trim();
    expect(saida).toBe('520x293');
  });

  it('é opaco: sem canal alfa, com #05070E assado', () => {
    // Não é otimização, é contrato. O halo da marca se dissolve no preto, e o
    // alfa custava ~25 dos 33 kB. Se alguém reintroduzir alfa, o arquivo volta
    // a manchar sobre fundo claro — e o teto de bytes sozinho não pega isso.
    const alfa = execFileSync('magick', [
      'public/marca/logo.webp', '-format', '%A', 'info:',
    ]).toString().trim();
    expect(alfa).toBe('Undefined');
  });
});
