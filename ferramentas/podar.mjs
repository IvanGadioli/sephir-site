// A poda dos artefatos do exportador. Roda dentro do `build` (não depois),
// senão a árvore publicada difere da testada — ver 04_plano.md, Contexto.
//
// `next build` com output:'export' e trailingSlash:true emite cinco .html:
//   out/index.html            <- declarado
//   out/pt/index.html         <- declarado
//   out/404.html              <- declarado, mas em inglês e sem lang
//   out/404/index.html        <- artefato do trailingSlash
//   out/_not-found/index.html <- artefato do App Router
// mais o nosso `out/nao-encontrado/index.html`, a rota real que carrega
// <html lang="pt"> por herdar o root layout de `(casca)`.
//
// A poda move nao-encontrado/index.html sobre 404.html, e remove os três
// diretórios que sobram, deixando exatamente três .html.
import { existsSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';

export function podar(raiz = 'out') {
  const origem = join(raiz, 'nao-encontrado', 'index.html');
  const movido = join(raiz, '404.html');
  renameSync(origem, movido);

  const removidos = [];
  for (const dir of ['404', '_not-found', 'nao-encontrado']) {
    const caminho = join(raiz, dir);
    if (existsSync(caminho)) {
      rmSync(caminho, { recursive: true, force: true });
      removidos.push(caminho);
    }
  }

  return { movido, removidos };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const resultado = podar();
  console.log(`podado: ${resultado.movido}`);
  for (const r of resultado.removidos) console.log(`removido: ${r}`);
}
