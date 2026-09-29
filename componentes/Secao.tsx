import type { ReactNode } from 'react';

export interface SecaoProps {
  numero: string;
  rotulo: string;
  titulo: string;
  id?: string;
  children: ReactNode;
}

export function Secao({ numero, rotulo, titulo, id, children }: SecaoProps) {
  return (
    <section className="secao envoltorio" id={id}>
      <p className="eyebrow mono">
        <span className="eyebrow__numero">{numero}</span>
        <span className="eyebrow__rotulo">{` — ${rotulo}`}</span>
      </p>
      <h2>{titulo}</h2>
      {children}
    </section>
  );
}
