// Rota real, movida para out/404.html pela poda (ferramentas/podar.mjs).
// Herda o root layout de (casca): sai com <html lang="pt">, texto em
// português e um link para a home — o que o 404 nativo do Next não tem.
import { caminho } from '../../../lib/caminho';

export default function NaoEncontrado() {
  return (
    <main>
      <h1>Página não encontrada</h1>
      <p>
        <a href={caminho('/pt/')}>Voltar para a página inicial</a>
      </p>
    </main>
  );
}
