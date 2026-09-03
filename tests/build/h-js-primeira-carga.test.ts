import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { brotliCompressSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { exigirDiretorio, listarArquivos, OUT, RAIZ } from '../support/out';

// H — 02_spec.md + 03_oraculo.md ("H — número registrado vira teto"): soma
// brotli dos .js REFERENCIADOS por out/pt/index.html (não out/_next/static/**
// inteiro, que sobrecontaria chunks de outras rotas), ≤ 130 000 B. Mais:
// grep -rl "use client" em app/ e components/ devolve vazio.
const TETO_JS_BROTLI = 130_000; // congelado (03_oraculo.md)

describe('H — zero JavaScript de aplicação na primeira carga (W3, linha do JS)', () => {
  it('soma brotli dos <script src> referenciados por out/pt/index.html ≤ 130 000 B', () => {
    exigirDiretorio(OUT);
    const pagina = join(OUT, 'pt', 'index.html');
    if (!existsSync(pagina)) {
      throw new Error(`alvo ausente: '${pagina}' não existe.`);
    }
    const html = readFileSync(pagina, 'utf8');
    const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]!);

    let total = 0;
    for (const src of scripts) {
      // PREFIXO é '' hoje (decisão 1, spec); um basePath futuro exigiria
      // strip do prefixo aqui — fora de escopo desta rodada.
      const caminhoLocal = join(OUT, src.replace(/^\//, ''));
      total += brotliCompressSync(readFileSync(caminhoLocal)).length;
    }
    expect(total).toBeLessThanOrEqual(TETO_JS_BROTLI);
  });

  it('grep -rl "use client" em app/ e components/ devolve vazio', () => {
    // Decisão desta rodada: grep sobre diretório ausente NÃO é "zero
    // ocorrências" — é "não há o que grepar". Um app/ inexistente passaria
    // vacuamente nesta asserção se não fosse por este guard, o que seria
    // exatamente um teste que passa antes do código existir.
    for (const dir of ['app', 'components']) {
      const caminho = join(RAIZ, dir);
      if (!existsSync(caminho)) {
        throw new Error(
          `alvo ausente: '${dir}/' não existe. Esta rodada (portão 04) não ` +
            "escreve app/ nem components/ — 'grep vazio' sobre diretório " +
            'inexistente não é o mesmo que "nenhum use client encontrado".'
        );
      }
    }

    const comUseClient: string[] = [];
    for (const dir of ['app', 'components']) {
      for (const arquivo of listarArquivos(join(RAIZ, dir))) {
        if (/\.(tsx?|jsx?)$/.test(arquivo)) {
          const conteudo = readFileSync(arquivo, 'utf8');
          if (conteudo.includes("'use client'") || conteudo.includes('"use client"')) {
            comUseClient.push(arquivo);
          }
        }
      }
    }
    expect(comUseClient).toEqual([]);
  });
});
