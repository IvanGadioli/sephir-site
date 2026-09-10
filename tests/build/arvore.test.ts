import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { globSync } from 'node:fs';
import { HTML_ESPERADOS } from '../../lib/rotas';

beforeAll(() => {
  execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
}, 300_000);

const html = () =>
  globSync('**/*.html', { cwd: 'out' }).sort();

describe('A — o conjunto de rotas', () => {
  it('out/ tem exatamente os três html declarados', () => {
    expect(html()).toEqual([...HTML_ESPERADOS]);
  });
  it('os artefatos do exportador foram podados', () => {
    for (const d of ['out/404', 'out/_not-found', 'out/nao-encontrado']) {
      expect(existsSync(d)).toBe(false);
    }
  });
});

describe('J — lang derivado do segmento', () => {
  const lang = (f: string) =>
    readFileSync(`out/${f}`, 'utf8').match(/<html[^>]*\slang="([^"]*)"/)?.[1];
  // fora do catálogo de oráculos: dívida #2 do portão 03, com um idioma só
  it('/pt/ tem lang="pt", igual ao primeiro segmento', () =>
    expect(lang('pt/index.html')).toBe('pt'));
  it('a casca / tem lang="pt"', () => expect(lang('index.html')).toBe('pt'));
  it('o 404 tem lang="pt", não o <html> sem lang do Next', () =>
    expect(lang('404.html')).toBe('pt'));
  it('nenhum documento traz pt-BR', () => {
    for (const f of HTML_ESPERADOS) {
      expect(readFileSync(`out/${f}`, 'utf8')).not.toContain('lang="pt-BR"');
    }
  });
});

describe('o 404 é o nosso, não o do Next', () => {
  it('está em português e aponta para a home', () => {
    const h = readFileSync('out/404.html', 'utf8');
    expect(h).toContain('href="/pt/"');
    expect(h).not.toContain('This page could not be found');
  });
});
