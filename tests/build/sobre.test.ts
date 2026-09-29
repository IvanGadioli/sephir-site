import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

let html = '';

describe('a página Sobre', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
    html = readFileSync('out/pt/sobre/index.html', 'utf8');
  }, 300_000);

  it('tem "Sobre" como h1', () => {
    expect(html).toMatch(/<h1[^>]*>Sobre<\/h1>/);
  });

  it('usa a faixa alta, com o pôster ao fundo', () => {
    expect(html).toContain('faixa--alta');
    expect(html).toMatch(/<img[^>]*src="\/poster\/heroi\.webp"/);
  });

  it('marca "sobre" como o item ativo do menu', () => {
    expect(html).toMatch(/aria-current="page"[^>]*>sobre</);
  });

  it('tem as cinco seções numeradas', () => {
    for (const rotulo of ['quem', 'contexto', 'ferramentas', 'o projeto', 'contato']) {
      expect(html).toContain(` — ${rotulo}`);
    }
  });

  it('nomeia os dois grupos de pesquisa', () => {
    expect(html).toContain('AstroIDP');
    expect(html).toContain('IEEE Student Branch');
  });

  it('diz que não há formulário, e por quê', () => {
    expect(html).toContain('Sem formulário');
    expect(html).toContain('não há servidor por trás deste site');
  });

  it('expõe e-mail e GitHub como links de verdade', () => {
    expect(html).toContain('href="mailto:ivanilson.gadioli2@gmail.com"');
    expect(html).toContain('href="https://github.com/IvanGadioli"');
  });
});
