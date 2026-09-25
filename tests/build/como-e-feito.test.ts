import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

let html = '';

describe('a página Como é feito', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
    html = readFileSync('out/pt/como-e-feito/index.html', 'utf8');
  }, 300_000);

  it('tem "Como é feito" como h1', () => {
    expect(html).toMatch(/<h1[^>]*>Como é feito<\/h1>/);
  });

  it('usa a faixa baixa, sem imagem, com a régua âmbar', () => {
    expect(html).toContain('faixa--baixa');
    expect(html).toContain('faixa__regua');
    expect(html).not.toContain('faixa__fundo');
  });

  it('marca "como é feito" como item ativo', () => {
    expect(html).toMatch(/aria-current="page"[^>]*>como é feito</);
  });

  it('lista os oito portões, do 00 ao 07', () => {
    // Ancorado em `class="`, não no nome da classe solto. O Next 16 serializa
    // `className` uma segunda vez no payload RSC de hidratação, no fim do
    // documento, então uma regex crua conta o dobro — 16 em vez de 8. Isto foi
    // medido na Tarefa 10, onde a versão crua deste mesmo teste reprovava.
    const linhas = html.match(/class="[^"]*linha--portao[^"]*"/g) ?? [];
    expect(linhas).toHaveLength(8);
    for (const nome of ['escopo', 'contexto', 'spec', 'oráculo', 'testes', 'diff', 'relatório', 'encerramento']) {
      expect(html).toContain(nome);
    }
  });

  it('traz a regra dura do 04 antes do 05', () => {
    expect(html).toContain('04 antes de 05');
    expect(html).toContain('o teste é escrito antes do código, sempre');
  });

  it('explica por que o oráculo é numérico', () => {
    expect(html).toContain('não dependa de olhar a tela depois');
  });
});
