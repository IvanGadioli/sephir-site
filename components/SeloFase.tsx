// Selo de fase: codinome de desenvolvimento até a 1.0. Nomenclatura travada
// em 30/07/2026 (skill `marca-sephir`) — a fase só aparece aqui, num selo,
// nunca em <h1>..<h6>. Cores só por var(--...) de styles/tokens.css.
export function SeloFase() {
  return (
    <p
      style={{
        display: 'inline-block',
        margin: 0,
        padding: 'var(--espaco-xs) var(--espaco-md)',
        border: '1px solid var(--cor-border)',
        borderRadius: 'var(--raio-pill)',
        fontFamily: 'var(--fonte-mono)',
        fontSize: 'var(--tipo-label-tamanho)',
        lineHeight: 'var(--tipo-label-altura)',
        letterSpacing: 'var(--tipo-label-tracking)',
        textTransform: 'uppercase',
        color: 'var(--cor-teal)',
      }}
    >
      fase Semente Cósmica · rumo à 1.0
    </p>
  );
}
