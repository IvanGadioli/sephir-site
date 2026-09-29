import { brand } from '../lib/marca.ts';

export function Rodape() {
  return (
    <footer className="rodape envoltorio">
      <div className="rodape__interno">
        <div className="rodape__marca">
          <img src="/marca/logo.webp" alt="Sephir Studio" width={150} height={84} />
          <p className="rodape__tagline">{brand.tagline}</p>
          <p className="rodape__cnpj">{brand.cnpj}</p>
        </div>
        <div className="rodape__links">
          <a href="https://github.com/IvanGadioli">GitHub</a>
          <a href="mailto:ivanilson.gadioli2@gmail.com">contato</a>
        </div>
      </div>
    </footer>
  );
}
