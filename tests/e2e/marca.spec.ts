import { expect, test } from '@playwright/test';
import { colors } from '../../lib/marca.ts';

// O axe mede contraste; este arquivo mede identidade. São perguntas
// diferentes: um CSS acessível pode estar na paleta errada.
const paraRgb = (hex: string) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

test('o fundo da página é o void da marca', async ({ page }) => {
  await page.goto('/pt/');
  const fundo = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(fundo).toBe(paraRgb(colors.void));
});

test('o h1 é stardust', async ({ page }) => {
  await page.goto('/pt/');
  const cor = await page.locator('h1').first().evaluate((el) => getComputedStyle(el).color);
  expect(cor).toBe(paraRgb(colors.stardust));
});

test('o acento do wordmark é âmbar', async ({ page }) => {
  await page.goto('/pt/');
  const cor = await page
    .locator('.wordmark__sephir')
    .first()
    .evaluate((el) => getComputedStyle(el).color);
  expect(cor).toBe(paraRgb(colors.amber));
});

test('nenhuma cor de fora da marca aparece como cor de texto', async ({ page }) => {
  await page.goto('/pt/');
  const daMarca = new Set(
    Object.values(colors)
      .filter((c) => c.startsWith('#'))
      .map(paraRgb),
  );
  const usadas = await page.evaluate(() => {
    const vistas = new Set<string>();
    for (const el of document.querySelectorAll('h1, h2, h3, p, a, span, dt, dd, li')) {
      vistas.add(getComputedStyle(el).color);
    }
    return [...vistas];
  });
  expect(usadas.filter((c) => !daMarca.has(c))).toEqual([]);
});

test('Space Grotesk foi realmente desenhada, não só declarada', async ({ page }) => {
  await page.goto('/pt/');
  // A pilha computada dizer "Space Grotesk" não prova nada: se o arquivo não
  // carregou, o navegador desenha system-ui e a string continua lá. Só
  // document.fonts.check() responde a pergunta certa.
  await page.evaluate(() => document.fonts.ready);
  const desenhada = await page.evaluate(() => document.fonts.check("300 1rem 'Space Grotesk'"));
  expect(desenhada).toBe(true);
});

test('Space Mono foi realmente desenhada', async ({ page }) => {
  await page.goto('/pt/');
  await page.evaluate(() => document.fonts.ready);
  const desenhada = await page.evaluate(() => document.fonts.check("400 1rem 'Space Mono'"));
  expect(desenhada).toBe(true);
});

test('o corpo de texto não baixa byte de fonte', async ({ page }) => {
  const baixadas: string[] = [];
  page.on('response', (r) => {
    if (r.url().endsWith('.woff2')) baixadas.push(r.url());
  });
  await page.goto('/pt/', { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  // Só as duas da marca. Nada de Inter, nada de fonte de corpo.
  expect(baixadas.length).toBeLessThanOrEqual(2);
  for (const url of baixadas) {
    expect(url).toMatch(/space-(grotesk|mono)-latin\.woff2$/);
  }
});

test('nenhuma requisição sai para CDN de fonte de terceiro', async ({ page }) => {
  const externas: string[] = [];
  page.on('request', (r) => {
    const url = r.url();
    if (!url.startsWith('http://localhost:4173') && !url.startsWith('data:')) externas.push(url);
  });
  await page.goto('/pt/', { waitUntil: 'load' });
  expect(externas).toEqual([]);
});
