import Heroi from '../../componentes/heroi/index.tsx';
import { Linha } from '../../componentes/Linha.tsx';
import { Secao } from '../../componentes/Secao.tsx';
import { Seta } from '../../componentes/Seta.tsx';
import { Topo } from '../../componentes/Topo.tsx';
import { brand } from '../../lib/marca.ts';

const FICHA = [
  { rotulo: 'motor', valor: 'Unreal Engine 5' },
  { rotulo: 'simulação', valor: 'cônicas emendadas' },
  { rotulo: 'fase', valor: brand.phase },
] as const;

const ESTADO = [
  { tom: 'existe', rotulo: 'existe', texto: 'O motor N-corpos: física de dois corpos de verdade, renderizada em tempo real.' },
  { tom: 'existe', rotulo: 'existe', texto: 'O pipeline de produção documentado em oito portões — escopo, spec, oráculo, teste, implementação, verificação, relatório, encerramento.' },
  { tom: 'existe', rotulo: 'existe', texto: 'Este site, publicado como export estático, sem servidor por trás.' },
  { tom: 'construcao', rotulo: 'em construção', texto: 'Capturas de tela e vídeo do jogo em execução — quando existir, entra numa rota nova, não numa reescrita desta.' },
  { tom: 'ausente', rotulo: 'não existe', texto: 'Página de devlog.' },
  { tom: 'ausente', rotulo: 'não existe', texto: 'Versão jogável pública.' },
  { tom: 'ausente', rotulo: 'não existe', texto: 'Suporte a mais de um idioma.' },
] as const;

const PORTOES = ['00', '01', '02', '03', '04', '05', '06', '07'] as const;
const PORTOES_CUMPRIDOS = 4;

export default function Home() {
  return (
    <>
      <div className="heroi">
        <Heroi />
        <div className="heroi__veu-lateral" />
        <div className="heroi__veu-vertical" />
        <Topo ativo="projeto" />
        <div className="heroi__texto">
          <p className="selo mono">
            <span className="selo__ponto" />
            {brand.phaseBadge}
          </p>
          <h1>{brand.product}</h1>
          <p className="heroi__linha">uma exploração orbital construída em público</p>
          <dl className="ficha">
            {FICHA.map((item) => (
              <div key={item.rotulo} className="ficha__item">
                <dt className="mono">{item.rotulo}</dt>
                <dd>{item.valor}</dd>
              </div>
            ))}
          </dl>
          <div className="apenas-movel">
            <Seta href="#o-que-e" direcao="baixo" regua>
              descer para o projeto
            </Seta>
          </div>
        </div>
      </div>

      <Secao numero="01" rotulo="o que é" titulo="O que é" id="o-que-e">
        <div className="colunas">
          <p>
            Iniciativa Sephir é um jogo de exploração orbital: você não pilota uma
            nave por corredores, você escolhe uma órbita e vive com as
            consequências dela — combustível, tempo, e a geometria do espaço ao
            redor de um corpo central.
          </p>
          <p>
            A escala é astrofísica, não arcade. Distâncias, massas e períodos
            seguem a física de dois corpos de verdade, renderizada em tempo real
            por um motor N-corpos próprio — não uma aproximação visual por trás
            de uma trilha fixa.
          </p>
          <p>
            A trajetória entre duas órbitas não é uma linha reta desenhada por
            cima: é uma cônica emendada à outra no ponto de manobra, resolvida
            numericamente a cada quadro. É a escolha de método que dá nome ao
            resto do projeto.
          </p>
        </div>
      </Secao>

      <Secao numero="02" rotulo="estado atual" titulo="Estado atual">
        <div className="lista">
          {ESTADO.map((item) => (
            <Linha key={item.texto} colunas="estado">
              <p className={`linha__rotulo linha__rotulo--${item.tom}`}>{item.rotulo}</p>
              <p className="linha__corpo">{item.texto}</p>
            </Linha>
          ))}
          <div className="lista__fecho" />
        </div>
      </Secao>

      <Secao numero="03" rotulo="como é feito" titulo="Como é feito">
        <div className="metodo">
          <div>
            <p className="metodo__texto">
              Cada rodada passa por uma pipeline de oito portões, e cada portão é um
              arquivo — não uma reunião, não uma promessa. Nada avança de um portão
              para o outro sem um oráculo numérico que confirme que o passo anterior
              aconteceu de verdade.
            </p>
            <Seta href="/pt/como-e-feito/" regua>
              ver o método
            </Seta>
          </div>
          <ol className="grade-portoes" aria-label="os oito portões da pipeline">
            {PORTOES.map((n, i) => (
              <li
                key={n}
                className={i < PORTOES_CUMPRIDOS ? 'portao portao--cumprido' : 'portao'}
              >
                {n}
              </li>
            ))}
          </ol>
        </div>
      </Secao>
    </>
  );
}
