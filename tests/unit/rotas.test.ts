import { describe, expect, it } from 'vitest';

// lib/rotas.ts nasce no portão 05. Import falha hoje com "Cannot find
// module" — motivo certo.
import { IDIOMAS, ROTAS, inicio } from '../../lib/rotas';

describe('IDIOMAS', () => {
  it("é somente ['pt'] nesta rodada (adr-sup-001)", () => {
    expect(IDIOMAS).toEqual(['pt']);
  });
});

describe('ROTAS — forma', () => {
  it('não é vazio, todo href começa e termina em "/", todo título é não vazio', () => {
    expect(ROTAS.length).toBeGreaterThan(0);
    for (const rota of ROTAS) {
      expect(rota.href.startsWith('/')).toBe(true);
      expect(rota.href.endsWith('/')).toBe(true);
      expect(rota.titulo.trim().length).toBeGreaterThan(0);
    }
  });

  it('contém /pt/ e /pt/sobre/ — as rotas v1 navegáveis (02_superficie/spec-mae.md)', () => {
    const hrefs: string[] = ROTAS.map((r: { href: string }) => r.href);
    expect(hrefs).toContain('/pt/');
    expect(hrefs).toContain('/pt/sobre/');
  });

  it('não contém rotas v2 — como-e-feito e devlog entram só quando existirem (spec, assinatura)', () => {
    const hrefs: string[] = ROTAS.map((r: { href: string }) => r.href);
    expect(hrefs).not.toContain('/pt/como-e-feito/');
    expect(hrefs.some((h: string) => h.startsWith('/pt/devlog'))).toBe(false);
  });
});

describe('inicio()', () => {
  it("inicio('pt') === '/pt/'", () => {
    expect(inicio('pt')).toBe('/pt/');
  });
});
