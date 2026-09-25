import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

describe('o 404', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
  }, 300_000);

  it('existe em out/404.html, que é o nome que o Cloudflare Pages serve', () => {
    expect(existsSync('out/404.html')).toBe(true);
  });

  it('traz o título do artboard', () => {
    const html = readFileSync('out/404.html', 'utf8');
    expect(html).toMatch(/<h1[^>]*>Esta órbita não existe<\/h1>/);
  });

  it('explica o que aconteceu', () => {
    const html = readFileSync('out/404.html', 'utf8');
    expect(html).toContain('A rota não corresponde a nenhuma página publicada');
  });

  it('oferece a volta para o início', () => {
    const html = readFileSync('out/404.html', 'utf8');
    expect(html).toContain('voltar para o início');
    expect(html).toContain('href="/pt/"');
  });

  it('não deixa o fallback em inglês do Next em nenhuma página', () => {
    for (const alvo of ['out/index.html', 'out/pt/index.html', 'out/404.html']) {
      expect(readFileSync(alvo, 'utf8')).not.toContain('This page could not be found');
    }
  });

  it('não deixa um diretório _not-found sobrando no export', () => {
    expect(existsSync('out/_not-found')).toBe(false);
  });
});
