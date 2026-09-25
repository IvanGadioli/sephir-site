import type { Metadata } from 'next';
import { Faixa } from '../../../componentes/Faixa.tsx';
import { Linha } from '../../../componentes/Linha.tsx';

export const metadata: Metadata = { title: 'Como é feito — Iniciativa Sephir' };

const PORTOES = [
  { n: '00', nome: 'escopo', pergunta: 'isso deve ser feito agora?' },
  { n: '01', nome: 'contexto', pergunta: 'o que o planejador leu antes de decidir?' },
  { n: '02', nome: 'spec', pergunta: 'a spec está fechada e falseável?' },
  { n: '03', nome: 'oráculo', pergunta: 'qual medida externa prova isso, e sob qual limiar?' },
  { n: '04', nome: 'testes', pergunta: 'os testes falham hoje pelo motivo certo?' },
  { n: '05', nome: 'diff', pergunta: 'o código faz os testes passarem?' },
  { n: '06', nome: 'relatório', pergunta: 'passou, e passou pelo motivo certo?' },
  { n: '07', nome: 'encerramento', pergunta: 'fechado, com como reverter.' },
] as const;

export default function ComoEFeito() {
  return (
    <>
      <Faixa titulo="Como é feito" ativo="como-e-feito" regua />

      <div className="envoltorio abertura">
        <p className="prosa prosa--larga">
          Cada portão desta pipeline é um arquivo — não uma reunião, não uma
          promessa. O arquivo existir é o estado do portão: se ele não foi
          escrito, o portão não passou, ponto final. Nada avança de uma etapa
          para a seguinte sem que a etapa anterior esteja escrita e aprovada, e a
          ordem abaixo é a ordem real em que qualquer rodada — deste site ou do
          jogo — é produzida.
        </p>
      </div>

      <div className="envoltorio">
        <div className="lista">
          {PORTOES.map((p) => (
            <Linha key={p.n} colunas="portao">
              <p className="linha__numero">{p.n}</p>
              <p className="linha__corpo">{p.nome}</p>
              <p className="linha__nota">{p.pergunta}</p>
            </Linha>
          ))}
          <div className="lista__fecho" />
        </div>
      </div>

      <div className="envoltorio regra-dura">
        <div className="caixa">
          <p className="caixa__titulo">
            04 antes de 05 — o teste é escrito antes do código, sempre
          </p>
          <p className="caixa__corpo">
            Teste escrito depois do código testa o código que existe, não o
            comportamento que deveria existir — confirma o que já está pronto, não
            o que estava certo pedir. O oráculo do portão 03 é numérico exatamente
            para que essa régua não dependa de olhar a tela depois.
          </p>
        </div>
      </div>
    </>
  );
}
