import type { Metadata } from 'next';
import { Faixa } from '../../../componentes/Faixa.tsx';
import { Secao } from '../../../componentes/Secao.tsx';

export const metadata: Metadata = { title: 'Sobre — Iniciativa Sephir' };

export default function Sobre() {
  return (
    <>
      <Faixa titulo="Sobre" ativo="sobre" imagem="/poster/heroi.webp" />

      <Secao numero="01" rotulo="quem" titulo="Quem">
        <p className="prosa">
          Ivan Gadioli, estudante de Ciência da Computação em Brasília. O
          Iniciativa Sephir nasceu como projeto pessoal de simulação orbital e
          virou o objeto principal de estudo e produção deste período do curso.
        </p>
      </Secao>

      <Secao numero="02" rotulo="contexto" titulo="Contexto">
        <p className="prosa">
          O trabalho se apoia em dois grupos: o AstroIDP, de astrofísica
          computacional, onde a física de N corpos e a integração numérica do
          projeto foram testadas fora do jogo; e o IEEE Student Branch
          Brasília, onde parte da infraestrutura e da disciplina de produção
          em público foi exercitada.
        </p>
      </Secao>

      <Secao numero="03" rotulo="ferramentas" titulo="Ferramentas">
        <p className="prosa">
          O jogo é construído em Unreal Engine 5 e C++, com Houdini para a
          geração procedural de parte dos ativos. A infraestrutura — deste
          site incluído — é própria: hospedagem, domínio e pipeline de
          produção não dependem de plataforma de terceiro além do necessário
          para publicar.
        </p>
      </Secao>

      <Secao numero="04" rotulo="o projeto" titulo="O projeto">
        <p className="prosa">
          O Iniciativa Sephir é proposto pela Sephir Studio Inova Simples
          (I.S.), CNPJ 63.037.641/0001-30, como projeto do edital FAPDF. Este
          site é o endereço público desse projeto: o código do jogo, do site
          e o histórico de decisões de produção estão nos repositórios
          ligados no rodapé.
        </p>
      </Secao>

      <Secao numero="05" rotulo="contato" titulo="Contato">
        <p className="prosa">
          Sem formulário — não há servidor por trás deste site. Escreva ou
          acompanhe o desenvolvimento pelos endereços abaixo.
        </p>
        <div className="cartoes">
          <div className="cartao">
            <p className="cartao__rotulo mono">e-mail</p>
            <a className="cartao__valor" href="mailto:ivanilson.gadioli2@gmail.com">
              ivanilson.gadioli2@gmail.com
            </a>
          </div>
          <div className="cartao">
            <p className="cartao__rotulo mono">github</p>
            <a className="cartao__valor" href="https://github.com/IvanGadioli">
              github.com/IvanGadioli
            </a>
          </div>
        </div>
      </Secao>
    </>
  );
}
