import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { HTML_ESPERADOS } from '../../lib/rotas.ts';

function listarHtml(raiz: string): string[] {
  const achados: string[] = [];
  for (const entrada of readdirSync(raiz)) {
    const caminho = join(raiz, entrada);
    if (statSync(caminho).isDirectory()) {
      achados.push(...listarHtml(caminho));
    } else if (entrada.endsWith('.html')) {
      achados.push(relative('out', caminho));
    }
  }
  return achados.sort();
}

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
