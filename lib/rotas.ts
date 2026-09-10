// A tabela de rotas desta spec — fonte do roteador e dos testes.
// `sistemas/01_publicacao/features/02_esqueleto-publicado/04_plano.md`, seção Interfaces.

export const IDIOMAS = ['pt'] as const;

export type Idioma = (typeof IDIOMAS)[number];

export interface Rota {
  readonly rota: string;
  readonly arquivo: string;
}

export const ROTAS: readonly Rota[] = [
  { rota: '/', arquivo: 'index.html' },
  { rota: '/pt/', arquivo: 'pt/index.html' },
];

export const ARQUIVO_404 = '404.html';

export const HTML_ESPERADOS: readonly string[] = [
  ARQUIVO_404,
  ...ROTAS.map((r) => r.arquivo),
].sort();

// Rotas declaradas na spec mas não entregues nesta rodada. Não entram em
// ROTAS nem em HTML_ESPERADOS — servem de referência para os testes que
// provam que nada aponta para elas antes da hora.
export const ROTAS_PENDENTES: readonly Rota[] = [
  { rota: '/pt/sobre/', arquivo: 'pt/sobre/index.html' },
];
