import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const medir = (formato: string) =>
  execFileSync('magick', ['public/poster/heroi.webp', '-format', formato, 'info:'])
    .toString()
    .trim();

describe('o pôster do herói', () => {
  it('existe', () => {
    expect(() => statSync('public/poster/heroi.webp')).not.toThrow();
  });

  it('cabe no orçamento de peso: até 60 kB', () => {
    // O pôster atual tem 35 372 B. O gerado pode crescer — um buraco negro com
    // disco tem mais detalhe que uma nebulosa difusa — mas não sem limite: ele é
    // o fallback do herói e é baixado por todo visitante, com ou sem WebGPU.
    //
    // O teto NÃO é orçamento de LCP. A revisão final (I3) mediu que o elemento
    // de LCP desta branch é o <h1>, não o pôster: `.heroi { min-height: 100svh }`
    // faz o Chromium tratar a imagem como fundo de página e a tira da disputa.
    // O teto continua valendo como higiene de peso; a razão escrita antes não
    // se sustentava.
    expect(statSync('public/poster/heroi.webp').size).toBeLessThan(61_440);
  });

  it('tem 1280×726, a largura do pôster anterior', () => {
    // Largura travada por decisão do coordenador, para paridade com o pôster do
    // main. Não é por causa do LCP — ver o comentário do teto de peso acima.
    expect(medir('%wx%h')).toBe('1280x726');
  });

  it('é opaco: sem canal alfa', () => {
    // Não é otimização, é contrato. `-alpha off` no ImageMagick quebrava a cor
    // no Chromium E inflava o arquivo (ver ferramentas/capturar-poster.md,
    // achado 1). O teto de bytes sozinho não pega a reintrodução de alfa.
    expect(medir('%A')).toBe('Undefined');
  });

  it('não é um retângulo preto', () => {
    // `screenshot` pode ter sucesso com o WebGPU falhado e devolver tela preta.
    // O desvio-padrão do arquivo PUBLICADO é a prova, e ela precisa viver aqui
    // e não só num relatório: teste que roda sempre vale mais que número anotado
    // uma vez. Medido em 0,188 no arquivo atual; o piso é folgado de propósito.
    expect(Number(medir('%[fx:standard_deviation]'))).toBeGreaterThan(0.05);
  });
});
