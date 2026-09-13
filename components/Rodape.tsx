// Lockup completo, tagline e a razão social. `studio` só aparece aqui — é a
// regra de nomenclatura travada em 30/07/2026 (skill `marca-sephir`).
export function Rodape() {
  return (
    <footer className="rodape">
      <div className="envoltorio">
        <p className="rodape__lockup">Sephir Studio — Iniciativa Sephir</p>
        <p className="rodape__tagline">Simulação física do cosmos, jogável.</p>
        <p className="rodape__juridico">
          Sephir Studio Inova Simples (I.S.) — CNPJ 63.037.641/0001-30
        </p>
        {/* O design põe estes dois como href="#". A seção "O projeto" da página
            Sobre promete "os repositórios ligados no rodapé", então link morto
            aqui quebra uma promessa escrita. Endereços reais, os mesmos que a
            Sobre publica. */}
        <div className="rodape__elos">
          <a href="https://github.com/IvanGadioli" rel="noopener noreferrer">
            GitHub
          </a>
          <a href="mailto:ivanilson.gadioli2@gmail.com">contato</a>
        </div>
      </div>
    </footer>
  );
}
