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
  { rota: '/pt/sobre/', arquivo: 'pt/sobre/index.html' },
];

export const ARQUIVO_404 = '404.html';

export const HTML_ESPERADOS: readonly string[] = [
  '404.html',
  'index.html',
  'pt/index.html',
  'pt/sobre/index.html',
].sort();

// Rotas declaradas na spec mas não entregues nesta rodada. Não entram em
// ROTAS nem em HTML_ESPERADOS — servem de referência para os testes que
// provam que nada aponta para elas antes da hora.
// Vazio: `/pt/sobre/` deixou de ser pendente e passou a ser entregue.
export const ROTAS_PENDENTES: readonly Rota[] = [];
