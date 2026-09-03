import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

// B — 03_oraculo.md: "grep pela string é o caso puro de teste que passa por
// construção" — quem escreve http-equiv="refresh" no JSX escreve a mesma
// coisa no grep. A medida que substitui é comportamental: playwright abre
// out/index.html (via tests/support/servidor-estatico.mjs, não file://,
// porque a navegação para "/pt/" precisa resolver como um host resolveria)
// e a URL final tem que terminar em /pt/. metadata.other reprova sozinho,
// porque emite <meta name> e a navegação nunca acontece.
const OUT_INDEX = join(process.cwd(), 'out', 'index.html');

test.beforeAll(() => {
  if (!existsSync(OUT_INDEX)) {
    throw new Error(
      `alvo ausente: '${OUT_INDEX}' não existe. next build ainda não roda ` +
        'nesta rodada (next não é devDependency até o portão 05) — falha por ' +
        'ausência do alvo, não de conteúdo.'
    );
  }
});

test('a navegação a partir de / termina em /pt/', async ({ page }) => {
  await page.goto('/');
  await page.waitForURL(/\/pt\/$/);
  expect(page.url()).toMatch(/\/pt\/$/);
});

test('o link visível para /pt/ tem caixa não-nula e nome acessível, com o refresh interceptado', async ({
  page,
}) => {
  // Segura a navegação que o próprio meta refresh dispara, para inspecionar
  // o DOM de "/" antes dela se completar — sem isso, content="0" navega
  // rápido demais para o teste correr.
  let liberar: () => void = () => {};
  const travado = new Promise<void>((resolve) => {
    liberar = resolve;
  });
  await page.route('**/pt/', async (route) => {
    await travado;
    await route.continue();
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const link = page.locator('a[href="/pt/"]').first();
  await expect(link).toHaveAttribute('href', '/pt/');
  const nome = (await link.textContent())?.trim() ?? '';
  expect(nome.length).toBeGreaterThan(0);

  const caixa = await link.boundingBox();
  expect(caixa).not.toBeNull();
  expect(caixa!.width).toBeGreaterThan(0);
  expect(caixa!.height).toBeGreaterThan(0);

  liberar();
});
