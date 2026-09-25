import { describe, expect, it } from 'vitest';
import { HTML_ESPERADOS, ITENS_MENU, ROTAS } from '../../lib/rotas.ts';

describe('a tabela de rotas', () => {
  it('declara as cinco rotas da spec', () => {
    expect(ROTAS.map((r) => r.rota)).toEqual([
      '/', '/pt/', '/pt/sobre/', '/pt/como-e-feito/',
    ]);
  });

  it('espera exatamente cinco arquivos HTML', () => {
    expect([...HTML_ESPERADOS]).toEqual([
      '404.html', 'index.html', 'pt/como-e-feito/index.html',
      'pt/index.html', 'pt/sobre/index.html',
    ]);
  });

  it('só aponta o menu para rota que existe, ou para nenhuma', () => {
    const conhecidas = new Set(ROTAS.map((r) => r.rota));
    for (const item of ITENS_MENU) {
      if (item.href === null) continue;
      const semFragmento = item.href.split('#')[0];
      expect(conhecidas).toContain(semFragmento);
    }
  });

  it('deixa devlog sem href, porque a página não existe', () => {
    const devlog = ITENS_MENU.find((i) => i.chave === 'devlog');
    expect(devlog?.href).toBeNull();
  });
});
