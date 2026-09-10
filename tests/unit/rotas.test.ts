import { describe, it, expect } from 'vitest';
import { ROTAS, HTML_ESPERADOS, IDIOMAS, ROTAS_PENDENTES } from '../../lib/rotas';

describe('tabela de rotas desta spec', () => {
  it('tem um idioma só', () => expect([...IDIOMAS]).toEqual(['pt']));
  it('declara / e /pt/', () =>
    expect(ROTAS.map((r) => r.rota)).toEqual(['/', '/pt/']));
  it('os três html esperados, ordenados', () =>
    expect([...HTML_ESPERADOS]).toEqual(['404.html', 'index.html', 'pt/index.html']));
  it('/pt/sobre/ é pendente, não esperada', () => {
    expect(ROTAS_PENDENTES.map((r) => r.rota)).toEqual(['/pt/sobre/']);
    expect(HTML_ESPERADOS).not.toContain('pt/sobre/index.html');
  });
});
