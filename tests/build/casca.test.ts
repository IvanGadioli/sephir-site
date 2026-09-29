import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

describe('a casca de /', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
  }, 300_000);

  it('gera out/index.html', () => {
    const html = readFileSync('out/index.html', 'utf8');
    expect(html).toContain('<html lang="pt-BR"');
  });

  it('encaminha para /pt/ por meta refresh', () => {
    const html = readFileSync('out/index.html', 'utf8');
    expect(html).toMatch(/http-equiv="refresh"[^>]*content="0; url=\/pt\/"/);
  });

  it('oferece um link visível para o mesmo destino', () => {
    const html = readFileSync('out/index.html', 'utf8');
    expect(html).toContain('href="/pt/"');
  });
});
