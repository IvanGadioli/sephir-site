import { ITENS_MENU, type ChaveMenu } from '../lib/rotas.ts';

// O Topo não mora no layout: nos artboards internos ele é position:absolute
// dentro da Faixa, e na home é absoluto sobre o herói. Além disso o item
// ativo muda por página, e lê-lo no layout exigiria usePathname — componente
// cliente, JS numa página que não precisa de nenhum. Ver spec §4.
export function Topo({ ativo }: { ativo: ChaveMenu | null }) {
  return (
    <div className="topo">
      <p className="wordmark">
        <span className="wordmark__sephir">Sephir</span>
        <span className="wordmark__studio"> Studio</span>
      </p>
      <nav className="navegacao" aria-label="seções">
        {ITENS_MENU.map((item) =>
          item.href === null ? (
            <span key={item.chave} className="navegacao__ausente">
              {item.rotulo}
            </span>
          ) : (
            <a
              key={item.chave}
              href={item.href}
              className={item.chave === ativo ? 'navegacao__ativo' : undefined}
              aria-current={item.chave === ativo ? 'page' : undefined}
            >
              {item.rotulo}
            </a>
          ),
        )}
      </nav>
    </div>
  );
}
