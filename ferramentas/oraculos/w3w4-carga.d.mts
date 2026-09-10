export interface Bytes {
  readonly html: number;
  readonly css: number;
  readonly js: number;
  readonly poster: number;
  readonly total: number;
}

export interface Tempo {
  readonly lcp: number;
  readonly cls: number;
  readonly tbt: number;
}

export interface ResultadoMedicao {
  readonly ok: boolean;
  readonly codigo: 0 | 1 | 3;
  readonly violacoes: string[];
  readonly detalhe:
    | { readonly bytes: Bytes; readonly tempo: Tempo; readonly excluidos: string[] }
    | Record<string, never>;
}

export function medirW3W4(args: {
  url: string;
  rota: string;
  semCompressao?: boolean;
}): Promise<ResultadoMedicao>;
