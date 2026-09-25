import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function listarFontes(raiz: string): string[] {
  const achados: string[] = [];
  for (const entrada of readdirSync(raiz)) {
    const caminho = join(raiz, entrada);
    if (statSync(caminho).isDirectory()) achados.push(...listarFontes(caminho));
    else if (/\.(ts|tsx)$/.test(entrada)) achados.push(caminho);
  }
  return achados;
}

// Achado da própria auto-revisão desta tarefa: um `toContain(hook)` cru acerta
// também um comentário em prosa que só *explica* por que o hook não foi
// usado (caso real: componentes/Topo.tsx linha 5, citando `usePathname` para
// justificar por que o componente continua no servidor). Isso é falso
// positivo do teste, não vazamento real — a asserção quer pegar uso de hook,
// não a palavra. Descontar comentário aqui; `://` fica de fora do corte para
// não mutilar URL como `https://github.com/...` num atributo `href`.
function semComentarios(texto: string): string {
  return texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe("a fronteira de 'use client'", () => {
  it('só aparece dentro de componentes/heroi/', () => {
    const fontes = [...listarFontes('app'), ...listarFontes('componentes'), ...listarFontes('lib')];
    const clientes = fontes.filter((f) => {
      const texto = readFileSync(f, 'utf8');
      return /^\s*(['"])use client\1/m.test(texto);
    });
    for (const cliente of clientes) {
      expect(cliente.startsWith(join('componentes', 'heroi'))).toBe(true);
    }
  });

  it('nenhuma rota, nenhum layout e nenhum dos seis componentes é cliente', () => {
    const proibidos = [
      'app/layout.tsx', 'app/page.tsx', 'app/not-found.tsx',
      'componentes/Topo.tsx', 'componentes/Rodape.tsx', 'componentes/Faixa.tsx',
      'componentes/Secao.tsx', 'componentes/Linha.tsx', 'componentes/Seta.tsx',
    ];
    for (const arquivo of proibidos) {
      expect(readFileSync(arquivo, 'utf8')).not.toContain('use client');
    }
  });

  it('nenhum hook de cliente vaza para um componente de servidor', () => {
    const fontes = listarFontes('componentes').filter(
      (f) => !f.startsWith(join('componentes', 'heroi')),
    );
    for (const arquivo of fontes) {
      const texto = semComentarios(readFileSync(arquivo, 'utf8'));
      for (const hook of ['useState', 'useEffect', 'useRef', 'usePathname', 'useRouter']) {
        expect(texto).not.toContain(hook);
      }
    }
  });
});
