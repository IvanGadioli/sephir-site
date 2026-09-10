// W11 — toda pilha de fonte computada é uma das três pilhas da marca. Lê
// `getComputedStyle(el).fontFamily` de todo elemento com nó de texto
// renderizado e compara a string inteira normalizada (aspas e espaçamento).
//
// A rodada 01 falhou por herança: `tokens.css` estava certo e a `h1`
// computava a pilha do `body` antigo. Nenhum grep em `tokens.css` pega isso;
// ler o elemento pega — por isso o oráculo lê o DOM computado, nunca o
// arquivo.
//
// As três pilhas vêm transcritas aqui, das Restrições globais de
// `sistemas/01_publicacao/features/02_esqueleto-publicado/04_plano.md`.

const TRES_PILHAS = [
  `'Space Grotesk', system-ui, sans-serif`,
  `'Inter', system-ui, sans-serif`,
  `'Space Mono', ui-monospace, monospace`,
];

// Um nome de família de uma palavra só (ex.: "Inter") não precisa de aspas
// em CSS, e o serializador do Chromium as omite no valor computado mesmo
// quando a folha de estilo as escreveu — só "Space Grotesk" e "Space Mono",
// com espaço no nome, saem sempre entre aspas. Por isso a normalização
// remove aspas de todo (em vez de só trocar `"` por `'`): sem isso, `Inter,
// system-ui, sans-serif` (o valor real, sem aspas) nunca bateria com `'Inter',
// system-ui, sans-serif` (a pilha transcrita, com aspas).
function normalizar(pilha) {
  return pilha
    .replace(/["']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const PILHAS_NORMALIZADAS = TRES_PILHAS.map(normalizar);

// Roda dentro da página: só pode usar o que existe no navegador.
function medirNaPagina(pilhasNormalizadas) {
  function normalizarNaPagina(pilha) {
    return pilha
      .replace(/["']/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function sobDisplayNone(el) {
    let no = el;
    while (no) {
      if (no.nodeType === 1 && getComputedStyle(no).display === 'none') {
        return true;
      }
      no = no.parentElement;
    }
    return false;
  }

  function temTextoRenderizado(el) {
    for (const filho of el.childNodes) {
      if (filho.nodeType === Node.TEXT_NODE && filho.textContent && filho.textContent.trim().length > 0) {
        return true;
      }
    }
    return false;
  }

  const violacoes = [];
  let varridos = 0;

  const elementos = document.querySelectorAll('*');
  for (const el of elementos) {
    if (sobDisplayNone(el)) continue;
    if (!temTextoRenderizado(el)) continue;

    varridos += 1;
    const pilha = getComputedStyle(el).fontFamily;
    const normalizada = normalizarNaPagina(pilha);
    if (!pilhasNormalizadas.includes(normalizada)) {
      violacoes.push(`${el.tagName.toLowerCase()} font-family: ${pilha}`);
    }
  }

  return { violacoes, varridos };
}

export async function medirW11({ page, rotas }) {
  const alvos = rotas === null ? [null] : rotas;
  const violacoes = [];
  let varridos = 0;

  for (const rota of alvos) {
    if (rota !== null) {
      // eslint-disable-next-line no-await-in-loop
      await page.goto(rota);
      // Algumas rotas (ex.: `/`) fazem `<meta http-equiv="refresh">` para
      // outra rota. `goto` resolve no `load` da navegação inicial, antes do
      // redirecionamento acontecer — sem esperar aqui, o `evaluate` seguinte
      // cai no meio da troca de documento e perde o contexto de execução.
      // eslint-disable-next-line no-await-in-loop
      await page.waitForLoadState('networkidle');
    }
    // eslint-disable-next-line no-await-in-loop
    const resultado = await page.evaluate(medirNaPagina, PILHAS_NORMALIZADAS);
    varridos += resultado.varridos;
    for (const v of resultado.violacoes) {
      violacoes.push(rota === null ? v : `${rota} ${v}`);
    }
  }

  return { ok: violacoes.length === 0, violacoes, detalhe: { elementosVarridos: varridos } };
}
