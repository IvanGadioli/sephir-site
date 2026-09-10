import { describe, it, expect } from 'vitest';
import { execFileSync, execFileSync as run } from 'node:child_process';
import { renameSync } from 'node:fs';

const verificar = (env = {}) => {
  try {
    const saida = run('node', ['ferramentas/verificar.mjs'],
      { env: { ...process.env, ...env }, encoding: 'utf8' });
    return { codigo: 0, saida };
  } catch (e: any) { return { codigo: e.status, saida: (e.stdout ?? '') + (e.stderr ?? '') }; }
};

describe('o contrato de comando de verificar', () => {
  it('sai 0 com out/ pronta e tudo passando', () => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
    expect(verificar().codigo).toBe(0);
  });
  it('sai 2 com out/ ausente, e diz o que fazer', () => {
    renameSync('out', 'out-guardada');
    try {
      const r = verificar();
      expect(r.codigo).toBe(2);
      expect(r.saida).toContain('out/ ausente: rode npm run build');
    } finally { renameSync('out-guardada', 'out'); }
  });
  it('sai 3 sem CHROME_PATH, e chama isso de ambiente', () => {
    const r = verificar({ CHROME_PATH: '/nao/existe' });
    expect(r.codigo).toBe(3);
    expect(r.saida).toContain('ambiente: CHROME_PATH ausente');
  });
  it('não builda por conta própria', () => {
    renameSync('out', 'out-guardada');
    try { expect(verificar().saida).not.toContain('Creating an optimized production build'); }
    finally { renameSync('out-guardada', 'out'); }
  });
  it('imprime o bloco do que não mediu, com os onze itens', () => {
    const r = verificar();
    expect(r.saida).toContain('NÃO MEDIDO NESTA RODADA');
    for (const t of ['B, metade pública', 'W6', 'W7', 'W10',
                     'I, segunda metade', 'C, alvo do meta refresh']) {
      expect(r.saida).toContain(t);
    }
  });
  it('imprime /pt/sobre/ como rota pendente, com o arquivo que a declarará', () => {
    const r = verificar();
    expect(r.saida).toContain('/pt/sobre/');
    expect(r.saida).toContain('sobre/page.tsx');
  });
});
