import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Seta } from '../../componentes/Seta.tsx';

describe('Seta', () => {
  it('liga para o destino recebido', () => {
    const html = renderToStaticMarkup(<Seta href="/pt/como-e-feito/">ver o método</Seta>);
    expect(html).toContain('href="/pt/como-e-feito/"');
    expect(html).toContain('ver o método');
  });

  it('por padrão aponta para a direita', () => {
    const html = renderToStaticMarkup(<Seta href="/pt/">voltar</Seta>);
    expect(html).toContain('points="14 6 20 12 14 18"');
  });

  it('com direcao baixo, troca o glifo', () => {
    const html = renderToStaticMarkup(
      <Seta href="#o-que-e" direcao="baixo">descer para o projeto</Seta>,
    );
    expect(html).toContain('points="6 14 12 20 18 14"');
    expect(html).not.toContain('points="14 6 20 12 14 18"');
  });

  it('esconde o ícone do leitor de tela, que já lê o texto', () => {
    const html = renderToStaticMarkup(<Seta href="/pt/">voltar</Seta>);
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
  });

  it('desenha a régua âmbar só quando pedida', () => {
    const sem = renderToStaticMarkup(<Seta href="/pt/">voltar</Seta>);
    const com = renderToStaticMarkup(<Seta href="/pt/" regua>voltar</Seta>);
    expect(sem).not.toContain('seta__regua');
    expect(com).toContain('seta__regua');
  });

  // Renomeado na correção I8. O nome anterior era "garante alvo de toque de
  // 44px", e o corpo afirma que uma classe existe — `renderToStaticMarkup` não
  // vê CSS, então este teste nunca pôde falar sobre pixel. O valor mora em
  // `estilos/base.css` (`.seta { min-height: 44px }`) e quem o mede agora é
  // `tests/e2e/acessibilidade.spec.ts`, com `boundingBox` nos dois viewports.
  // O teste continua valendo pelo que ele de fato garante: sem a classe, o
  // seletor do CSS não alcança nada e o alvo de toque desaparece em silêncio.
  it('carrega a classe .seta, que é onde o alvo de toque de 44px é aplicado', () => {
    const html = renderToStaticMarkup(<Seta href="/pt/">voltar</Seta>);
    expect(html).toContain('class="seta"');
  });
});
