import { expect, test, type Page } from '@playwright/test';
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

// Os dois <nav> do Topo têm o mesmo contrato de estado (spec §4 e §6.3) e
// erravam de jeitos opostos até a revisão final (I1: o ativo do desktop saía
// muted; I2: o inativo do móvel saía âmbar). Nenhuma rede pegou: o unitário do
// Topo roda `renderToStaticMarkup`, sem CSS, e só pode afirmar que a classe
// existe; o teste de "nenhuma cor de fora da marca" abaixo passa porque muted e
// âmbar são as duas cores da marca. Só cor computada, item por item, fecha isso
// — e é por isso que este teste lê `getComputedStyle` e compara contra os
// tokens de `lib/marca.ts`, nunca contra hex repetido aqui.
const ESTADOS = [
  { seletor: '.navegacao', nome: 'desktop' },
  { seletor: '.menu-movel__lista', nome: 'móvel' },
];

async function coresDeEstado(page: Page, seletor: string) {
  return page.evaluate((sel) => {
    const raiz = document.querySelector(sel);
    if (raiz === null) throw new Error(`navegação ausente do DOM: ${sel}`);
    return [...raiz.querySelectorAll('a, span')].map((el) => ({
      rotulo: el.textContent ?? '',
      ativo: el.classList.contains('navegacao__ativo'),
      ausente: el.classList.contains('navegacao__ausente'),
      current: el.getAttribute('aria-current'),
      cor: getComputedStyle(el).color,
    }));
  }, seletor);
}

test('as duas navegações pintam os três estados com as mesmas cores da marca', async ({
  page,
}) => {
  await page.goto('/pt/');
  // O painel móvel é um <details> fechado, e conteúdo de <details> fechado não
  // é renderizado — sem abrir não há cor computada para ler. Isto é também a
  // razão pela qual o axe nunca alcançou o defeito I2. Abrir por atributo, não
  // por clique: acima de 768px o <summary> está display:none e o clique falha.
  await page.locator('.menu-movel').evaluate((el) => el.setAttribute('open', ''));

  for (const { seletor, nome } of ESTADOS) {
    const itens = await coresDeEstado(page, seletor);
    expect(itens.length, `${nome}: os quatro itens do menu`).toBe(4);
    for (const item of itens) {
      const esperada = item.ativo ? colors.stardust : colors.muted;
      expect(item.cor, `${nome} "${item.rotulo}" (ativo=${item.ativo})`).toBe(paraRgb(esperada));
    }
    // Um ativo e três não-ativos: se a página parar de marcar o item, o laço
    // acima passaria com tudo muted e o defeito I1 voltaria calado.
    expect(itens.filter((i) => i.ativo).map((i) => i.rotulo), `${nome}: um item ativo`).toEqual([
      'o projeto',
    ]);
    expect(itens.filter((i) => i.ausente).map((i) => i.rotulo), `${nome}: um ausente`).toEqual([
      'devlog',
    ]);
  }

  // O item que o leitor de tela anuncia como página atual é o mesmo que a vista
  // pinta em stardust — e o irmão ao lado dele, em muted.
  const desktop = await coresDeEstado(page, '.navegacao');
  const current = desktop.filter((i) => i.current === 'page');
  expect(current.map((i) => i.cor)).toEqual([paraRgb(colors.stardust)]);
  expect(desktop.filter((i) => i.current === null).map((i) => i.cor)).toEqual([
    paraRgb(colors.muted),
    paraRgb(colors.muted),
    paraRgb(colors.muted),
  ]);

  // E as duas navegações, lado a lado: mesma sequência de cores. É a asserção
  // que a spec §6.3 pede literalmente ("as mesmas cores de estado") e a que
  // nenhum teste fazia.
  const [cDesktop, cMovel] = await Promise.all(
    ESTADOS.map(({ seletor }) => coresDeEstado(page, seletor).then((i) => i.map((x) => x.cor))),
  );
  expect(cMovel).toEqual(cDesktop);
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
