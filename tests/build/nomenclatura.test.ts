import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const home = () => readFileSync('out/pt/index.html', 'utf8');
// h1() LANÇA quando não há <h1>, em vez de devolver ''. Devolver string vazia
// faz as três asserções negativas abaixo passarem por vacuidade — sem <h1>
// nenhum, '' de fato não contém 'Semente Cósmica'. Verde por ausência é o
// modo de falha que este portão inteiro existe para não cometer.
const h1 = () => {
  const m = home().match(/<h1[^>]*>(.*?)<\/h1>/s);
  if (!m?.[1]) throw new Error('nenhum <h1> em out/pt/index.html');
  return m[1].replace(/<[^>]*>/g, '');
};

describe('K — a nomenclatura travada em 30/07/2026', () => {
  it('o <h1> estampa o produto', () => expect(h1()).toContain('Iniciativa Sephir'));
  it('o <h1> não estampa a fase', () => expect(h1()).not.toContain('Semente Cósmica'));
  it('o <h1> não estampa o estúdio', () => expect(h1()).not.toContain('Sephir Studio'));
  it('a fase só aparece como selo', () =>
    expect(home()).toContain('fase Semente Cósmica · rumo à 1.0'));
  it('a fase nunca aparece em título', () =>
    expect(home()).not.toMatch(/<h[1-6][^>]*>[^<]*Semente Cósmica/));
  it('a tagline está literal', () =>
    expect(home()).toContain('Simulação física do cosmos, jogável.'));
  it('o lockup está no rodapé', () => {
    const rodape = home().match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
    expect(rodape).toContain('Sephir Studio');
  });
});

describe('C — nenhum link para rota que esta rodada não entrega', () => {
  it('a home não linka /pt/sobre/', () =>
    expect(home()).not.toContain('/pt/sobre/'));
});
