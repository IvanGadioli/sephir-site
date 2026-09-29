import { execFileSync } from 'node:child_process';
import { beforeAll, describe, expect, it } from 'vitest';
import { HTML_ESPERADOS } from '../../lib/rotas.ts';
import { extensoes, listarHtml } from '../support/arvore.mjs';

// A igualdade estrita abaixo é real e tem dente, mas só sobre HTML — e a spec §7
// diz "a árvore é exatamente os cinco arquivos da seção 2, nem mais nem menos",
// que nunca foi verdade sobre a árvore, só sobre os HTML dela (achado I6). O
// que `out/` realmente entrega, medido nesta branch: 5 `.html`, 16 `.txt` de
// payload RSC, 13 `.js`, 1 `.css`, 2 `.woff2`, 2 `.webp`.
//
// Os `.txt` FICAM: são o conteúdo público serializado que o roteador cliente do
// App Router busca em navegação — payload legítimo, não lixo. O que esta lista
// pega é o artefato de tipo NOVO: um `sitemap.xml`, um `_redirects`, um `.map`
// de sourcemap com o código de aplicação legível. Sem ela, `next build` passa a
// emitir qualquer um dos três e a suíte continua verde.
const EXTENSOES_PERMITIDAS = ['.css', '.html', '.js', '.txt', '.webp', '.woff2'];

describe('a árvore do export', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
  }, 300_000);

  it('é exatamente os cinco HTML da spec, nem mais nem menos', () => {
    expect(listarHtml('out')).toEqual([...HTML_ESPERADOS]);
  });

  it('não contém nenhum tipo de arquivo fora da lista permitida', () => {
    // Igualdade, não inclusão, nos dois sentidos: extensão nova reprova, e
    // extensão que desapareceu da árvore também — se os `.woff2` sumirem, a
    // lista mentindo é pior que a lista faltando.
    expect(extensoes('out')).toEqual(EXTENSOES_PERMITIDAS);
  });

  it('não vaza rota de devlog, que está fora do escopo desta rodada', () => {
    const todos = listarHtml('out').join('\n');
    expect(todos).not.toContain('devlog');
  });
});
