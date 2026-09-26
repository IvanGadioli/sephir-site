import { execFileSync } from 'node:child_process';
import { beforeAll, describe, expect, it } from 'vitest';
import { HTML_ESPERADOS } from '../../lib/rotas.ts';
import { listarHtml } from '../support/arvore.mjs';

describe('a árvore do export', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
  }, 300_000);

  it('é exatamente os cinco HTML da spec, nem mais nem menos', () => {
    expect(listarHtml('out')).toEqual([...HTML_ESPERADOS]);
  });

  it('não vaza rota de devlog, que está fora do escopo desta rodada', () => {
    const todos = listarHtml('out').join('\n');
    expect(todos).not.toContain('devlog');
  });
});
