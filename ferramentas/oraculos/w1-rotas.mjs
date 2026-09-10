// W1 — a árvore publicada é exatamente a árvore esperada, e cada rota
// responde. Duas asserções (04_plano.md, Tarefa 11, Interfaces):
//   1. `raiz/**/*.html` === `HTML_ESPERADOS` (0 faltando, 0 sobrando).
//   2. cada `ROTAS[].rota` responde 200 na origem local; caminho ausente
//      devolve 404 com o corpo de `404.html`.
// Lê `HTML_ESPERADOS`/`ROTAS`/`ARQUIVO_404` de `lib/rotas.ts` — a mesma fonte
// do roteador — em vez de receber um esperado por parâmetro: `medirW1` só
// toma `{ raiz, url }` (Interfaces do 04_plano.md).
import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROTAS, HTML_ESPERADOS, ARQUIVO_404 } from '../../lib/rotas.ts';

export async function medirW1({ raiz, url }) {
  const violacoes = [];

  const encontrados = globSync('**/*.html', { cwd: raiz }).sort();
  const esperados = [...HTML_ESPERADOS];
  for (const arquivo of esperados) {
    if (!encontrados.includes(arquivo)) violacoes.push(`faltando: ${arquivo}`);
  }
  for (const arquivo of encontrados) {
    if (!esperados.includes(arquivo)) violacoes.push(`sobrando: ${arquivo}`);
  }

  for (const { rota } of ROTAS) {
    // eslint-disable-next-line no-await-in-loop
    const resposta = await fetch(`${url}${rota}`, { redirect: 'manual' });
    if (resposta.status !== 200) {
      violacoes.push(`${rota} -> ${resposta.status} (esperado 200)`);
    }
  }

  const corpo404Esperado = readFileSync(join(raiz, ARQUIVO_404), 'utf8');
  const ausente = await fetch(`${url}/w1-caminho-nunca-declarado/`, { redirect: 'manual' });
  if (ausente.status !== 404) {
    violacoes.push(`caminho ausente -> ${ausente.status} (esperado 404)`);
  } else if ((await ausente.text()) !== corpo404Esperado) {
    violacoes.push('caminho ausente: corpo devolvido não é o de 404.html');
  }

  return { ok: violacoes.length === 0, violacoes };
}
