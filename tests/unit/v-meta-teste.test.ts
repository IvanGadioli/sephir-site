import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RAIZ } from '../support/out';
import { fixturaWebp } from '../support/webp';

/*
 * V — 03_oraculo.md: "exit 0 não basta; a suíte precisa saber reprovar."
 * Cinco defeitos injetados, um por oráculo declarado (W1, W2, W6, W8) mais o
 * do out/ ausente. Cinco execuções, cinco códigos != 0, cada uma nomeando o
 * oráculo que reprovou.
 *
 * Decisão desta rodada, que nem a spec nem o oráculo fixam (registrar em
 * 04_testes/CONTEXT.md): `verificar` lê o diretório alvo de
 * `process.env.ALVO_OUT` (default 'out'), para este meta-teste apontar para
 * uma fixture isolada em vez de mutar o `out/` real que A/F/G/H também leem
 * — mutar o out/ compartilhado seria uma corrida entre arquivos de teste.
 *
 * `verificar` não existe hoje: nenhum script `verificar` em package.json,
 * nenhum scripts/verificar.mjs. A asserção não pode ser só "exit code != 0"
 * — isso passaria por acidente com o erro genérico do npm ("Missing
 * script"), que é exatamente um teste que passa sem testar nada. Por isso
 * cada caso também exige que a SAÍDA nomeie o oráculo esperado.
 *
 * Simplificação assumida: o defeito 4 do oráculo ("hardcodar um caminho no
 * build-sentinela") é sobre um build com PREFIXO='/__pfx' — este meta-teste
 * não builda nada, só mutila uma fixture estática. A fixture não tem
 * sentinela; o defeito 4 aqui é aproximado por um link interno hardcoded
 * comum, sob o rótulo W8. Refinar quando `verificar` existir (portão 05).
 */

function montarFixturaValida(dir: string): void {
  mkdirSync(join(dir, 'pt', 'sobre'), { recursive: true });
  mkdirSync(join(dir, 'poster'), { recursive: true });
  writeFileSync(
    join(dir, 'index.html'),
    '<!doctype html><html><head>' +
      '<meta http-equiv="refresh" content="0; url=/pt/">' +
      '</head><body><a href="/pt/">continuar</a></body></html>'
  );
  writeFileSync(
    join(dir, 'pt', 'index.html'),
    '<!doctype html><html><body><h1>Iniciativa Sephir</h1>' +
      '<a href="/pt/sobre/">sobre</a><img src="/poster/heroi.webp" width="1600" height="900" alt="pôster"></body></html>'
  );
  writeFileSync(
    join(dir, 'pt', 'sobre', 'index.html'),
    '<!doctype html><html><body>Sephir Studio Inova Simples (I.S.), CNPJ 63.037.641/0001-30</body></html>'
  );
  writeFileSync(join(dir, '404.html'), '<!doctype html><html><body>404</body></html>');
  writeFileSync(join(dir, 'poster', 'heroi.webp'), fixturaWebp(1600, 900));
}

function rodarVerificar(alvo: string): { codigo: number; saida: string } {
  try {
    const saida = execFileSync('npm', ['run', 'verificar'], {
      cwd: RAIZ,
      env: { ...process.env, ALVO_OUT: alvo },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { codigo: 0, saida };
  } catch (erro: unknown) {
    const e = erro as { status?: number; stdout?: string; stderr?: string };
    return {
      codigo: typeof e.status === 'number' ? e.status : 1,
      saida: `${e.stdout ?? ''}${e.stderr ?? ''}`,
    };
  }
}

describe('V — npm run verificar se declara parcial e sabe reprovar (meta-teste, 5 de 5)', () => {
  let base: string;
  const copias: string[] = [];

  beforeAll(() => {
    base = mkdtempSync(join(tmpdir(), 'sephir-v-base-'));
    montarFixturaValida(base);
  });

  afterAll(() => {
    rmSync(base, { recursive: true, force: true });
    for (const c of copias) rmSync(c, { recursive: true, force: true });
  });

  function comCopiaMutada(mutar: (dir: string) => void): string {
    const copia = mkdtempSync(join(tmpdir(), 'sephir-v-caso-'));
    cpSync(base, copia, { recursive: true });
    mutar(copia);
    copias.push(copia);
    return copia;
  }

  it('defeito 1 — falta pt/sobre/index.html ⇒ reprova nomeando W1', () => {
    const dir = comCopiaMutada((d) => rmSync(join(d, 'pt', 'sobre', 'index.html')));
    const { codigo, saida } = rodarVerificar(dir);
    expect(codigo).not.toBe(0);
    expect(saida).toMatch(/W1/);
  });

  it('defeito 2 — href interno para lugar nenhum ⇒ reprova nomeando W2', () => {
    const dir = comCopiaMutada((d) =>
      writeFileSync(
        join(d, 'pt', 'index.html'),
        '<!doctype html><html><body><a href="/pt/nao-existe/">quebrado</a></body></html>'
      )
    );
    const { codigo, saida } = rodarVerificar(dir);
    expect(codigo).not.toBe(0);
    expect(saida).toMatch(/W2/);
  });

  it('defeito 3 — poster/heroi.webp removido ⇒ reprova nomeando W6', () => {
    const dir = comCopiaMutada((d) => rmSync(join(d, 'poster', 'heroi.webp')));
    const { codigo, saida } = rodarVerificar(dir);
    expect(codigo).not.toBe(0);
    expect(saida).toMatch(/W6/);
  });

  it('defeito 4 — caminho interno hardcodado (aproxima o build-sentinela de G) ⇒ reprova nomeando W8', () => {
    const dir = comCopiaMutada((d) =>
      writeFileSync(
        join(d, 'pt', 'index.html'),
        '<!doctype html><html><body><h1>Iniciativa Sephir</h1>' +
          '<a href="/pt/sobre/">sobre</a><img src="hardcoded/heroi.webp" width="1600" height="900" alt="pôster"></body></html>'
      )
    );
    const { codigo, saida } = rodarVerificar(dir);
    expect(codigo).not.toBe(0);
    expect(saida).toMatch(/W8/);
  });

  it('defeito 5 — alvo ausente (sem out/) ⇒ reprova dizendo que o alvo não existe, não nomeando um oráculo', () => {
    const inexistente = join(tmpdir(), `sephir-v-inexistente-${Date.now()}`);
    const { codigo, saida } = rodarVerificar(inexistente);
    expect(codigo).not.toBe(0);
    expect(saida.toLowerCase()).toMatch(/(não existe|ausente|enoent|no such file)/);
  });
});
