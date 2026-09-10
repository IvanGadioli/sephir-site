// W9 — toda cor pintada pertence aos dez matizes da marca. Varre, no DOM
// computado, todo elemento e pseudo-elemento (::before, ::after) nas
// propriedades que pintam: `color`, `background-color`, as quatro bordas,
// `outline-color`, `text-decoration-color`, `caret-color`,
// `column-rule-color`, `fill`, `stroke`, mais os *stops* de cor dentro de
// `background-image` e o canal de cor de `box-shadow`/`text-shadow`.
//
// Os dez matizes vêm transcritos aqui, das Restrições globais de
// `sistemas/01_publicacao/features/02_esqueleto-publicado/04_plano.md` — não
// lidos de `styles/tokens.css`. Se o oráculo lesse o token, estaria
// conferindo o arquivo contra si mesmo, e a defesa contra "passa por
// construção" cairia inteira.
//
// Regra de correspondência: alfa descartado e não comparado (`border` e
// `borderStrong` são `stardust` em alfas diferentes — é o próprio
// `theme.ts` que mostra esse modelo); o triplo RGB restante tem que ser
// igual, inteiro a inteiro, a um dos dez. Valores totalmente transparentes
// (`rgba(…, 0)`) não pintam e ficam fora da conta.
//
// Nós que nunca pintam ficam de fora: dentro de `<defs>`, `<symbol>`,
// `<clipPath>`, `<mask>`, `<pattern>`, e qualquer nó sob `display:none` —
// sem essa exclusão o `fill` inicial `black` de um `<path>` de sprite que
// nunca pinta reprovaria um sprite limpo.

const DEZ_MATIZES = [
  ['void', 5, 7, 14],
  ['void2', 12, 18, 32],
  ['void3', 20, 28, 48],
  ['amber', 232, 150, 58],
  ['amberDim', 199, 122, 40],
  ['teal', 63, 184, 158],
  ['tealDim', 50, 150, 128],
  ['stardust', 244, 239, 230],
  ['muted', 138, 147, 168],
  ['faint', 74, 84, 104],
];

// Roda dentro da página: só pode usar o que existe no navegador.
function medirNaPagina(matizes) {
  const COR_RE =
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/g;

  const PROPRIEDADES_SIMPLES = [
    'color',
    'background-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'text-decoration-color',
    'caret-color',
    'column-rule-color',
  ];

  // `fill`/`stroke` são propriedades de pintura SVG: todo elemento HTML
  // também "computa" um valor pra elas (inicial `fill: black`), mas nunca
  // pinta — a propriedade não se aplica fora do namespace SVG. Sem essa
  // restrição, todo <p>, <a>, <body> do site reprovaria por um `fill: rgb(0,
  // 0, 0)` que nunca é desenhado, o mesmo tipo de falso positivo que a
  // exclusão de `defs`/`symbol` evita para os nós SVG que nunca renderizam.
  const PROPRIEDADES_SVG = ['fill', 'stroke'];

  const PROPRIEDADES_MULTIPLAS = ['background-image', 'box-shadow', 'text-shadow'];

  const NS_SVG = 'http://www.w3.org/2000/svg';

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

  function nuncaPinta(el) {
    return !!el.closest('defs, symbol, clipPath, mask, pattern');
  }

  function baterMatiz(r, g, b) {
    return matizes.some(([, mr, mg, mb]) => mr === r && mg === g && mb === b);
  }

  function extrairTriplos(valor) {
    const triplos = [];
    if (!valor || valor === 'none' || valor === 'transparent') return triplos;
    let m;
    COR_RE.lastIndex = 0;
    // eslint-disable-next-line no-cond-assign
    while ((m = COR_RE.exec(valor))) {
      const r = Math.round(parseFloat(m[1]));
      const g = Math.round(parseFloat(m[2]));
      const b = Math.round(parseFloat(m[3]));
      const a = m[4] === undefined ? 1 : parseFloat(m[4]);
      if (a === 0) continue; // totalmente transparente: não pinta
      triplos.push([r, g, b]);
    }
    return triplos;
  }

  const violacoes = [];
  let varridos = 0;

  function checar(cs, origem, ehSvg) {
    const propriedades = ehSvg
      ? [...PROPRIEDADES_SIMPLES, ...PROPRIEDADES_SVG]
      : PROPRIEDADES_SIMPLES;
    for (const prop of propriedades) {
      const valor = cs.getPropertyValue(prop);
      for (const [r, g, b] of extrairTriplos(valor)) {
        if (!baterMatiz(r, g, b)) {
          violacoes.push(`${origem} ${prop}: rgb(${r}, ${g}, ${b})`);
        }
      }
    }
    for (const prop of PROPRIEDADES_MULTIPLAS) {
      const valor = cs.getPropertyValue(prop);
      for (const [r, g, b] of extrairTriplos(valor)) {
        if (!baterMatiz(r, g, b)) {
          violacoes.push(`${origem} ${prop}: rgb(${r}, ${g}, ${b})`);
        }
      }
    }
  }

  const elementos = document.querySelectorAll('*');
  for (const el of elementos) {
    if (nuncaPinta(el) || sobDisplayNone(el)) continue;
    varridos += 1;
    const tag = el.tagName.toLowerCase();
    const ehSvg = el.namespaceURI === NS_SVG;
    checar(getComputedStyle(el), tag, ehSvg);
    checar(getComputedStyle(el, '::before'), `${tag}::before`, ehSvg);
    checar(getComputedStyle(el, '::after'), `${tag}::after`, ehSvg);
  }

  return { violacoes, varridos };
}

export async function medirW9({ page, rotas }) {
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
    const resultado = await page.evaluate(medirNaPagina, DEZ_MATIZES);
    varridos += resultado.varridos;
    for (const v of resultado.violacoes) {
      violacoes.push(rota === null ? v : `${rota} ${v}`);
    }
  }

  return { ok: violacoes.length === 0, violacoes, detalhe: { elementosVarridos: varridos } };
}
