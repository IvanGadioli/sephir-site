import type { Page } from '@playwright/test';

export interface EntradaIncompleta {
  readonly rota: string;
  readonly regra: string;
  readonly impacto: string | null;
  readonly alvo: unknown;
  readonly html: string;
  readonly resumo: string | null;
}

export interface ResultadoMedicao {
  readonly ok: boolean;
  readonly violacoes: string[];
  readonly detalhe: {
    readonly incomplete: EntradaIncompleta[];
    readonly outrosImpactos: string[];
  };
}

export function medirW5(args: {
  page: Page;
  rotas: readonly string[];
  regras?: readonly string[];
}): Promise<ResultadoMedicao>;
