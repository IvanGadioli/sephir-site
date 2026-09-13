import type { Metadata } from 'next';
import { IDIOMAS } from '../../../../lib/rotas';
import { caminho } from '../../../../lib/caminho';
import { Topo } from '../../../../components/Topo';
import { Rodape } from '../../../../components/Rodape';

export function generateStaticParams() {
  return IDIOMAS.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export const metadata: Metadata = {
  title: 'Sobre — Iniciativa Sephir',
  description:
    'Quem faz o Iniciativa Sephir, em que contexto, com que ferramentas, e como entrar em contato.',
};

export default function Sobre() {
  return (
    <>
      <header className="heroi">
        {/* O mesmo pôster da home, e por dois motivos que coincidem: é o que
            `Sobre.dc.html` desenha, e põe o elemento de LCP como <img> com
            prioridade alta em vez de um bloco de texto — a primeira versão
            desta página, sem imagem, media LCP 2 570 ms contra teto de 2 500. */}
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
            <p className="selo">quem faz</p>
            <h1>Sobre</h1>
          </div>
        </div>
      </header>

      <main>
        <section className="secao" id="quem">
          <div className="envoltorio">
            <p className="secao__indice">— quem</p>
            <h2>Quem</h2>
            <p>
              Ivan Gadioli, estudante de Ciência da Computação em Brasília. O
              Iniciativa Sephir nasceu como projeto pessoal de simulação orbital
              e virou o objeto principal de estudo e produção deste período do
              curso.
            </p>
          </div>
        </section>

        <section className="secao" id="contexto">
          <div className="envoltorio">
            <p className="secao__indice">— contexto</p>
            <h2>Contexto</h2>
            <p>
              O trabalho se apoia em dois grupos: o AstroIDP, de astrofísica
              computacional, onde a física de N corpos e a integração numérica do
              projeto foram testadas fora do jogo; e o IEEE Student Branch
              Brasília, onde parte da infraestrutura e da disciplina de produção
              em público foi exercitada.
            </p>
          </div>
        </section>

        <section className="secao" id="ferramentas">
          <div className="envoltorio">
            <p className="secao__indice">— ferramentas</p>
            <h2>Ferramentas</h2>
            {/* CORREÇÃO DE TEMPO VERBAL. O design diz "O jogo é construído em
                Unreal Engine 5 e C++". Medido em ~/Documents/sephir_game em
                2026-09-12: não há projeto Unreal — sem .uproject, sem Source/,
                e o commit do esqueleto diz "core sem Unreal". A frase passa a
                separar o que já é núcleo (C++) do que é camada prevista (UE5),
                sem deixar de nomear a mesma pilha do design. */}
            <p>
              O núcleo do jogo é escrito em C++, com Unreal Engine 5 prevista
              para a camada de apresentação e Houdini para a geração procedural
              de parte dos ativos. A infraestrutura — deste site incluído — é
              própria: hospedagem, domínio e pipeline de produção não dependem de
              plataforma de terceiro além do necessário para publicar.
            </p>
          </div>
        </section>

        <section className="secao" id="o-projeto">
          <div className="envoltorio">
            <p className="secao__indice">— o projeto</p>
            <h2>O projeto</h2>
            <p>
              O Iniciativa Sephir é proposto pela Sephir Studio Inova Simples
              (I.S.), CNPJ 63.037.641/0001-30, como projeto do edital FAPDF. Este
              site é o endereço público desse projeto: o código do jogo, do site
              e o histórico de decisões de produção estão nos repositórios ligados
              no rodapé.
            </p>
          </div>
        </section>

        <section className="secao" id="contato">
          <div className="envoltorio">
            <p className="secao__indice">— contato</p>
            <h2>Contato</h2>
            <p>
              Sem formulário — não há servidor por trás deste site. Escreva ou
              acompanhe o desenvolvimento pelos endereços abaixo.
            </p>
            <ul className="estado" style={{ marginTop: 'var(--espaco-lg)' }}>
              <li>
                <span className="estado__rotulo estado__rotulo--existe">
                  e-mail
                </span>
                <span className="estado__texto">
                  <a className="elo" href="mailto:ivanilson.gadioli2@gmail.com">
                    ivanilson.gadioli2@gmail.com
                  </a>
                </span>
              </li>
              <li>
                <span className="estado__rotulo estado__rotulo--existe">
                  github
                </span>
                <span className="estado__texto">
                  <a
                    className="elo"
                    href="https://github.com/IvanGadioli"
                    rel="noopener noreferrer"
                  >
                    github.com/IvanGadioli
                  </a>
                </span>
              </li>
            </ul>
            <a className="elo" href={caminho('/pt/')}>
              voltar para a home
            </a>
          </div>
        </section>
      </main>

      <Rodape />
    </>
  );
}
