import { rmSync } from 'node:fs';

// O Next emite _not-found/ como rota, além do 404.html que o host serve. O
// diretório é peso morto num export estático: nenhum link aponta para ele e o
// Cloudflare Pages nunca o consulta.
rmSync(new URL('../out/_not-found', import.meta.url), { recursive: true, force: true });

// trailingSlash: true também duplica a rota /404 como diretório
// (out/404/index.html), idêntico byte a byte ao out/404.html que o host
// consulta. Nada linka para /404/ — é peso morto na mesma categoria do
// _not-found acima, e quebraria a comparação estrita de HTML_ESPERADOS
// (lib/rotas.ts) que a Tarefa 16 faz contra a árvore de out/.
rmSync(new URL('../out/404', import.meta.url), { recursive: true, force: true });

console.log('export limpo: _not-found e 404/ removidos');
