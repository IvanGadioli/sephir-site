import { describe, expect, it } from 'vitest';
import { OUT, listarHtml } from '../support/out';

// A — 02_spec.md: "o build produz exatamente quatro documentos".
// Oráculo (W1): igualdade de CONJUNTO, não contagem — falta e sobra reprovam
// igual. Não afrouxar para "contém", mesmo que next@16.3.4 emita um quinto
// .html (404/index.html é o candidato registrado no oráculo) — isso é
// apuração de portão 06, não relaxamento de teste (ver CONTEXT.md).
const ESPERADO = new Set(['index.html', 'pt/index.html', 'pt/sobre/index.html', '404.html']);

describe('A — out/ contém exatamente os quatro documentos (W1)', () => {
  it('o conjunto de .html em out/ é igual ao conjunto esperado — sem faltar, sem sobrar', () => {
    // listarHtml lança AlvoAusenteError se out/ não existir — a suíte não
    // roda com falha silenciosa (0 arquivos == 0 esperados por acidente).
    const obtido = listarHtml(OUT);
    const faltando = [...ESPERADO].filter((h) => !obtido.has(h)).sort();
    const sobrando = [...obtido].filter((h) => !ESPERADO.has(h)).sort();
    expect({ faltando, sobrando }).toEqual({ faltando: [], sobrando: [] });
  });
});
