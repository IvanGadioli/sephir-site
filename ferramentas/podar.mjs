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
import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function podar(raiz = 'out') {
  const origem = join(raiz, 'nao-encontrado', 'index.html');
  const movido = join(raiz, '404.html');
  // Idempotente de propósito. Sem esta guarda, rodar a poda duas vezes lança
  // ENOENT e derruba o `build` inteiro pelo `&&` — e "rodar duas vezes"
  // acontece de graça em qualquer ambiente que reaproveite `out/`.
  if (existsSync(origem)) renameSync(origem, movido);

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

// A guarda compara **caminho real dos dois lados**. Duas tentativas falharam
// antes desta, e as duas do mesmo jeito: `file://${process.argv[1]}` e depois
// `pathToFileURL(resolve(process.argv[1]))`. O `import.meta.url` chega com os
// symlinks já desfeitos; `resolve()` é lexical e não desfaz nenhum. Se o
// diretório de build for symlink, a igualdade dá falso, o `if` não entra e o
// script **sai 0 sem podar nada** — build verde, árvore não podada, ninguém
// avisado. Foi o que aconteceu no primeiro deploy real, e medi o mesmo bug
// localmente invocando por um symlink.
const esteArquivo = realpathSync(fileURLToPath(import.meta.url));
const invocado = process.argv[1] ? realpathSync(process.argv[1]) : '';
if (esteArquivo === invocado) {
  const resultado = podar();
  console.log(`podado: ${resultado.movido}`);
  for (const r of resultado.removidos) console.log(`removido: ${r}`);
}
