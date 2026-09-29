import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Guarda de deriva de configuração, na mesma linha do guarda de tokens: a
// correção I5 ligou `checkJs`, e a razão de existir um teste para uma linha de
// JSON é que o Next 16 REESCREVE `tsconfig.json` a cada `next build` (ele
// acrescenta `.next/dev/types` ao `include`). A reescrita é idempotente hoje e
// preserva `compilerOptions`, mas se uma versão futura normalizar o arquivo e
// derrubar a flag, o sintoma seria o pior possível: `npm run typecheck` volta a
// passar por não checar mais nada, e a próxima divergência de API dentro de um
// `.mjs` volta a aparecer só no navegador do visitante — foi exatamente o
// caminho da divergência 3 (Ruling AA), que bloqueou a Tarefa 19.
const compilerOptions = (arquivo: string) =>
  JSON.parse(readFileSync(arquivo, 'utf8')).compilerOptions as Record<string, unknown>;

describe('as duas árvores de tipo', () => {
  it('checam JavaScript, não só TypeScript', () => {
    const producao = compilerOptions('tsconfig.json');
    expect(producao.allowJs).toBe(true);
    expect(producao.checkJs).toBe(true);
  });

  it('a árvore de testes herda a checagem em vez de redeclará-la', () => {
    const testes = JSON.parse(readFileSync('tsconfig.tests.json', 'utf8'));
    expect(testes.extends).toBe('./tsconfig.json');
    // Não redeclarar é o ponto: duas verdades sobre `checkJs` é como uma delas
    // fica para trás. `ferramentas/` e `tests/support/` só entram no programa
    // por este arquivo, então é ele quem leva a checagem até os `.mjs` de lá.
    expect(testes.compilerOptions?.checkJs).toBeUndefined();
    expect(testes.include).toContain('ferramentas');
    expect(testes.include).toContain('tests');
  });
});
