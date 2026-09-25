import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

describe('o perfil móvel', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
  }, 300_000);

  it('declara o viewport, sem o qual o mobile rende em 980px', () => {
    const html = readFileSync('out/pt/index.html', 'utf8');
    expect(html).toMatch(/<meta name="viewport"[^>]*width=device-width/);
  });

  it('não desabilita o zoom do usuário', () => {
    const html = readFileSync('out/pt/index.html', 'utf8');
    expect(html).not.toContain('user-scalable=no');
    expect(html).not.toContain('maximum-scale=1');
  });
});
