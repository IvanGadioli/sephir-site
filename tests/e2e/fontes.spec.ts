import { test, expect } from '@playwright/test';
import { medirW11 } from '../../ferramentas/oraculos/w11-fontes.mjs';
import { ROTAS } from '../../lib/rotas';

test('I — toda pilha computada é uma das três', async ({ page }) => {
  const r = await medirW11({ page, rotas: [...ROTAS.map((x) => x.rota), '/404.html'] });
  expect(r.violacoes).toEqual([]);
});

test('I — o medidor reprova a pilha herdada da rodada 01', async ({ page }) => {
  await page.setContent(
    `<h1 style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif">x</h1>`);
  const r = await medirW11({ page, rotas: null });
  expect(r.ok).toBe(false);
  expect(r.violacoes.join(' ')).toContain('-apple-system');
});
