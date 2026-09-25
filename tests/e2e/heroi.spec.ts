import { expect, test } from '@playwright/test';

test('sem navigator.gpu, o canvas não monta e o pôster continua visível', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'gpu', { value: undefined, configurable: true });
  });
  await page.goto('/pt/');
  await expect(page.locator('.heroi__poster')).toBeVisible();
  await expect(page.locator('.heroi__canvas')).toHaveCount(0);
});

test('com movimento reduzido, o canvas não monta', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/pt/');
  await expect(page.locator('.heroi__poster')).toBeVisible();
  await expect(page.locator('.heroi__canvas')).toBeHidden();
});

test('o pôster nunca sai do DOM, mesmo quando o canvas pinta', async ({ page }) => {
  await page.goto('/pt/');
  await expect(page.locator('.heroi__poster')).toHaveCount(1);
});

test('o h1 continua legível sobre o herói', async ({ page }) => {
  await page.goto('/pt/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('h1')).toHaveText('Iniciativa Sephir');
});
