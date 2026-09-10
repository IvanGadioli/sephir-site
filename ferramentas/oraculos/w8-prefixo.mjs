// W8 — o caminho não escrito à mão. Compara duas árvores de build: uma sem
// prefixo (`raizOut`) e uma sentinela construída com PREFIXO=/__pfx
// (`raizSentinela`). As duas asserções são disjuntas (04_plano.md, Tarefa 7):
//   em raizSentinela: 0 href/src interno que NÃO comece em /__pfx
//   em raizOut:       0 href/src interno que comece em /__pfx
// Nenhum literal escrito à mão satisfaz as duas — só um valor lido de
// PREFIXO em build passa nas duas árvores. Limiar: violacoes.length === 0.
import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ATRIBUTO_RE = /(?:href|src)="([^"]*)"/g;

const ESQUEMAS_EXTERNOS = ['http:', 'https:', 'mailto:', 'tel:'];

function ehInterno(valor) {
  if (!valor.startsWith('/')) return false; // externo, relativo ou âncora pura
  return !ESQUEMAS_EXTERNOS.some((esquema) => valor.startsWith(esquema));
}

function caminhosInternos(raiz) {
  const caminhos = [];
  for (const arquivo of globSync('**/*.html', { cwd: raiz })) {
    const conteudo = readFileSync(join(raiz, arquivo), 'utf8');
    for (const [, valor] of conteudo.matchAll(ATRIBUTO_RE)) {
      if (ehInterno(valor)) caminhos.push({ de: arquivo, valor });
    }
  }
  return caminhos;
}

export function medirW8({ raizOut, raizSentinela }) {
  const violacoes = [];

  const internosSentinela = caminhosInternos(raizSentinela);
  const sentinelaPrefixados = internosSentinela.filter(({ valor }) =>
    valor.startsWith('/__pfx'),
  ).length;
  for (const { de, valor } of internosSentinela) {
    if (!valor.startsWith('/__pfx')) {
      violacoes.push(`sentinela: ${de} -> ${valor} (sem prefixo)`);
    }
  }

  const internosOut = caminhosInternos(raizOut);
  for (const { de, valor } of internosOut) {
    if (valor.startsWith('/__pfx')) {
      violacoes.push(`out: ${de} -> ${valor} (prefixo vazado)`);
    }
  }

  return {
    ok: violacoes.length === 0,
    violacoes,
    detalhe: {
      sentinelaPrefixados,
      sentinelaTotal: internosSentinela.length,
      outTotal: internosOut.length,
    },
  };
}
