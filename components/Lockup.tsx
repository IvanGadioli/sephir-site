// Lockup do rodapé: "Sephir Studio — Iniciativa Sephir". Estúdio (empresa) e
// produto (jogo) juntos — nomenclatura travada em 30/07/2026 (skill
// `marca-sephir`). O estúdio só aparece aqui, nunca em título.
export function Lockup() {
  return (
    <p
      style={{
        margin: 0,
        fontFamily: 'var(--fonte-mono)',
        fontSize: 'var(--tipo-small-tamanho)',
        lineHeight: 'var(--tipo-small-altura)',
        color: 'var(--cor-muted)',
      }}
    >
      Sephir Studio — Iniciativa Sephir
    </p>
  );
}
