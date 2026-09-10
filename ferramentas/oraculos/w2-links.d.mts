export interface LinkExtra {
  readonly de: string;
  readonly href: string;
}

export interface ResultadoMedicao {
  readonly ok: boolean;
  readonly violacoes: string[];
  readonly detalhe?: object;
}

export function medirW2(args: {
  raiz: string;
  extra?: readonly LinkExtra[];
}): Promise<ResultadoMedicao>;
