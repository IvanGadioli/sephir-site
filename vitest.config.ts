import { defineConfig } from 'vitest/config';

// Só os testes de sistema de arquivos (vitest puro) entram aqui. Os testes
// que precisam de navegador vivem em tests/e2e/ e rodam por `playwright test`
// (ver playwright.config.ts) — vitest não os enxerga.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/build/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    // 5 min. Não é folga para teste lento: `verificar` no caminho feliz leva
    // ~65 s porque o oráculo do portão 03 exige 5 execuções do Lighthouse com
    // mediana, mais três passadas de navegador. Com 30 s o teste expirava antes
    // de a medição terminar — vermelho do runner, não do site. Baixar as 5
    // execuções para caber no timeout seria trocar teto por sorte, e é
    // proibido (`adr-fab-003`); o que cede é o relógio do runner.
    testTimeout: 300_000,
    hookTimeout: 600_000,
    // Vários arquivos de tests/build/ rodam `npm run build` no próprio
    // beforeAll, e prefixo.test.ts roda três builds em sequência. Em paralelo
    // eles disputam out/ e .next/, e o resultado é falha intermitente que não
    // vem do site — vem do runner medindo a si mesmo. Serializado de propósito:
    // a suíte é pequena e o custo de esperar é menor que o de um vermelho que
    // ninguém consegue reproduzir.
    fileParallelism: false,
  },
});
