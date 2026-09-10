export interface ResultadoMedicao {
  readonly ok: boolean;
  readonly violacoes: string[];
}

export function medirW1(args: { raiz: string; url: string }): Promise<ResultadoMedicao>;
