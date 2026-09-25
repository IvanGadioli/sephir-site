import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Topo } from '../../componentes/Topo.tsx';

describe('Topo', () => {
  it('estampa o wordmark com Sephir em âmbar e Studio em stardust', () => {
    const html = renderToStaticMarkup(<Topo ativo={null} />);
    expect(html).toContain('wordmark__sephir">Sephir</span>');
    expect(html).toContain('wordmark__studio"> Studio</span>');
  });

  it('marca aria-current apenas no item ativo', () => {
    const html = renderToStaticMarkup(<Topo ativo="sobre" />);
    const comAriaCurrent = html.match(/aria-current="page"/g) ?? [];
    expect(comAriaCurrent).toHaveLength(1);
    expect(html).toMatch(/aria-current="page"[^>]*>sobre</);
  });

  it('não marca nada quando nenhum item está ativo', () => {
    const html = renderToStaticMarkup(<Topo ativo={null} />);
    expect(html).not.toContain('aria-current');
  });

  it('rende devlog como texto, nunca como link', () => {
    const html = renderToStaticMarkup(<Topo ativo={null} />);
    expect(html).toContain('<span class="navegacao__ausente">devlog</span>');
    expect(html).not.toMatch(/<a[^>]*>devlog</);
  });

  it('não usa aria-disabled, que o axe reprova em span sem papel', () => {
    const html = renderToStaticMarkup(<Topo ativo={null} />);
    expect(html).not.toContain('aria-disabled');
  });

  it('dá um rótulo acessível à navegação', () => {
    const html = renderToStaticMarkup(<Topo ativo={null} />);
    expect(html).toMatch(/<nav[^>]*aria-label="seções"/);
  });
});
