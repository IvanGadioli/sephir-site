export interface DetalheW8 {
  readonly sentinelaPrefixados: number;
  readonly sentinelaTotal: number;
  readonly outTotal: number;
}

export interface ResultadoW8 {
  readonly ok: boolean;
  readonly violacoes: string[];
  readonly detalhe: DetalheW8;
}

export function medirW8(args: {
  raizOut: string;
  raizSentinela: string;
}): ResultadoW8;
