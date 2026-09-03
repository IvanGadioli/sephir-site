// Infra de teste (portão 04) — leitor de dimensão WebP a partir do cabeçalho
// RIFF, sem decodificar pixels. Cobre os três layouts de chunk que o cwebp
// pode emitir: VP8X (estendido), VP8L (sem perdas) e VP8 (com perdas simples).
// Usado por F/I (tests/build/f-poster-peso-dimensao.test.ts) e para montar a
// fixture do meta-teste V.

export type DimensoesWebp = { largura: number; altura: number };

export function dimensoesWebp(buf: Buffer): DimensoesWebp {
  if (
    buf.length < 30 ||
    buf.toString('ascii', 0, 4) !== 'RIFF' ||
    buf.toString('ascii', 8, 12) !== 'WEBP'
  ) {
    throw new Error('não é um arquivo WebP (assinatura RIFF/WEBP ausente)');
  }
  const fourCC = buf.toString('ascii', 12, 16);

  if (fourCC === 'VP8X') {
    const largura = 1 + buf.readUIntLE(24, 3);
    const altura = 1 + buf.readUIntLE(27, 3);
    return { largura, altura };
  }

  if (fourCC === 'VP8L') {
    if (buf[20] !== 0x2f) throw new Error('assinatura VP8L inválida');
    const b0 = buf[21]!;
    const b1 = buf[22]!;
    const b2 = buf[23]!;
    const b3 = buf[24]!;
    const largura = 1 + (((b1 & 0x3f) << 8) | b0);
    const altura = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | (b1 >> 6));
    return { largura, altura };
  }

  if (fourCC === 'VP8 ') {
    const largura = buf.readUInt16LE(26) & 0x3fff;
    const altura = buf.readUInt16LE(28) & 0x3fff;
    return { largura, altura };
  }

  throw new Error(`chunk WebP desconhecido: '${fourCC}'`);
}

/** Monta um WebP VP8X sintético só com o cabeçalho de dimensão correto —
 *  usado como fixture (não é imagem real; ninguém a decodifica nesta rodada). */
export function fixturaWebp(largura: number, altura: number, tamanhoAlvo = 2000): Buffer {
  const larguraMenos1 = largura - 1;
  const alturaMenos1 = altura - 1;
  const payload = Buffer.alloc(10);
  payload.writeUIntLE(0, 0, 1); // flags: nenhuma feature estendida
  payload.writeUIntLE(larguraMenos1, 4, 3);
  payload.writeUIntLE(alturaMenos1, 7, 3);
  const vp8xChunk = Buffer.concat([Buffer.from('VP8X'), u32le(payload.length), payload]);
  const padding = Buffer.alloc(Math.max(0, tamanhoAlvo - 20 - vp8xChunk.length));
  const riffPayload = Buffer.concat([Buffer.from('WEBP'), vp8xChunk, padding]);
  return Buffer.concat([Buffer.from('RIFF'), u32le(riffPayload.length), riffPayload]);
}

function u32le(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
}
