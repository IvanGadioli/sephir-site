// Infra de teste (portão 04) — servidor HTTP mínimo para servir `out/` aos
// testes Playwright. Não é `serve` nem outra devDependency: é ~30 linhas de
// `node:http`, porque B e D precisam de resolução de caminho tipo host real
// (barra final -> index.html, 404 sem servidor real) e `file://` não simula
// isso. Usado só por playwright.config.ts (webServer); vitest não o toca.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const ALVO = process.env.ALVO_OUT
  ? join(process.cwd(), process.env.ALVO_OUT)
  : join(process.cwd(), 'out');
const PORTA = Number(process.env.PORTA_TESTE ?? 4173);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
};

function resolverCaminho(urlPath) {
  let caminho = normalize(decodeURIComponent(urlPath.split('?')[0] ?? '/'));
  if (caminho.includes('..')) caminho = '/';
  if (caminho.endsWith('/')) caminho += 'index.html';
  return join(ALVO, caminho);
}

createServer(async (req, res) => {
  try {
    const destino = resolverCaminho(req.url ?? '/');
    const info = await stat(destino);
    if (info.isDirectory()) throw new Error('diretório sem index.html');
    const dados = await readFile(destino);
    res.writeHead(200, { 'content-type': TIPOS[extname(destino)] ?? 'application/octet-stream' });
    res.end(dados);
  } catch {
    try {
      const dados404 = await readFile(join(ALVO, '404.html'));
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end(dados404);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(`não encontrado — '${ALVO}' ausente ou incompleto (build não rodou nesta rodada)`);
    }
  }
}).listen(PORTA, () => {
  console.log(`[servidor-estatico] http://localhost:${PORTA} -> ${ALVO}`);
});
