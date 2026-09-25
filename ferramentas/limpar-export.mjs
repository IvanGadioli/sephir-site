import { rmSync } from 'node:fs';

// O Next emite _not-found/ como rota, além do 404.html que o host serve. O
// diretório é peso morto num export estático: nenhum link aponta para ele e o
// Cloudflare Pages nunca o consulta.
rmSync(new URL('../out/_not-found', import.meta.url), { recursive: true, force: true });
console.log('export limpo: _not-found removido');
