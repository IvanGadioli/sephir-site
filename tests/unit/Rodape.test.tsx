import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Rodape } from '../../componentes/Rodape.tsx';

describe('Rodape', () => {
  it('traz o CNPJ literal da empresa', () => {
    const html = renderToStaticMarkup(<Rodape />);
    expect(html).toContain('Sephir Studio Inova Simples (I.S.) — CNPJ 63.037.641/0001-30');
  });

  it('traz a tagline da marca', () => {
    const html = renderToStaticMarkup(<Rodape />);
    expect(html).toContain('Simulação física do cosmos, jogável.');
  });

  it('mostra o logo com alternativo textual', () => {
    const html = renderToStaticMarkup(<Rodape />);
    expect(html).toMatch(/<img[^>]*src="\/marca\/logo\.webp"/);
    expect(html).toMatch(/<img[^>]*alt="Sephir Studio"/);
  });

  it('declara largura e altura do logo, para não causar salto de layout', () => {
    const html = renderToStaticMarkup(<Rodape />);
    expect(html).toMatch(/<img[^>]*width="150"/);
    expect(html).toMatch(/<img[^>]*height="84"/);
  });

  it('liga para GitHub e para o contato por e-mail', () => {
    const html = renderToStaticMarkup(<Rodape />);
    expect(html).toContain('href="https://github.com/IvanGadioli"');
    expect(html).toContain('href="mailto:ivanilson.gadioli2@gmail.com"');
  });

  it('não estampa o codinome da fase, que nunca é título', () => {
    const html = renderToStaticMarkup(<Rodape />);
    expect(html).not.toContain('Semente Cósmica');
  });
});
