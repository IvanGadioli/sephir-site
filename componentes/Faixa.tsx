import { Topo } from './Topo.tsx';
import type { ChaveMenu } from '../lib/rotas.ts';

export interface FaixaProps {
  titulo: string;
  ativo: ChaveMenu | null;
  imagem?: string;
  sub?: string;
  regua?: boolean;
}

export function Faixa({ titulo, ativo, imagem, sub, regua }: FaixaProps) {
  // A altura é consequência da imagem, não prop: 420px com, 340px sem — é o
  // que os artboards Sobre e ComoEFeito fazem.
  const altura = imagem ? 'faixa--alta' : 'faixa--baixa';
  return (
    <header className={`faixa ${altura}`}>
      {imagem ? (
        <>
          <img className="faixa__fundo" src={imagem} alt="" />
          <div className="faixa__veu" />
        </>
      ) : null}
      <Topo ativo={ativo} />
      <div className="faixa__texto">
        {regua ? <div className="faixa__regua" /> : null}
        <h1>{titulo}</h1>
        {sub ? <p className="faixa__sub">{sub}</p> : null}
      </div>
    </header>
  );
}
