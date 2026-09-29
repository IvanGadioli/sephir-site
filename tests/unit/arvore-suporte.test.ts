import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { extensoes, listar, listarCaminhos, listarHtml } from '../support/arvore.mjs';

// O caminhador comum de `tests/support/arvore.mjs` substituiu três cópias (I7),
// e o que o justifica é ser correto para QUALQUER raiz — não só para o literal
// `'out'` que as três cópias escondiam. Uma árvore temporária prova isso sem
// depender do `baseline-main-ed68bd4/`, que é gitignored e pode não existir.
let raiz = '';

beforeAll(() => {
  raiz = mkdtempSync(join(tmpdir(), 'arvore-'));
  mkdirSync(join(raiz, 'pt', 'sobre'), { recursive: true });
  mkdirSync(join(raiz, '_next', 'static'), { recursive: true });
  writeFileSync(join(raiz, '404.html'), '');
  writeFileSync(join(raiz, 'index.html'), '');
  writeFileSync(join(raiz, 'pt', 'index.html'), '');
  writeFileSync(join(raiz, 'pt', 'index.txt'), '');
  writeFileSync(join(raiz, 'pt', 'sobre', 'index.html'), '');
  writeFileSync(join(raiz, '_next', 'static', 'app.js'), '');
  writeFileSync(join(raiz, '_next', 'static', '_buildManifest'), '');
});

afterAll(() => {
  rmSync(raiz, { recursive: true, force: true });
});

describe('o caminhador comum da suíte de build', () => {
  // Esta é a asserção do achado: era o cenário de falha concreto que a revisão
  // descreveu — chamar a função com uma raiz que não é `out` e receber rótulos
  // com `../` na frente, porque a função usava o literal `'out'` no
  // `relative()` enquanto recebia `raiz` como parâmetro.
  it('rotula relativo à raiz que o chamador pediu, qualquer que seja ela', () => {
    expect(listarHtml(raiz)).toEqual([
      '404.html',
      'index.html',
      'pt/index.html',
      'pt/sobre/index.html',
    ]);
    for (const achado of listarHtml(raiz)) expect(achado).not.toContain('..');
  });

  // A segunda metade da armadilha, e a que o `medir.mjs` pagou: sem `base`
  // fixo, a recursão promove o subdiretório a raiz e o prefixo de diretório
  // desaparece para tudo além do primeiro nível — `pt/sobre/index.html` viraria
  // `index.html`, e o rótulo errado seria resolvido de volta contra a raiz de
  // topo, medindo o arquivo errado em silêncio.
  it('preserva o prefixo de diretório além do primeiro nível', () => {
    expect(listarHtml(raiz)).toContain('pt/sobre/index.html');
    expect(listarHtml(raiz).filter((a) => a === 'index.html')).toHaveLength(1);
  });

  it('listarCaminhos devolve caminho abrível a partir do cwd', () => {
    for (const caminho of listarCaminhos(raiz, (n) => n.endsWith('.html'))) {
      expect(caminho.startsWith(raiz)).toBe(true);
    }
  });

  it('o filtro recebe o nome da entrada, não o caminho', () => {
    expect(listar(raiz, (nome) => nome === 'app.js')).toEqual(['_next/static/app.js']);
  });

  // Arquivo sem ponto no nome entra como '' — é como um `_redirects` ou um
  // `_headers` do Cloudflare apareceria, e é o caso que mais interessa pegar.
  it('extensoes enxerga arquivo sem extensão', () => {
    expect(extensoes(raiz)).toEqual(['', '.html', '.js', '.txt']);
  });
});
