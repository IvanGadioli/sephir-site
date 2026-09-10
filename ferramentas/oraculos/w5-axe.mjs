// W5 — nenhuma rota tem violação `serious` ou `critical` de acessibilidade,
// pelo axe-core (WCAG 2.1 AA). `html-has-lang` e `html-lang-valid` são
// `serious`, e é por aí que este oráculo também cobre a metade de J que
// cobre: presença e validade de `lang`, nunca igualdade ao segmento — a
// igualdade ao segmento (`pt` vs. `pt-BR`) é dívida à parte, coberta em
// outro teste.
//
// Contraste (`color-contrast`) é WCAG 2.1 AA — 4,5:1 abaixo de 24 px (ou
// 18,66 px em negrito), 3:1 acima disso — e o axe já aplica esse limiar
// dentro da própria regra; este oráculo não reimplementa a conta de
// contraste, só lê o veredito do axe.
//
// Limiar: 0 violação `serious`, 0 `critical`, uma passada por rota. Impacto
// `minor`/`moderate` não reprova, mas vai para `detalhe.outrosImpactos` —
// jogar fora violação de impacto baixo é o mesmo verde falso que jogar fora
// `incomplete`.
//
// `detalhe.incomplete` é obrigatório e é sempre um array, mesmo vazio. As
// entradas `incomplete` de `color-contrast` são pares que o axe não
// conseguiu resolver sozinho (ex.: cor de fundo depende de imagem, ou de
// composição que o motor de acessibilidade não decompõe) — elas não
// reprovam, mas também não podem ser engolidas: cada uma é uma conferência
// humana única, e quem lê `07_relatorio.md` precisa vê-las, datadas.

import AxeBuilder from '@axe-core/playwright';

const IMPACTOS_QUE_REPROVAM = new Set(['serious', 'critical']);

function formatarNo(rota, regra, impacto, no) {
  const alvo = Array.isArray(no.target) ? no.target.join(' ') : String(no.target);
  const resumo = no.failureSummary ?? '';
  return `${rota} ${regra} [${impacto ?? 'desconhecido'}]: ${alvo}${resumo ? ` — ${resumo}` : ''}`;
}

export async function medirW5({ page, rotas, regras }) {
  const violacoes = [];
  const outrosImpactos = [];
  const incomplete = [];

  for (const rota of rotas) {
    // eslint-disable-next-line no-await-in-loop
    await page.goto(rota);
    // Mesma razão do W9: uma rota pode trocar de documento via
    // `<meta http-equiv="refresh">` depois do `load` inicial. Sem esperar a
    // rede ficar quieta aqui, a injeção do axe corre o risco de cair no
    // meio da troca de documento e perder o contexto de execução.
    // eslint-disable-next-line no-await-in-loop
    await page.waitForLoadState('networkidle');

    let builder = new AxeBuilder({ page });
    if (regras && regras.length > 0) {
      builder = builder.withRules(regras);
    }

    // eslint-disable-next-line no-await-in-loop
    const resultado = await builder.analyze();

    for (const v of resultado.violations) {
      const destino = IMPACTOS_QUE_REPROVAM.has(v.impact ?? '') ? violacoes : outrosImpactos;
      for (const no of v.nodes) {
        destino.push(formatarNo(rota, v.id, v.impact, no));
      }
    }

    for (const inc of resultado.incomplete) {
      for (const no of inc.nodes) {
        incomplete.push({
          rota,
          regra: inc.id,
          impacto: inc.impact ?? null,
          alvo: no.target,
          html: no.html,
          resumo: no.failureSummary ?? null,
        });
      }
    }
  }

  return {
    ok: violacoes.length === 0,
    violacoes,
    detalhe: { incomplete, outrosImpactos },
  };
}
