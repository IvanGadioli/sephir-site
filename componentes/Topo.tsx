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
      <details className="menu-movel">
        <summary aria-label="abrir o menu">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </summary>
        <nav className="menu-movel__lista" aria-label="seções, menu móvel">
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
              >
                {item.rotulo}
              </a>
            ),
          )}
        </nav>
      </details>
    </div>
  );
}
