import { Rodape } from '../componentes/Rodape.tsx';
import { Seta } from '../componentes/Seta.tsx';
import { Topo } from '../componentes/Topo.tsx';

export default function NaoEncontrado() {
  return (
    <>
      <div className="erro">
        <Topo ativo={null} />
        <div className="erro__miolo">
          <img src="/marca/logo.webp" alt="Sephir Studio" width={260} height={146} />
          <p className="erro__codigo mono">404</p>
          <h1>Esta órbita não existe</h1>
          <p className="erro__texto">
            A rota não corresponde a nenhuma página publicada. Ela pode ter mudado
            de endereço ou nunca ter existido.
          </p>
          <Seta href="/pt/">voltar para o início</Seta>
        </div>
      </div>
      <Rodape />
    </>
  );
}
