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

  it('cabe no orçamento do LCP: até 60 kB', () => {
    // O pôster atual tem 35 372 B. O gerado pode crescer — um buraco negro com
    // disco tem mais detalhe que uma nebulosa difusa, então pode crescer — mas
    // não sem limite: ele é o elemento de LCP e entra no caminho crítico.
    expect(statSync('public/poster/heroi.webp').size).toBeLessThan(61_440);
  });

  it('tem 1280×726, a largura do pôster anterior', () => {
    // Largura travada por decisão do coordenador: o pôster é o elemento de LCP,
    // e servir imagem maior inflaria o número que a Tarefa 23 compara contra o main.
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
