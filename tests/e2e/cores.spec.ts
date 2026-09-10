import { test, expect } from '@playwright/test';
import { medirW9 } from '../../ferramentas/oraculos/w9-cores.mjs';
import { ROTAS } from '../../lib/rotas';

test('H — toda cor pintada pertence aos dez matizes', async ({ page }) => {
  const r = await medirW9({ page, rotas: [...ROTAS.map((x) => x.rota), '/404.html'] });
  expect(r.violacoes).toEqual([]);
});

test('H — o medidor reprova os dois valores que mataram a rodada 01', async ({ page }) => {
  await page.setContent(
    `<p style="color:#0a0c10">a</p><p style="color:#7dc4ff">b</p>`);
  const r = await medirW9({ page, rotas: null });
  expect(r.ok).toBe(false);
  expect(r.violacoes.join(' ')).toContain('10, 12, 16');
  expect(r.violacoes.join(' ')).toContain('125, 196, 255');
});
