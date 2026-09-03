import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listarHtml, OUT_SENTINELA } from '../support/out';

// G — 03_oraculo.md: o W8 sobre out/ com PREFIXO='' é vazio por construção
// (href="/pt/" escrito à mão e caminho('/pt/') produzem bytes idênticos). O
// substituto é o build-sentinela: buildar com PREFIXO='/__pfx' (script
// `build:sentinela` no package.json, decisão desta rodada — não fixada nem
// pela spec nem pelo oráculo) e exigir que todo href/src interno absoluto em
// out-sentinela/**.html carregue o sentinela. Exclusões declaradas: https:,
// mailto:, #, e qualquer coisa sob /__pfx/_next/ (prefixado pelo Next, não
// pelo nosso helper).
const EXCLUSOES: RegExp[] = [/^https?:/, /^mailto:/, /^#/];

function extrairCaminhosInternos(html: string): string[] {
  const regex = /\s(?:href|src)="([^"]*)"/g;
  const achados: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html))) achados.push(m[1]!);
  return achados.filter((v) => v.startsWith('/') && !v.startsWith('//') && !EXCLUSOES.some((r) => r.test(v)));
}

describe('G — build-sentinela: todo caminho interno passa pelo helper (W8)', () => {
  it('zero href/src interno em out-sentinela/**.html fora de /__pfx/', () => {
    const htmls = [...listarHtml(OUT_SENTINELA)];
    const violacoes: string[] = [];
    for (const rel of htmls) {
      const conteudo = readFileSync(join(OUT_SENTINELA, rel), 'utf8');
      for (const caminho of extrairCaminhosInternos(conteudo)) {
        if (!caminho.startsWith('/__pfx/')) violacoes.push(`${rel}: ${caminho}`);
      }
    }
    expect(violacoes).toEqual([]);
  });
});
