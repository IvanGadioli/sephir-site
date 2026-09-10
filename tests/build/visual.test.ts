// Tarefa 12 do plano: o plano descreve os três casos em prosa, não em
// código. "sai 0 sempre" — a comparação de pixel é referência, não
// critério, e não pode reprovar a rodada.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';

const rodar = (env: Record<string, string> = {}) => {
  try {
    const saida = execFileSync('node', ['ferramentas/visual.mjs'],
      { env: { ...process.env, ...env }, encoding: 'utf8' });
    return { codigo: 0, saida };
  } catch (e: any) {
    return { codigo: e.status, saida: (e.stdout ?? '') + (e.stderr ?? '') };
  }
};

describe('verificar:visual — W10, informativo, nunca bloqueante', () => {
  it('sai 0 com os artboards presentes', () => {
    const r = rodar();
    expect(r.codigo).toBe(0);
  });

  it('sai 0 mesmo com ARTBOARDS apontando para um diretório ausente', () => {
    const r = rodar({ ARTBOARDS: '/nao/existe' });
    expect(r.codigo).toBe(0);
    expect(r.saida).toContain('não medido: artboards ausentes');
  });

  it('fala em referência, nunca em reprovação', () => {
    const r = rodar();
    expect(r.saida.toLowerCase()).toContain('referência');
    expect(r.saida.toLowerCase()).not.toContain('reprovou');
  });
});
