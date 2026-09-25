import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const ROTAS = ['/', '/pt/', '/pt/sobre/', '/pt/como-e-feito/', '/rota-que-nao-existe/'];

const TAGS_WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// `/` tem <meta http-equiv="refresh" content="0; url=/pt/"> (ver
// app/page.tsx e tests/build/casca.test.ts): o refresh pode disparar durante
// a injeção do axe e destruir o contexto de execução a meio da análise —
// `page.evaluate: Execution context was destroyed, most likely because of a
// navigation`. Não é falha de asserção nem do site, é uma corrida real entre
// o redirecionamento e o axe. Uma segunda tentativa, depois que a navegação
// já terminou, resolve — sem depender de heurística de rede ociosa, que sob
// carga da máquina pode ela mesma estourar o timeout do teste.
async function analisarComRetentativa(page: Page) {
  try {
    return await new AxeBuilder({ page }).withTags(TAGS_WCAG).analyze();
  } catch (erro) {
    if (erro instanceof Error && erro.message.includes('Execution context was destroyed')) {
      await page.waitForLoadState('load');
      return await new AxeBuilder({ page }).withTags(TAGS_WCAG).analyze();
    }
    throw erro;
  }
}

// Uma violação de contraste é aceita por decisão do titular em 2026-09-25:
// --cor-faint (#4A5468) sobre --cor-void dá 2,64:1, e WCAG AA pede 4,5:1
// para texto normal. A causa está na paleta da marca — o theme.ts declara
// `faint` como cor de texto terciário/captions, um uso que essa cor não
// serve sobre o próprio --cor-void — não no site, e a correção ficou fora
// desta rodada. Ver a nota na spec, seção 8.
//
// NÃO é para desligar a regra `color-contrast`: a lista abaixo trava o
// escopo exato do que foi aceito, seletor por seletor, então uma violação
// nova — ou este mesmo par de cores aparecendo num terceiro elemento —
// ainda reprova. Confirmado com um script de investigação isolado (fora da
// suíte) contra as cinco rotas nos dois viewports: em todas as ocorrências
// o `target` do axe é exatamente `.rodape__tagline`, nenhum outro seletor.
const CONTRASTE_ACEITO = ['.rodape__tagline'];

for (const rota of ROTAS) {
  test(`axe não acha violação em ${rota}`, async ({ page }) => {
    await page.goto(rota, { waitUntil: 'load' });
    const resultado = await analisarComRetentativa(page);

    const inesperadas = resultado.violations.flatMap((violacao) =>
      violacao.nodes
        .filter(
          (no) =>
            !(violacao.id === 'color-contrast' && CONTRASTE_ACEITO.includes(no.target.join(' '))),
        )
        .map((no) => `${violacao.id}: ${no.target.join(' ')}`),
    );

    // Os `incomplete` ficam à mostra na falha em vez de escondidos: são os
    // casos que o axe não conseguiu decidir sozinho, e ignorá-los é escolher
    // não saber. Nas rotas com herói/faixa de imagem (/, /pt/, /pt/sobre/)
    // o axe devolve `color-contrast` como incomplete (não violação) para o
    // texto sobre `.heroi__veu-vertical`/`.faixa__veu`: o gradiente é
    // semitransparente sobre uma imagem fotográfica, e o axe não sabe o
    // pixel exato por baixo — `messageKey: "bgGradient"`. É indeterminação
    // estrutural do CSS, não o mesmo problema da violação aceita acima
    // (que é sobre --cor-void, fundo chapado, fora de dúvida).
    if (resultado.incomplete.length > 0) {
      console.warn('incomplete:', resultado.incomplete.map((i) => i.id).join(', '));
    }
    if (inesperadas.length > 0) {
      console.error(JSON.stringify(resultado.violations, null, 2));
    }
    expect(inesperadas).toEqual([]);
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
