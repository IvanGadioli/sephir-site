import { describe, it, expect } from 'vitest';
import { medirW2 } from '../../ferramentas/oraculos/w2-links.mjs';

describe('C — todo href interno tem destino', () => {
  it('zero link quebrado em out/', async () => {
    const r = await medirW2({ raiz: 'out' });
    expect(r.violacoes).toEqual([]);
    expect(r.ok).toBe(true);
  });
  it('pega o modo de falha mais provável: um link para /pt/sobre/', async () => {
    const r = await medirW2({ raiz: 'out', extra: [{ de: 'pt/index.html', href: '/pt/sobre/' }] });
    expect(r.ok).toBe(false);
    expect(r.violacoes.join(' ')).toContain('/pt/sobre/');
  });
});
