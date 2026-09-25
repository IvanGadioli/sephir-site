import type { ReactNode } from 'react';

export function Linha({
  colunas,
  children,
}: {
  colunas: 'estado' | 'portao';
  children: ReactNode;
}) {
  return <div className={`linha linha--${colunas}`}>{children}</div>;
}
