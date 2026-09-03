import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exigirDiretorio, OUT } from '../support/out';

// E — 02_spec.md: "o teste procura o CNPJ no HTML". 03_oraculo.md é honesto
// sobre o limite disso: prova que o dado não sumiu, não que está certo — "os
// dois podem estar errados juntos". A correção do valor é humana, uma vez,
// contra o registro da Inova Simples (03_oraculo.md, "E, o CNPJ"). Esta
// asserção fica como guarda contra apagamento, com o rótulo certo.
const CNPJ = '63.037.641/0001-30';

describe('E — CNPJ do proponente em out/pt/sobre/index.html (sem oráculo, guarda contra apagamento)', () => {
  it(`contém a string literal '${CNPJ}'`, () => {
    exigirDiretorio(OUT);
    const pagina = join(OUT, 'pt', 'sobre', 'index.html');
    if (!existsSync(pagina)) {
      throw new Error(`alvo ausente: '${pagina}' não existe.`);
    }
    const html = readFileSync(pagina, 'utf8');
    expect(html).toContain(CNPJ);
  });
});
