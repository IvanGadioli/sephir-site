import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '../estilos/tokens.css';
import '../estilos/base.css';

export const metadata: Metadata = {
  title: 'Iniciativa Sephir',
  description: 'Simulação física do cosmos, jogável.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
