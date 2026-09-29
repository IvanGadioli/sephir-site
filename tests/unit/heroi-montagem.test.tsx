import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Heroi from '../../componentes/heroi/index.tsx';

describe('o herói', () => {
  it('no servidor, rende só o pôster — nunca o canvas', () => {
    const html = renderToStaticMarkup(<Heroi />);
    expect(html).toContain('heroi__poster');
    expect(html).not.toContain('<canvas');
  });

  it('serve o pôster como imagem decorativa, com alt vazio', () => {
    const html = renderToStaticMarkup(<Heroi />);
    expect(html).toMatch(/<img[^>]*src="\/poster\/heroi\.webp"[^>]*alt=""/);
  });

  it('não marca o pôster como lazy: ele é o primeiro pixel do herói', () => {
    // Antes este teste dizia "ele é o LCP". A revisão final (I3) mediu que não
    // é: o elemento de LCP desta branch é o <h1>. O `eager` continua certo por
    // outra razão — o pôster é o que o visitante vê enquanto o canvas não pinta,
    // e em todo visitante sem WebGPU é o que ele vê para sempre.
    const html = renderToStaticMarkup(<Heroi />);
    expect(html).not.toContain('loading="lazy"');
  });
});
