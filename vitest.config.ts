import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/build/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    // Vários arquivos de tests/build/ rodam `npm run build` no beforeAll. Em
    // paralelo disputam out/ e .next/, e o vermelho vem do runner, não do site.
    fileParallelism: false,
    testTimeout: 300_000,
    hookTimeout: 600_000,
  },
});
