// "/" — apenas encaminha para "/pt/". Conteúdo mínimo: a home de verdade é
// da Tarefa 4. O redirecionamento vai por <meta refresh> (React 19 iça para
// <head>) mais um <a> visível para o mesmo destino — os dois por caminho().
import { caminho } from '../../lib/caminho';

export default function Casca() {
  const destino = caminho('/pt/');
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${destino}`} />
      <a href={destino}>Iniciativa Sephir</a>
    </>
  );
}
