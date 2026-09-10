import { test, expect } from '@playwright/test';
import { medirW5 } from '../../ferramentas/oraculos/w5-axe.mjs';
import { ROTAS } from '../../lib/rotas';

const alvos = [...ROTAS.map((r) => r.rota), '/404.html'];

for (const rota of alvos) {
  test(`G — ${rota} sem violação serious ou critical`, async ({ page }) => {
    const r = await medirW5({ page, rotas: [rota] });
    expect(r.violacoes).toEqual([]);
  });
}

test('J — presença e validade de lang, pelo axe', async ({ page }) => {
  const r = await medirW5({ page, rotas: alvos, regras: ['html-has-lang', 'html-lang-valid'] });
  expect(r.violacoes).toEqual([]);
});

test('as entradas incomplete de contraste são reportadas, não engolidas', async ({ page }) => {
  const r = await medirW5({ page, rotas: alvos });
  expect(Array.isArray(r.detalhe.incomplete)).toBe(true);
});
