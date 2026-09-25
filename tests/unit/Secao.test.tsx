import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Secao } from '../../componentes/Secao.tsx';

describe('Secao', () => {
  it('estampa o número em âmbar e o rótulo em caixa alta mono', () => {
    const html = renderToStaticMarkup(
      <Secao numero="01" rotulo="o que é" titulo="O que é"><p>corpo</p></Secao>,
    );
    expect(html).toContain('<span class="eyebrow__numero">01</span>');
    expect(html).toContain('<span class="eyebrow__rotulo"> — o que é</span>');
    expect(html).toContain('class="eyebrow mono"');
  });

  it('põe o título num h2', () => {
    const html = renderToStaticMarkup(
      <Secao numero="02" rotulo="estado atual" titulo="Estado atual"><p>x</p></Secao>,
    );
    expect(html).toMatch(/<h2[^>]*>Estado atual<\/h2>/);
  });

  it('rende o conteúdo recebido', () => {
    const html = renderToStaticMarkup(
      <Secao numero="03" rotulo="como" titulo="Como"><p>corpo da seção</p></Secao>,
    );
    expect(html).toContain('<p>corpo da seção</p>');
  });

  it('aceita uma âncora, para o menu poder apontar', () => {
    const html = renderToStaticMarkup(
      <Secao numero="01" rotulo="o que é" titulo="O que é" id="o-que-e"><p>x</p></Secao>,
    );
    expect(html).toMatch(/<section[^>]*id="o-que-e"/);
  });

  it('sem âncora, não emite id vazio', () => {
    const html = renderToStaticMarkup(
      <Secao numero="01" rotulo="o que é" titulo="O que é"><p>x</p></Secao>,
    );
    expect(html).not.toContain('id=""');
  });
});
