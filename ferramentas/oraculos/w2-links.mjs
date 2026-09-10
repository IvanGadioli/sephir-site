// W2 — integridade de link interno. Varre `raiz/**/*.html`, extrai todo
// `href`, resolve cada um contra a árvore em disco e acumula os que não têm
// destino. Regra de resolução, literal do portão 03 (04_plano.md, Tarefa 6):
//   '/x/' -> '<raiz>/x/index.html'; '/' -> '<raiz>/index.html';
//   fragmento e query descartados antes de resolver;
//   http(s):, mailto:, tel: e âncora pura (href="#algo") ficam fora da conta.
// Limiar: 0 href interno sem destino.
import { glob, readFile, stat } from 'node:fs/promises';
import { join, posix } from 'node:path';

const HREF_RE = /href="([^"]*)"/g;

const ESQUEMAS_EXTERNOS = ['http:', 'https:', 'mailto:', 'tel:'];

function ehExterno(href) {
  return ESQUEMAS_EXTERNOS.some((esquema) => href.startsWith(esquema));
}

function descartarFragmentoEQuery(href) {
  const semFragmento = href.split('#')[0];
  return semFragmento.split('?')[0];
}

function resolverCaminhoRelativo(href) {
  const semEsquema = descartarFragmentoEQuery(href);
  const semBarraInicial = semEsquema.replace(/^\/+/, '');
  if (semEsquema.endsWith('/')) {
    return posix.join(semBarraInicial, 'index.html');
  }
  return semBarraInicial;
}

async function existeNaRaiz(raiz, relativo) {
  try {
    await stat(join(raiz, relativo));
    return true;
  } catch {
    return false;
  }
}

export async function medirW2({ raiz, extra = [] }) {
  const violacoes = [];
  const ocorrencias = [];

  for await (const arquivo of glob('**/*.html', { cwd: raiz })) {
    const conteudo = await readFile(join(raiz, arquivo), 'utf8');
    for (const [, href] of conteudo.matchAll(HREF_RE)) {
      ocorrencias.push({ de: arquivo, href });
    }
  }
  for (const item of extra) {
    ocorrencias.push(item);
  }

  for (const { de, href } of ocorrencias) {
    if (ehExterno(href)) continue;
    if (href.startsWith('#')) continue; // âncora pura

    const relativo = resolverCaminhoRelativo(href);
    // eslint-disable-next-line no-await-in-loop
    if (!(await existeNaRaiz(raiz, relativo))) {
      violacoes.push(`${de} -> ${href} (sem destino: ${relativo})`);
    }
  }

  return { ok: violacoes.length === 0, violacoes };
}
