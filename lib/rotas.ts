// A tabela de rotas desta rodada. Fonte do menu e dos testes de árvore e de
// integridade de link — se um href não estiver aqui, o teste reprova.

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
  { rota: '/pt/como-e-feito/', arquivo: 'pt/como-e-feito/index.html' },
];

export const ARQUIVO_404 = '404.html';

export const HTML_ESPERADOS: readonly string[] = [
  ARQUIVO_404,
  ...ROTAS.map((r) => r.arquivo),
].sort();

export type ChaveMenu = 'projeto' | 'como-e-feito' | 'devlog' | 'sobre';

export interface ItemMenu {
  readonly rotulo: string;
  readonly href: string | null;
  readonly chave: ChaveMenu;
}

// `devlog` sai com href nulo: a seção "Estado atual" da home declara que a
// página não existe, e prometer ao visitante uma página que não há é pior que
// um item apagado. Vira texto, não link — e sem `aria-disabled`, que num
// <span> sem papel é atributo proibido e o axe reporta.
export const ITENS_MENU: readonly ItemMenu[] = [
  { rotulo: 'o projeto', href: '/pt/#o-que-e', chave: 'projeto' },
  { rotulo: 'como é feito', href: '/pt/como-e-feito/', chave: 'como-e-feito' },
  { rotulo: 'devlog', href: null, chave: 'devlog' },
  { rotulo: 'sobre', href: '/pt/sobre/', chave: 'sobre' },
];
