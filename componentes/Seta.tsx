import type { ReactNode } from 'react';

export interface SetaProps {
  href: string;
  direcao?: 'direita' | 'baixo';
  regua?: boolean;
  children: ReactNode;
}

export function Seta({ href, direcao = 'direita', regua, children }: SetaProps) {
  const paraBaixo = direcao === 'baixo';
  return (
    <div className="seta__bloco">
      {regua ? <div className="seta__regua" /> : null}
      <a className="seta" href={href}>
        {children}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {paraBaixo ? (
            <>
              <line x1="12" y1="4" x2="12" y2="20" />
              <polyline points="6 14 12 20 18 14" />
            </>
          ) : (
            <>
              <line x1="4" y1="12" x2="20" y2="12" />
              <polyline points="14 6 20 12 14 18" />
            </>
          )}
        </svg>
      </a>
    </div>
  );
}
