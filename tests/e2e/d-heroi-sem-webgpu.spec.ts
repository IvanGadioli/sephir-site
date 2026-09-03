import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

// D — 03_oraculo.md: "as duas asserções de D que não passam por construção
// são as que o W6 já cobre — o <h1> e a <img> aparecem com navigator.gpu
// removido — porque ali o que pode falhar é o ambiente, não a cópia." O
// resto de D (os outros quatro blocos, a ordem) fica sem oráudo aqui —
// dívida declarada, ver 04_testes/CONTEXT.md.
const OUT_PT_INDEX = join(process.cwd(), 'out', 'pt', 'index.html');

test.beforeAll(() => {
  if (!existsSync(OUT_PT_INDEX)) {
    throw new Error(`alvo ausente: '${OUT_PT_INDEX}' não existe. next build ainda não roda nesta rodada.`);
  }
});

test('h1 "Iniciativa Sephir" e a <img> do pôster têm caixa não-nula, sem erro no console, com navigator.gpu removido', async ({
  page,
}) => {
  const errosConsole: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errosConsole.push(msg.text());
  });
  page.on('pageerror', (err) => errosConsole.push(String(err)));

  await page.addInitScript(() => {
    Object.defineProperty(window.navigator, 'gpu', {
      value: undefined,
      configurable: true,
    });
  });

  await page.goto('/pt/');

  const h1 = page.locator('h1', { hasText: 'Iniciativa Sephir' });
  await expect(h1).toBeVisible();
  const caixaH1 = await h1.boundingBox();
  expect(caixaH1).not.toBeNull();
  expect(caixaH1!.width).toBeGreaterThan(0);
  expect(caixaH1!.height).toBeGreaterThan(0);

  const img = page.locator('img').first();
  await expect(img).toBeVisible();
  const caixaImg = await img.boundingBox();
  expect(caixaImg).not.toBeNull();
  expect(caixaImg!.width).toBeGreaterThan(0);
  expect(caixaImg!.height).toBeGreaterThan(0);

  expect(errosConsole).toEqual([]);
});
