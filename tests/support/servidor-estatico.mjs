import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

// A raiz vem de argv, com `out` por padrão. Não é embutida: a Tarefa 23 precisa
// servir `baseline-main-ed68bd4/` com o MESMO servidor para a comparação ser
// honesta, e editar o caminho à mão a cada medição é como se acaba servindo o
// diretório errado sem perceber.
const RAIZ = new URL(`../../${process.argv[2] ?? 'out'}/`, import.meta.url).pathname;
const PORTA = Number(process.argv[3] ?? 4173);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.wgsl': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
};

// Resolve como um host real: /rota/ → /rota/index.html, e qualquer coisa que
// não casa cai no 404.html — que é exatamente o que o Cloudflare Pages faz.
function resolver(urlBruta) {
  const caminho = decodeURIComponent((urlBruta ?? '/').split('?')[0]);
  const seguro = normalize(caminho).replace(/^(\.\.[/\\])+/, '');
  let alvo = join(RAIZ, seguro);
  if (existsSync(alvo) && statSync(alvo).isDirectory()) alvo = join(alvo, 'index.html');
  if (!existsSync(alvo)) return { alvo: join(RAIZ, '404.html'), status: 404 };
  return { alvo, status: 200 };
}

createServer((req, res) => {
  const { alvo, status } = resolver(req.url);
  if (!existsSync(alvo)) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('alvo ausente: rode `npm run build` antes dos testes');
    return;
  }
  res.writeHead(status, { 'content-type': TIPOS[extname(alvo)] ?? 'application/octet-stream' });
  createReadStream(alvo).pipe(res);
}).listen(PORTA, () => {
  console.log(`servindo ${RAIZ} em http://localhost:${PORTA}`);
});
