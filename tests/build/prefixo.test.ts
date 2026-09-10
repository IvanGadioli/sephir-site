import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { medirW8 } from '../../ferramentas/oraculos/w8-prefixo.mjs';

beforeAll(() => {
  execSync('npm run build', { stdio: 'inherit' });
  execSync('npm run build:sentinela', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' }); // out/ volta a ser a árvore boa
}, 600_000);

describe('D — nenhum caminho interno escrito à mão', () => {
  it('as duas contagens são zero', () => {
    const r = medirW8({ raizOut: 'out', raizSentinela: 'out-sentinela' });
    expect(r.violacoes).toEqual([]);
  });
  it('a sentinela realmente prefixou os ativos', () => {
    const r = medirW8({ raizOut: 'out', raizSentinela: 'out-sentinela' });
    expect(r.detalhe.sentinelaPrefixados).toBeGreaterThan(0);
  });
});
