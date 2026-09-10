// Suporte de teste, não implementação: uma origem estática de terceiro que
// resolve os caminhos exatamente como o Cloudflare Pages resolve um export
// do Next com trailingSlash:true — porque se ela resolver diferente, os
// testes de link (C) e a metade local de B medem o servidor, não o site.
// node:http + node:zlib puros, sem dependência nova (playwright.config.ts já
// cita este arquivo como webServer).
//
// Contrato (Tarefa 5, 04_plano.md):
//   /              -> 200, out/index.html
//   /pt/           -> 200, out/pt/index.html
//   /pt            -> 301 para /pt/
//   caminho ausente-> 404, corpo de out/404.html
//   Accept-Encoding: br   -> content-encoding: br, qualidade 11  (preferido)
//   Accept-Encoding: gzip -> content-encoding: gzip, nível 9
//
// Brotli é a codificação de referência desde `adr-fab-006`: o orçamento de
// peso existe para limitar o que o visitante baixa, e o Cloudflare Pages serve
// brotli. Medir gzip -9 media um proxy conservador que reprovava o que o fio
// aprova. Brotli é preferido quando o cliente aceita os dois — que é o caso do
// Chrome, e portanto do Lighthouse.
//   sem out/       -> sobe assim mesmo e responde 404 em tudo

import { createServer } from 'node:http';
import { gzipSync, brotliCompressSync, constants as zlibConstants } from 'node:zlib';
import { existsSync } from 'node:fs';
import { readFile as readFileAsync } from 'node:fs/promises';
import { join, extname } from 'node:path';

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

function tipoDe(caminho) {
  return TIPOS[extname(caminho)] ?? 'application/octet-stream';
}

function enviar(res, status, corpo, tipo, codificacao, cabecalhosExtra = {}) {
  const buf = typeof corpo === 'string' ? Buffer.from(corpo, 'utf8') : corpo;
  const cabecalhos = { 'content-type': tipo, ...cabecalhosExtra };
  if (codificacao) {
    const comprimido =
      codificacao === 'br'
        ? brotliCompressSync(buf, {
            params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 },
          })
        : gzipSync(buf, { level: 9 });
    cabecalhos['content-encoding'] = codificacao;
    cabecalhos['content-length'] = String(comprimido.length);
    res.writeHead(status, cabecalhos);
    res.end(comprimido);
    return;
  }
  cabecalhos['content-length'] = String(buf.length);
  res.writeHead(status, cabecalhos);
  res.end(buf);
}

async function tentarLer(caminho) {
  try {
    return await readFileAsync(caminho);
  } catch {
    return null;
  }
}

export function criarServidor({ raiz, porta = 4173 }) {
  return new Promise((resolve, reject) => {
    const servidor = createServer(async (req, res) => {
      // brotli antes de gzip: é o que o Cloudflare entrega quando o cliente
      // aceita os dois, e é a codificação de referência (`adr-fab-006`).
      const aceita = String(req.headers['accept-encoding'] ?? '');
      const aceitaGzip = aceita.includes('br')
        ? 'br'
        : aceita.includes('gzip')
          ? 'gzip'
          : null;
      const urlBruta = req.url ?? '/';
      const semQuery = urlBruta.split('?')[0].split('#')[0];

      if (!existsSync(raiz)) {
        enviar(res, 404, 'out/ ausente', 'text/plain; charset=utf-8', aceitaGzip);
        return;
      }

      const temExtensao = extname(semQuery) !== '';

      if (temExtensao) {
        const arquivo = join(raiz, decodeURIComponent(semQuery));
        const conteudo = await tentarLer(arquivo);
        if (conteudo) {
          enviar(res, 200, conteudo, tipoDe(semQuery), aceitaGzip);
          return;
        }
        const corpo404 = (await tentarLer(join(raiz, '404.html'))) ?? Buffer.from('404');
        enviar(res, 404, corpo404, 'text/html; charset=utf-8', aceitaGzip);
        return;
      }

      if (!semQuery.endsWith('/')) {
        res.writeHead(301, { location: `${semQuery}/` });
        res.end();
        return;
      }

      const indice = join(raiz, decodeURIComponent(semQuery), 'index.html');
      const conteudo = await tentarLer(indice);
      if (conteudo) {
        enviar(res, 200, conteudo, 'text/html; charset=utf-8', aceitaGzip);
        return;
      }

      const corpo404 = (await tentarLer(join(raiz, '404.html'))) ?? Buffer.from('404');
      enviar(res, 404, corpo404, 'text/html; charset=utf-8', aceitaGzip);
    });

    servidor.on('error', reject);
    servidor.listen(porta, () => {
      resolve({
        url: `http://localhost:${porta}`,
        fechar: () =>
          new Promise((res2, rej2) => {
            servidor.close((err) => (err ? rej2(err) : res2()));
          }),
      });
    });
  });
}

// playwright.config.ts cita este arquivo como `webServer.command`; quando
// executado diretamente (não importado), sobe na porta 4173 e fica no ar.
if (import.meta.url === `file://${process.argv[1]}`) {
  const porta = Number(process.env.PORTA_SERVIDOR_ESTATICO ?? 4173);
  criarServidor({ raiz: 'out', porta })
    .then(({ url }) => {
      // eslint-disable-next-line no-console
      console.log(`servidor estático em ${url} (raiz: out/)`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
