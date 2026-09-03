// Infra de teste (portão 04) — não é código de aplicação. Nada aqui é
// importado por app/, lib/ ou components/; existe só para os testes lerem
// `out/` sem repetir a mesma checagem de "alvo ausente" em cada arquivo.
import { existsSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const RAIZ = process.cwd();
export const OUT = join(RAIZ, 'out');
export const OUT_SENTINELA = join(RAIZ, 'out-sentinela');

/**
 * Erro deliberadamente distinto de uma asserção de conteúdo. Caso de borda da
 * spec ("build sem out/"): "todo teste reprova por ausência do alvo, não por
 * conteúdo — a mensagem tem que dizer isso." Um `Set` vazio compararia igual
 * a "nenhum arquivo esperado" por acidente; este erro impede essa confusão.
 */
export class AlvoAusenteError extends Error {
  constructor(caminho: string) {
    super(
      `alvo ausente: '${caminho}' não existe. Nesta rodada (portão 04) next ` +
        `não é devDependency e nenhum build roda — falha por ausência do alvo, ` +
        `não por conteúdo (02_spec.md, "build sem out/").`
    );
    this.name = 'AlvoAusenteError';
  }
}

export function exigirDiretorio(caminho: string): void {
  if (!existsSync(caminho)) {
    throw new AlvoAusenteError(caminho);
  }
}

export function listarArquivos(dir: string): string[] {
  const resultado: string[] = [];
  (function andar(atual: string) {
    for (const entrada of readdirSync(atual, { withFileTypes: true })) {
      const caminhoCompleto = join(atual, entrada.name);
      if (entrada.isDirectory()) andar(caminhoCompleto);
      else resultado.push(caminhoCompleto);
    }
  })(dir);
  return resultado;
}

/** Conjunto dos `.html` em `dir`, com caminho relativo em barras `/`. */
export function listarHtml(dir: string): Set<string> {
  exigirDiretorio(dir);
  return new Set(
    listarArquivos(dir)
      .filter((f) => f.endsWith('.html'))
      .map((f) => relative(dir, f).split(sep).join('/'))
  );
}
