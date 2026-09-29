import type { ReactNode } from 'react';
import { Rodape } from '../../componentes/Rodape.tsx';
import { IDIOMAS } from '../../lib/rotas.ts';

export function generateStaticParams() {
  return IDIOMAS.map((lang) => ({ lang }));
}

export default function LayoutIdioma({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Rodape />
    </>
  );
}
