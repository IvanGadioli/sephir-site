import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exigirDiretorio, OUT } from '../support/out';
import { dimensoesWebp } from '../support/webp';

// F/I — 03_oraculo.md, "F e I": 150 kB vira 150 000 B (o menor dos dois, kB é
// ambíguo); peso e dimensão são RECHECADOS sobre out/poster/heroi.webp por
// `verificar`, não só conferidos dentro de scripts/poster.mjs antes de
// gravar — porque o .webp é commitado à mão e nunca mais medido depois disso.
const POSTER = join(OUT, 'poster', 'heroi.webp');
const TETO_BYTES = 150_000; // congelado (03_oraculo.md, "Números congelados até o portão 06")

describe('F/I — out/poster/heroi.webp: peso e dimensão (W3, linha do pôster)', () => {
  it(`existe, ≤ ${TETO_BYTES} B, e é exatamente 1600×900`, () => {
    exigirDiretorio(OUT);
    if (!existsSync(POSTER)) {
      throw new Error(
        `alvo ausente: '${POSTER}' não existe. Caso de borda da spec ` +
          '("pôster ausente no build"): o build passa, o W6 reprova — mas este ' +
          'teste de peso/dimensão não tem o que medir sem o arquivo.'
      );
    }
    const info = statSync(POSTER);
    expect(info.size).toBeLessThanOrEqual(TETO_BYTES);

    const { largura, altura } = dimensoesWebp(readFileSync(POSTER));
    expect({ largura, altura }).toEqual({ largura: 1600, altura: 900 });
  });

  // 03_oraculo.md, "F, 'é o LCP' e 'não desloca layout'": as duas afirmações
  // são W4 e W4 está adiado. O que sobra medível é o texto de
  // out/pt/index.html — guarda de regressão CONTRA O FRAMEWORK (next/image
  // põe loading="lazy" por padrão), não oráculo.
  it(
    'a <img> do pôster em out/pt/index.html declara width/height, tem alt não vazio, ' +
      'e não tem loading="lazy" (guarda de regressão, não oráculo — W4 é a feature seguinte)',
    () => {
      exigirDiretorio(OUT);
      const pagina = join(OUT, 'pt', 'index.html');
      if (!existsSync(pagina)) {
        throw new Error(`alvo ausente: '${pagina}' não existe.`);
      }
      const html = readFileSync(pagina, 'utf8');
      const tag = html.match(/<img[^>]*heroi\.webp[^>]*>/i)?.[0];
      if (!tag) {
        throw new Error('nenhuma <img> referenciando heroi.webp encontrada em out/pt/index.html');
      }
      expect(tag).toMatch(/\bwidth="1600"/);
      expect(tag).toMatch(/\bheight="900"/);
      expect(tag).toMatch(/\balt="[^"]+"/);
      expect(tag).not.toMatch(/loading="lazy"/);
    }
  );
});
