import { describe, expect, it } from 'vitest';
import { listarHtml, OUT, OUT_SENTINELA } from '../support/out';

// C — 03_oraculo.md: a prova é diferencial, contra a SAÍDA, não por inspeção
// do fonte. out-sentinela/ já é o build com IDIOMAS=['pt','en'] (mesmo build
// que serve G, por sanção explícita do oráculo: "as duas mutações são
// independentes e as duas asserções são disjuntas"). Comparado contra out/
// (build padrão, só 'pt'), a diferença simétrica restrita a .html tem que
// ser exatamente {en/index.html} — restrita porque o payload RSC
// (en/index.txt) aparece junto, e W1 conta só .html.
describe('C — generateStaticParams deriva de IDIOMAS (diferencial, W1)', () => {
  it("diferença simétrica dos .html entre out/ (pt) e out-sentinela/ (pt,en) é {'en/index.html'}", () => {
    const base = listarHtml(OUT);
    const doisIdiomas = listarHtml(OUT_SENTINELA);

    const soNoBase = [...base].filter((h) => !doisIdiomas.has(h));
    const soNosDoisIdiomas = [...doisIdiomas].filter((h) => !base.has(h));

    expect(soNoBase).toEqual([]);
    expect(soNosDoisIdiomas).toEqual(['en/index.html']);
  });
});
