import { defineConfig, devices } from '@playwright/test';

// `tests/e2e/heroi-pintando.spec.ts` só faz sentido headed, e os dois projetos
// headless precisam ignorá-lo explicitamente — sem isto ele rodaria três vezes,
// duas delas num ambiente onde o canvas nunca pinta.
const SO_HEADED = /heroi-pintando\.spec\.ts/;

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
      testIgnore: SO_HEADED,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: { executablePath: '/usr/bin/chromium' },
      },
    },
    {
      name: 'movel-390',
      testIgnore: SO_HEADED,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: false,
        launchOptions: { executablePath: '/usr/bin/chromium' },
      },
    },
    // O único projeto headed, e o único em que o herói realmente pinta (I9).
    // Em headless `navigator.gpu` existe mas `requestAdapter()` devolve `null`,
    // então os 37 testes dos dois projetos acima nunca exercitaram o caminho de
    // pintura — descoberta de `ferramentas/capturar-poster.md`. Este projeto
    // aponta um Chromium headed para o X real da máquina; o arquivo que ele roda
    // faz `test.skip` quando `DISPLAY` está ausente, para que a suíte continue
    // rodando em CI sem display em vez de ficar vermelha por falta de hardware.
    {
      name: 'headed-webgpu',
      testMatch: SO_HEADED,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        headless: false,
        launchOptions: { executablePath: '/usr/bin/chromium' },
      },
    },
  ],
});
