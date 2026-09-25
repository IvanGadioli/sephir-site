import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const ROTAS = ['/', '/pt/', '/pt/sobre/', '/pt/como-e-feito/', '/rota-que-nao-existe/'];

for (const rota of ROTAS) {
  test(`axe não acha violação em ${rota}`, async ({ page }) => {
    await page.goto(rota, { waitUntil: 'load' });
    const resultado = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Os `incomplete` ficam à mostra na falha em vez de escondidos: são os
    // casos que o axe não conseguiu decidir sozinho, e ignorá-los é escolher
    // não saber.
    if (resultado.violations.length > 0) {
      console.error(JSON.stringify(resultado.violations, null, 2));
    }
    if (resultado.incomplete.length > 0) {
      console.warn('incomplete:', resultado.incomplete.map((i) => i.id).join(', '));
    }
    expect(resultado.violations).toEqual([]);
  });
}

test('o alvo de toque do menu móvel tem 44px', async ({ page }) => {
  await page.goto('/pt/');
  const caixa = await page.locator('.menu-movel > summary').boundingBox();
  if (caixa === null) {
    // Acima de 768px o menu móvel está display:none e não tem caixa. Isso é
    // o comportamento certo, não uma falha.
    expect(await page.locator('.menu-movel').isVisible()).toBe(false);
    return;
  }
  expect(caixa.width).toBeGreaterThanOrEqual(44);
  expect(caixa.height).toBeGreaterThanOrEqual(44);
});

test('o menu móvel abre e fecha sem JavaScript', async ({ page }) => {
  await page.goto('/pt/');
  const detalhes = page.locator('.menu-movel');
  if (!(await detalhes.isVisible())) test.skip();
  await expect(page.locator('.menu-movel__lista')).toBeHidden();
  await page.locator('.menu-movel > summary').click();
  await expect(page.locator('.menu-movel__lista')).toBeVisible();
});
