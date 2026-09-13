import type { Metadata } from 'next';
import { IDIOMAS } from '../../../lib/rotas';
import { caminho } from '../../../lib/caminho';
import { Topo } from '../../../components/Topo';
import { Rodape } from '../../../components/Rodape';

export function generateStaticParams() {
  return IDIOMAS.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export const metadata: Metadata = {
  title: 'Iniciativa Sephir — Simulação física do cosmos, jogável.',
  description:
    'Um jogo de exploração orbital em que a escala é astrofísica, não arcade. Construído em público.',
};

// Os três blocos de estado, na estrutura do design: EXISTE, EM CONSTRUÇÃO e
// NÃO EXISTE. Os textos são os de `Main.dc.html`, com DUAS CORREÇÕES DE FATO
// marcadas abaixo — ver o comentário de cada uma.
const ESTADO = [
  {
    rotulo: 'existe',
    classe: 'existe',
    texto:
      'O pipeline de produção documentado em oito portões — escopo, spec, oráculo, teste, implementação, verificação, relatório, encerramento.',
  },
  {
    rotulo: 'existe',
    classe: 'existe',
    texto: 'Este site, publicado como export estático, sem servidor por trás.',
  },
  // CORREÇÃO DE FATO 1. O design punha isto sob EXISTE, como "O motor
  // N-corpos: física de dois corpos de verdade, renderizada em tempo real".
  // Medido em ~/Documents/sephir_game em 2026-09-12: 255 linhas no total, só
  // cabeçalhos com declarações — `resolverKepler` está declarado e não
  // definido —, `core/src/` com 7 linhas, e os testes são fumaça e compilação
  // de cabeçalho. A engine N-corpos anterior (~/Documents/sephir) está
  // abandonada desde 2026-09-01. Movido para EM CONSTRUÇÃO com o texto que a
  // medição sustenta. Reverter isto é publicar afirmação falsa num site que
  // entra em edital.
  {
    rotulo: 'em construção',
    classe: 'construindo',
    texto:
      'O núcleo de órbitas em C++: a API de cônicas emendadas e da equação de Kepler está declarada e compila; a implementação numérica é a próxima rodada.',
  },
  {
    rotulo: 'em construção',
    classe: 'construindo',
    texto:
      'Capturas de tela e vídeo do jogo em execução — quando existir, entra numa rota nova, não numa reescrita desta.',
  },
  { rotulo: 'não existe', classe: 'ausente', texto: 'Página de devlog.' },
  { rotulo: 'não existe', classe: 'ausente', texto: 'Versão jogável pública.' },
  {
    rotulo: 'não existe',
    classe: 'ausente',
    texto: 'Suporte a mais de um idioma.',
  },
] as const;

export default function Home() {
  return (
    <>
      <header className="heroi">
        {/* O pôster é o elemento de LCP e está no HTML servido, não pintado por
            JavaScript — é o que `adr-fab-002` exige e o que mantém a conta de
            LCP de W4 válida. width/height explícitos existem para não gerar
            deslocamento de layout: CLS tem teto de 0,05. */}
        <img
          className="heroi__fundo"
          src={caminho('/poster/heroi.webp')}
          alt=""
          width={1600}
          height={900}
          fetchPriority="high"
        />
        <div className="heroi__veu" />
        <div className="heroi__conteudo">
          <div className="envoltorio">
            <Topo />
            <p className="selo">fase Semente Cósmica · rumo à 1.0</p>
            <h1>Iniciativa Sephir</h1>
            <p className="tagline">
              uma exploração orbital construída em público
            </p>
            <div className="tiles">
              {/* CORREÇÃO DE FATO 2. O design dizia "MOTOR: Unreal Engine 5".
                  Não existe projeto Unreal em ~/Documents/sephir_game — não há
                  .uproject, .uplugin nem Source/, e o commit do esqueleto diz
                  literalmente "core sem Unreal". O tile passa a dizer o que a
                  medição sustenta. */}
              <div className="tile">
                <div className="tile__rotulo">núcleo</div>
                <div className="tile__valor">C++</div>
              </div>
              <div className="tile">
                <div className="tile__rotulo">simulação</div>
                <div className="tile__valor">cônicas emendadas</div>
              </div>
              <div className="tile">
                <div className="tile__rotulo">fase</div>
                <div className="tile__valor">Semente Cósmica</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="secao" id="o-que-e">
          <div className="envoltorio">
            <p className="secao__indice">
              <strong>01</strong> — o que é
            </p>
            <h2>O que é</h2>
            <p>
              Iniciativa Sephir é um jogo de exploração orbital: você não pilota
              uma nave por corredores, você escolhe uma órbita e vive com as
              consequências dela — combustível, tempo, e a geometria do espaço ao
              redor de um corpo central.
            </p>
            {/* CORREÇÃO DE FATO 3, da mesma família da 1: o design dizia
                "renderizada em tempo real por um motor N-corpos próprio", o que
                afirma capacidade presente. A frase passa a descrever o método
                escolhido, sem alegar que já roda. */}
            <p>
              A escala é astrofísica, não arcade. Distâncias, massas e períodos
              seguem a física de dois corpos de verdade, resolvida
              analiticamente — não uma aproximação visual por trás de uma trilha
              fixa.
            </p>
            <p>
              A trajetória entre duas órbitas não é uma linha reta desenhada por
              cima: é uma cônica emendada à outra no ponto de manobra, resolvida
              numericamente a cada quadro. É a escolha de método que dá nome ao
              resto do projeto.
            </p>
          </div>
        </section>

        <section className="secao" id="estado-atual">
          <div className="envoltorio">
            <p className="secao__indice">
              <strong>02</strong> — estado atual
            </p>
            <h2>Estado atual</h2>
            <ul className="estado">
              {ESTADO.map((item) => (
                <li key={item.texto}>
                  <span
                    className={`estado__rotulo estado__rotulo--${item.classe}`}
                  >
                    {item.rotulo}
                  </span>
                  <span className="estado__texto">{item.texto}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="secao" id="como-e-feito">
          <div className="envoltorio">
            <p className="secao__indice">
              <strong>03</strong> — como é feito
            </p>
            <h2>Como é feito</h2>
            <p>
              Cada rodada passa por uma pipeline de oito portões, e cada portão é
              um arquivo — não uma reunião, não uma promessa. Nada avança de um
              portão para o outro sem um oráculo numérico que confirme que o
              passo anterior aconteceu de verdade.
            </p>
            <div className="portoes" aria-label="os oito portões">
              {['00', '01', '02', '03', '04', '05', '06', '07'].map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
            <a className="elo" href={caminho('/pt/sobre/')}>
              ver o método
            </a>
          </div>
        </section>
      </main>

      <Rodape />
    </>
  );
}
