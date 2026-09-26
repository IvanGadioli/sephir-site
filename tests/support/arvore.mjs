import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// Caminhador de diretório da suíte de build. Existiam QUATRO implementações
// independentes de `readdirSync` + `statSync` + recursão nesta branch — achado
// I7 da revisão final —, escritas por tarefas que nunca viram uma à outra. A
// duplicação não era o problema: o problema é que a armadilha era a mesma nas
// quatro e já tinha sido paga uma vez, em `ferramentas/medir.mjs` (Tarefa 21).
//
// As três cópias de `tests/build/` escapavam do bug por ACIDENTE: chamavam
// `relative('out', caminho)` com o literal `'out'`, enquanto a função recebia
// `raiz` como parâmetro. Parâmetro e literal eram dois nomes para a mesma
// coisa, e nada ligava um ao outro — `listarHtml('baseline-main-ed68bd4')`, a
// coisa mais natural a fazer com essa função, devolvia
// `../baseline-main-ed68bd4/pt/index.html` como rótulo e o `toEqual` falhava
// com uma mensagem que parece diferença de conteúdo.
//
// Aqui é correto por construção, com o mesmo mecanismo do `medir.mjs`: `base`
// fixa a raiz que o CHAMADOR pediu através da recursão. Sem ele, a chamada
// recursiva promove o subdiretório a raiz e `relative(raiz, caminho)` devolve
// só o nome do arquivo, perdendo o prefixo de diretório para tudo além do
// primeiro nível (`pt/sobre/index.html` vira `index.html`).
//
// Duas cópias, não uma: `ferramentas/medir.mjs` tem a sua, porque é ferramenta
// de produção e não deve importar de `tests/`. Aquela cópia carrega o
// comentário da armadilha e uma referência a este arquivo.

/**
 * @param {string} raiz
 * @param {(nome: string) => boolean} filtro recebe o NOME da entrada, não o caminho
 * @param {string} [base] uso interno da recursão — não passar
 * @returns {string[]} caminhos relativos a `raiz`, na ordem de leitura do fs
 */
export function listar(raiz, filtro, base = raiz) {
  /** @type {string[]} */
  const achados = [];
  for (const entrada of readdirSync(raiz)) {
    const caminho = join(raiz, entrada);
    if (statSync(caminho).isDirectory()) achados.push(...listar(caminho, filtro, base));
    else if (filtro(entrada)) achados.push(relative(base, caminho));
  }
  return achados;
}

/**
 * Como `listar`, mas devolvendo caminhos utilizáveis a partir do cwd (com o
 * prefixo da raiz), que é o que quem vai abrir o arquivo precisa.
 * @param {string} raiz
 * @param {(nome: string) => boolean} filtro
 * @returns {string[]}
 */
export function listarCaminhos(raiz, filtro) {
  return listar(raiz, filtro).map((rel) => join(raiz, rel));
}

/**
 * @param {string} raiz
 * @returns {string[]} os `.html` de `raiz`, ordenados — a forma que a
 * comparação por igualdade estrita contra `HTML_ESPERADOS` precisa.
 */
export function listarHtml(raiz) {
  return listar(raiz, (nome) => nome.endsWith('.html')).sort();
}

/**
 * Toda extensão distinta presente na árvore, em minúsculas e com o ponto.
 * Arquivo sem ponto no nome entra como `''` — e é o caso que mais interessa
 * pegar, porque é como um `_redirects` ou um `_headers` apareceria.
 * @param {string} raiz
 * @returns {string[]} ordenadas
 */
export function extensoes(raiz) {
  const vistas = new Set(
    listar(raiz, () => true).map((rel) => {
      const nome = rel.slice(rel.lastIndexOf('/') + 1);
      const ponto = nome.lastIndexOf('.');
      return ponto <= 0 ? '' : nome.slice(ponto).toLowerCase();
    }),
  );
  return [...vistas].sort();
}
