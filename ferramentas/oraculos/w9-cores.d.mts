import type { Page } from '@playwright/test';

export interface ResultadoMedicao {
  readonly ok: boolean;
  readonly violacoes: string[];
  readonly detalhe?: object;
}

export function medirW9(args: {
  page: Page;
  rotas: readonly string[] | null;
}): Promise<ResultadoMedicao>;
