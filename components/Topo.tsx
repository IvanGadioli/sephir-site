import { caminho } from '../lib/caminho';

// A navegação do design tem quatro itens. `devlog` sai como texto, não como
// link: a própria seção "Estado atual" declara que a página de devlog NÃO
// EXISTE, e um <a> para ela reprovaria o oráculo de integridade de link
// interno (W2) — além de prometer ao visitante uma página que não há.
export function Topo() {
  return (
    <div className="topo">
      <p className="wordmark">
        <span className="wordmark__sephir">Sephir</span>{' '}
        <span className="wordmark__studio">Studio</span>
      </p>
      <nav className="navegacao" aria-label="seções">
        <a href="#o-que-e">o projeto</a>
        <a href="#como-e-feito">como é feito</a>
        {/* Texto, não link: a seção "Estado atual" declara que a página de
            devlog não existe. Sem `aria-disabled` — num <span> sem papel ele é
            atributo proibido (`aria-prohibited-attr`), e o axe reportava duas
            entradas `incomplete` por isso. O estado vem do texto visível. */}
        <span className="navegacao__ausente">devlog (em breve)</span>
        <a href={caminho('/pt/sobre/')}>sobre</a>
      </nav>
    </div>
  );
}
