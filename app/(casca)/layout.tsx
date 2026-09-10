// Root layout do grupo (casca) — serve "/". Não existe app/layout.tsx:
// cada grupo de rota carrega seu próprio <html>/<body>, o que faz `lang`
// derivar do segmento em vez de ser fixo (defeito medido na rodada 01).
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../../styles/tokens.css';
import '../../styles/base.css';

// O <title> é exigência de acessibilidade, não enfeite: sem ele o axe reprova
// `document-title` como `serious`, e a afirmação G da spec pede zero serious.
// Nomenclatura travada: o título estampa o PRODUTO. `Sephir Studio` é a
// empresa e vive só no lockup do rodapé; `Semente Cósmica` é codinome de fase
// e nunca é título — nem <h1>, nem <title>.
export const metadata: Metadata = {
  title: 'Iniciativa Sephir',
};

export default function CascaLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
