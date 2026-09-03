import { defineConfig } from 'vitest/config';

// Só os testes de sistema de arquivos (vitest puro) entram aqui. Os testes
// que precisam de navegador vivem em tests/e2e/ e rodam por `playwright test`
// (ver playwright.config.ts) — vitest não os enxerga.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/build/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
