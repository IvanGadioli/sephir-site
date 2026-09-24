# Redesign do zero — plano, parte 4: verificação do site estático

> Continuação de `2026-09-24-redesign-zero-parte-3.md`. As **Global Constraints** da parte 1 valem aqui integralmente.

Nesta parte fecham as camadas 3 e 4 da spec §7: os testes de build sobre `out/` e
o E2E de Playwright sobre o `out/` servido. O herói ainda não existe — estes
testes descrevem o site estático completo, e é de propósito: o herói entra na
parte 5 sobre uma base já verificada.

---

## Tarefa 16: A árvore do export, a integridade dos links, e a varredura de `'use client'`

**Files:**
- Create: `tests/build/arvore.test.ts`, `tests/build/links.test.ts`, `tests/build/cliente.test.ts`
- Test: os três acima

**Interfaces:**
- Consumes: `HTML_ESPERADOS` de `lib/rotas.ts`.
- Produces: nada — é tarefa de verificação.

- [ ] **Step 1: Escrever o teste de árvore**

`tests/build/arvore.test.ts`:

```ts
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { HTML_ESPERADOS } from '../../lib/rotas.ts';

function listarHtml(raiz: string): string[] {
  const achados: string[] = [];
  for (const entrada of readdirSync(raiz)) {
    const caminho = join(raiz, entrada);
    if (statSync(caminho).isDirectory()) {
      achados.push(...listarHtml(caminho));
    } else if (entrada.endsWith('.html')) {
      achados.push(relative('out', caminho));
    }
  }
  return achados.sort();
}

describe('a árvore do export', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
  }, 300_000);

  it('é exatamente os cinco HTML da spec, nem mais nem menos', () => {
    expect(listarHtml('out')).toEqual([...HTML_ESPERADOS]);
  });

  it('não vaza rota de devlog, que está fora do escopo desta rodada', () => {
    const todos = listarHtml('out').join('\n');
    expect(todos).not.toContain('devlog');
  });
});
```

O `toEqual` é estrito de propósito: um HTML a mais no export é rota que ninguém
pediu, e um a menos é página que não publicou. As duas coisas são falha.

- [ ] **Step 2: Escrever o teste de integridade de link**

`tests/build/links.test.ts`:

```ts
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

function listarArquivos(raiz: string, filtro: (n: string) => boolean): string[] {
  const achados: string[] = [];
  for (const entrada of readdirSync(raiz)) {
    const caminho = join(raiz, entrada);
    if (statSync(caminho).isDirectory()) achados.push(...listarArquivos(caminho, filtro));
    else if (filtro(entrada)) achados.push(relative('out', caminho));
  }
  return achados;
}

// Um href interno resolve para: o próprio arquivo (se termina em extensão), ou
// <rota>/index.html (se termina em barra). Fragmento e query são descartados
// antes de resolver.
function resolverHref(href: string): string | null {
  const semFragmento = href.split('#')[0]?.split('?')[0] ?? '';
  if (semFragmento === '') return null;
  const semBarra = semFragmento.replace(/^\//, '');
  if (/\.[a-z0-9]+$/i.test(semBarra)) return semBarra;
  return join(semBarra, 'index.html');
}

describe('a integridade dos links internos', () => {
  let paginas: string[] = [];

  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
    paginas = listarArquivos('out', (n) => n.endsWith('.html'));
  }, 300_000);

  it('todo href interno aponta para um arquivo que existe', () => {
    const quebrados: string[] = [];
    for (const pagina of paginas) {
      const html = readFileSync(join('out', pagina), 'utf8');
      const hrefs = [...html.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1] ?? '');
      for (const href of hrefs) {
        const alvo = resolverHref(href);
        if (alvo === null) continue;
        if (!existsSync(join('out', alvo))) quebrados.push(`${pagina} → ${href} (${alvo})`);
      }
    }
    expect(quebrados).toEqual([]);
  });

  it('toda src interna aponta para um arquivo que existe', () => {
    const quebrados: string[] = [];
    for (const pagina of paginas) {
      const html = readFileSync(join('out', pagina), 'utf8');
      const srcs = [...html.matchAll(/src="(\/[^"]*)"/g)].map((m) => m[1] ?? '');
      for (const src of srcs) {
        const alvo = src.replace(/^\//, '');
        if (!existsSync(join('out', alvo))) quebrados.push(`${pagina} → ${src}`);
      }
    }
    expect(quebrados).toEqual([]);
  });

  it('todo fragmento apontado existe como id na página de destino', () => {
    const quebrados: string[] = [];
    for (const pagina of paginas) {
      const html = readFileSync(join('out', pagina), 'utf8');
      const comFragmento = [...html.matchAll(/href="(\/[^"#]*)#([^"]+)"/g)];
      for (const achado of comFragmento) {
        const alvo = resolverHref(achado[1] ?? '');
        if (alvo === null || !existsSync(join('out', alvo))) continue;
        const destino = readFileSync(join('out', alvo), 'utf8');
        if (!destino.includes(`id="${achado[2]}"`)) {
          quebrados.push(`${pagina} → ${achado[1]}#${achado[2]}`);
        }
      }
    }
    expect(quebrados).toEqual([]);
  });
});
```

O terceiro teste é o que pega a armadilha real: `/pt/#o-que-e` no menu de **todas**
as páginas. Se a âncora `o-que-e` sair da home, o menu passa a mentir em quatro
lugares e nenhum teste de arquivo perceberia.

- [ ] **Step 3: Escrever a varredura de `'use client'`**

`tests/build/cliente.test.ts`:

```ts
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function listarFontes(raiz: string): string[] {
  const achados: string[] = [];
  for (const entrada of readdirSync(raiz)) {
    const caminho = join(raiz, entrada);
    if (statSync(caminho).isDirectory()) achados.push(...listarFontes(caminho));
    else if (/\.(ts|tsx)$/.test(entrada)) achados.push(caminho);
  }
  return achados;
}

describe("a fronteira de 'use client'", () => {
  it('só aparece dentro de componentes/heroi/', () => {
    const fontes = [...listarFontes('app'), ...listarFontes('componentes'), ...listarFontes('lib')];
    const clientes = fontes.filter((f) => {
      const texto = readFileSync(f, 'utf8');
      return /^\s*(['"])use client\1/m.test(texto);
    });
    for (const cliente of clientes) {
      expect(cliente.startsWith(join('componentes', 'heroi'))).toBe(true);
    }
  });

  it('nenhuma rota, nenhum layout e nenhum dos seis componentes é cliente', () => {
    const proibidos = [
      'app/layout.tsx', 'app/page.tsx', 'app/not-found.tsx',
      'componentes/Topo.tsx', 'componentes/Rodape.tsx', 'componentes/Faixa.tsx',
      'componentes/Secao.tsx', 'componentes/Linha.tsx', 'componentes/Seta.tsx',
    ];
    for (const arquivo of proibidos) {
      expect(readFileSync(arquivo, 'utf8')).not.toContain('use client');
    }
  });

  it('nenhum hook de cliente vaza para um componente de servidor', () => {
    const fontes = listarFontes('componentes').filter(
      (f) => !f.startsWith(join('componentes', 'heroi')),
    );
    for (const arquivo of fontes) {
      const texto = readFileSync(arquivo, 'utf8');
      for (const hook of ['useState', 'useEffect', 'useRef', 'usePathname', 'useRouter']) {
        expect(texto).not.toContain(hook);
      }
    }
  });
});
```

Este é o teste que protege a promessa da spec §3 — a única que substituiu o
requisito impossível de "zero JS". `componentes/heroi/` ainda não existe; os
testes passam mesmo assim, porque a asserção é sobre ausência.

- [ ] **Step 4: Rodar os três**

```bash
npm test -- tests/build/arvore.test.ts tests/build/links.test.ts tests/build/cliente.test.ts
```

Esperado: todos passando. **Se o de árvore falhar**, compare a lista real com
`HTML_ESPERADOS` e decida qual dos dois está errado — se o export tem um arquivo
legítimo a mais, `lib/rotas.ts` é que precisa mudar, e a mudança precisa de
justificativa escrita no commit.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "verificação: a árvore do export, a integridade dos links e a fronteira de cliente"
```

---

## Tarefa 17: O E2E de acessibilidade, cor e fonte

**Files:**
- Create: `playwright.config.ts`, `tests/support/servidor-estatico.mjs`, `tests/e2e/acessibilidade.spec.ts`, `tests/e2e/marca.spec.ts`
- Test: os dois `.spec.ts`

**Interfaces:**
- Consumes: `ROTAS` de `lib/rotas.ts`; `colors`, `fonts` de `lib/marca.ts`.
- Produces: nada — é tarefa de verificação.

- [ ] **Step 1: Escrever o servidor estático**

`node:http` puro, para não crescer as devDependencies por um servidor de 40 linhas.

`tests/support/servidor-estatico.mjs`:

```js
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const RAIZ = new URL('../../out/', import.meta.url).pathname;
const PORTA = 4173;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.wgsl': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
};

// Resolve como um host real: /rota/ → /rota/index.html, e qualquer coisa que
// não casa cai no 404.html — que é exatamente o que o Cloudflare Pages faz.
function resolver(urlBruta) {
  const caminho = decodeURIComponent((urlBruta ?? '/').split('?')[0]);
  const seguro = normalize(caminho).replace(/^(\.\.[/\\])+/, '');
  let alvo = join(RAIZ, seguro);
  if (existsSync(alvo) && statSync(alvo).isDirectory()) alvo = join(alvo, 'index.html');
  if (!existsSync(alvo)) return { alvo: join(RAIZ, '404.html'), status: 404 };
  return { alvo, status: 200 };
}

createServer((req, res) => {
  const { alvo, status } = resolver(req.url);
  if (!existsSync(alvo)) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('alvo ausente: rode `npm run build` antes dos testes');
    return;
  }
  res.writeHead(status, { 'content-type': TIPOS[extname(alvo)] ?? 'application/octet-stream' });
  createReadStream(alvo).pipe(res);
}).listen(PORTA, () => {
  console.log(`servindo out/ em http://localhost:${PORTA}`);
});
```

- [ ] **Step 2: Escrever `playwright.config.ts`**

Dois projetos: desktop a 1920 e móvel a 390, que são exatamente os dois viewports
que a spec §8 exige. O Chromium é o do sistema — nunca baixar o binário.

`port` e não `url` na checagem de prontidão: o servidor responde 404 em tudo
enquanto `out/` não existir, e a checagem por `url` exige 2xx — o `webServer`
nunca "ficaria pronto" e o erro reportado seria um timeout genérico em vez da
mensagem de alvo ausente.

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
  webServer: {
    command: 'node tests/support/servidor-estatico.mjs',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },
  projects: [
    {
      name: 'desktop-1920',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: { executablePath: '/usr/bin/chromium' },
      },
    },
    {
      name: 'movel-390',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: false,
        launchOptions: { executablePath: '/usr/bin/chromium' },
      },
    },
  ],
});
```

`isMobile: false` de propósito: o Chromium do sistema não traz a emulação de
toque completa, e ligar `isMobile` num projeto de desktop produz falha que vem do
emulador, não do site. O viewport de 390 px é o que importa para o layout.

- [ ] **Step 3: Escrever o E2E de acessibilidade**

`tests/e2e/acessibilidade.spec.ts`:

```ts
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
```

- [ ] **Step 4: Escrever o E2E de cor e fonte**

`tests/e2e/marca.spec.ts`:

```ts
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
```

- [ ] **Step 5: Rodar para ver o estado real**

```bash
npm run build
npx playwright test
```

Esperado: tudo verde. **Dois pontos de atenção reais:**

1. `font-display: optional` pode fazer `document.fonts.check()` devolver `false`
   se o navegador decidir não trocar a fonte. Se os dois testes de fonte falharem
   por isso, a correção é esperar explicitamente o carregamento
   (`await document.fonts.load("300 1rem 'Space Grotesk'")`) antes do `check` —
   não é trocar `optional` por `swap`, que pioraria o CLS.
2. O teste "nenhuma cor de fora da marca" pode pegar o `rgb(0, 0, 0)` padrão de
   algum elemento sem cor declarada. Se pegar, a correção é declarar a cor no
   `base.css`, não relaxar o teste.

- [ ] **Step 6: Acrescentar o script ao `package.json` e commitar**

Confirme que `"test:e2e": "playwright test"` está lá, e:

```bash
git add -A
git commit -m "E2E: axe nas cinco rotas em dois viewports, e a marca medida pelo CSS computado"
```

---

**Continua em `2026-09-24-redesign-zero-parte-5.md`** — Tarefas 18 a 23: o herói WebGPU, o pôster gerado e a medição final.
