// Rota real, movida para out/404.html pela poda (ferramentas/podar.mjs).
// Herda o root layout de (casca): sai com <html lang="pt">, texto em
// português e um link para a home — o que o 404 nativo do Next não tem.
// Cores só por var(--...) de styles/tokens.css (skill `marca-sephir`).
import { caminho } from '../../../lib/caminho';

export default function NaoEncontrado() {
  return (
    <main style={{ padding: 'var(--espaco-xxl) var(--espaco-lg)' }}>
      <h1
        style={{
          margin: '0 0 var(--espaco-md)',
          fontSize: 'var(--tipo-h1-tamanho)',
          fontWeight: 'var(--tipo-h1-peso)',
          lineHeight: 'var(--tipo-h1-altura)',
          letterSpacing: 'var(--tipo-h1-tracking)',
        }}
      >
        Página não encontrada
      </h1>
      <p style={{ margin: 0, color: 'var(--cor-muted)' }}>
        <a href={caminho('/pt/')} style={{ color: 'var(--cor-teal)' }}>
          Voltar para a página inicial
        </a>
      </p>
    </main>
  );
}
