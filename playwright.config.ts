import { defineConfig, devices } from '@playwright/test';

// Aponta para o Chromium do sistema (/usr/bin/chromium) em vez de deixar o
// Playwright baixar o seu próprio binário (~150 MB). Ver 04_testes/CONTEXT.md
// para a justificativa.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  // Serve out/ com resolução de caminho tipo host real (ver
  // tests/support/servidor-estatico.mjs — não é `serve`, é node:http puro
  // para não crescer devDependencies). Sobe mesmo com out/ ausente: cada
  // teste checa a ausência do alvo explicitamente antes de navegar, para que
  // a mensagem de falha diga "alvo ausente" e não "conexão recusada".
  // `port`, não `url`: a checagem de prontidão por `url` do Playwright exige
  // 2xx, e o servidor responde 404 em tudo enquanto out/ não existir — o que
  // faria o webServer nunca "ficar pronto" e o erro reportado seria um
  // timeout genérico do Playwright, não a mensagem de alvo ausente que os
  // testes escrevem. `port` só confere que algo escuta a porta.
  webServer: {
    command: 'node tests/support/servidor-estatico.mjs',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },
  projects: [
    {
      name: 'chromium-sistema',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: '/usr/bin/chromium',
        },
      },
    },
  ],
});
