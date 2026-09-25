import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Heroi from '../../componentes/heroi/index.tsx';

describe('o herói', () => {
  it('no servidor, rende só o pôster — nunca o canvas', () => {
    const html = renderToStaticMarkup(<Heroi />);
    expect(html).toContain('heroi__poster');
    expect(html).not.toContain('<canvas');
  });

  it('mantém o pôster como elemento de LCP, com alt vazio', () => {
    const html = renderToStaticMarkup(<Heroi />);
    expect(html).toMatch(/<img[^>]*src="\/poster\/heroi\.webp"[^>]*alt=""/);
  });

  it('não marca o pôster como lazy: ele é o LCP', () => {
    const html = renderToStaticMarkup(<Heroi />);
    expect(html).not.toContain('loading="lazy"');
  });
});
