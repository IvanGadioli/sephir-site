// Root layout do grupo (casca) — serve "/". Não existe app/layout.tsx:
// cada grupo de rota carrega seu próprio <html>/<body>, o que faz `lang`
// derivar do segmento em vez de ser fixo (defeito medido na rodada 01).
import type { ReactNode } from 'react';

export default function CascaLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
