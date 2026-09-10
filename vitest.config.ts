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
    // Vários arquivos de tests/build/ rodam `npm run build` no próprio
    // beforeAll, e prefixo.test.ts roda três builds em sequência. Em paralelo
    // eles disputam out/ e .next/, e o resultado é falha intermitente que não
    // vem do site — vem do runner medindo a si mesmo. Serializado de propósito:
    // a suíte é pequena e o custo de esperar é menor que o de um vermelho que
    // ninguém consegue reproduzir.
    fileParallelism: false,
  },
});
