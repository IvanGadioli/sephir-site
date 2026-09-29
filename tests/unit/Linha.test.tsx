import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Linha } from '../../componentes/Linha.tsx';

describe('Linha', () => {
  it('na variante estado, usa a grid de duas colunas', () => {
    const html = renderToStaticMarkup(
      <Linha colunas="estado"><span>EXISTE</span><span>o motor</span></Linha>,
    );
    expect(html).toContain('linha--estado');
    expect(html).not.toContain('linha--portao');
  });

  it('na variante portao, usa a grid de três colunas', () => {
    const html = renderToStaticMarkup(
      <Linha colunas="portao"><span>00</span><span>escopo</span><span>agora?</span></Linha>,
    );
    expect(html).toContain('linha--portao');
    expect(html).not.toContain('linha--estado');
  });

  it('rende as células recebidas, na ordem', () => {
    const html = renderToStaticMarkup(
      <Linha colunas="portao"><span>00</span><span>escopo</span><span>agora?</span></Linha>,
    );
    expect(html.indexOf('00')).toBeLessThan(html.indexOf('escopo'));
    expect(html.indexOf('escopo')).toBeLessThan(html.indexOf('agora?'));
  });
});
