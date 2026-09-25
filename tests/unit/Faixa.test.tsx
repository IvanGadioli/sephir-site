import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Faixa } from '../../componentes/Faixa.tsx';

describe('Faixa', () => {
  it('monta o Topo dentro de si, com o item ativo recebido', () => {
    const html = renderToStaticMarkup(<Faixa titulo="Sobre" ativo="sobre" />);
    expect(html).toContain('class="topo"');
    expect(html).toMatch(/aria-current="page"[^>]*>sobre</);
  });

  it('põe o título num h1', () => {
    const html = renderToStaticMarkup(<Faixa titulo="Como é feito" ativo="como-e-feito" />);
    expect(html).toMatch(/<h1[^>]*>Como é feito<\/h1>/);
  });

  it('sem imagem, não emite img nenhuma', () => {
    const html = renderToStaticMarkup(<Faixa titulo="Como é feito" ativo="como-e-feito" />);
    expect(html).not.toContain('<img');
  });

  it('sem imagem, usa a faixa baixa', () => {
    const html = renderToStaticMarkup(<Faixa titulo="Como é feito" ativo="como-e-feito" />);
    expect(html).toContain('faixa--baixa');
  });

  it('com imagem, emite a img de fundo com alt vazio e a faixa alta', () => {
    const html = renderToStaticMarkup(
      <Faixa titulo="Sobre" ativo="sobre" imagem="/poster/heroi.webp" />,
    );
    expect(html).toMatch(/<img[^>]*src="\/poster\/heroi\.webp"/);
    expect(html).toMatch(/<img[^>]*alt=""/);
    expect(html).toContain('faixa--alta');
  });

  it('rende o subtítulo quando recebe um', () => {
    const html = renderToStaticMarkup(
      <Faixa titulo="Devlog" ativo="devlog" sub="uma nota por rodada" />,
    );
    expect(html).toContain('uma nota por rodada');
  });

  it('não rende parágrafo de subtítulo quando não recebe', () => {
    const html = renderToStaticMarkup(<Faixa titulo="Sobre" ativo="sobre" />);
    expect(html).not.toContain('faixa__sub');
  });

  it('desenha a régua âmbar só quando pedida', () => {
    const sem = renderToStaticMarkup(<Faixa titulo="Sobre" ativo="sobre" />);
    const com = renderToStaticMarkup(<Faixa titulo="Como é feito" ativo="como-e-feito" regua />);
    expect(sem).not.toContain('faixa__regua');
    expect(com).toContain('faixa__regua');
  });
});
