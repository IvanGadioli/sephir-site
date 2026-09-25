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

// Diretiva: ancorada em início de linha. Prosa que mencione a diretiva não casa.
const DIRETIVA_CLIENTE = /^\s*(['"])use client\1/m;

// Hook: casa a CHAMADA, não a palavra. Foi o falso positivo da primeira execução
// desta tarefa — `componentes/Topo.tsx:5` menciona `usePathname` em prosa, sem
// parêntese, para explicar por que o componente continua no servidor. Uma menção
// não é um uso. Casar a sintaxe de chamada resolve isso sem precisar descontar
// comentário (a correção anterior, com `semComentarios`, foi removida — trazia
// dois casos de borda simétricos: apagava o resto de uma linha com URL
// protocol-relative como `href="//exemplo.com"`, e preservava um comentário
// colado após dois-pontos como `case 'x':// nota`). Efeito colateral bom e
// intencional: um hook comentado, tipo `// const [x] = useState(false)`,
// também reprova — código de cliente morto dentro de componente de servidor é
// sujeira que vale sinalizar, não é bug deste teste.
const HOOKS_CLIENTE = ['useState', 'useEffect', 'useRef', 'usePathname', 'useRouter'];

// A chamada pode levar argumento de tipo: `useRef<HTMLCanvasElement>(null)` é a
// forma idiomática em TSX. Sem o grupo opcional `<...>`, um vazamento escrito
// assim passaria batido — falso negativo, que é pior que o falso positivo que
// esta abordagem substituiu.
const chamadaDeHook = (hook: string) => new RegExp(`\\b${hook}\\s*(<[^>]*>)?\\s*\\(`);

describe("a fronteira de 'use client'", () => {
  it('só aparece dentro de componentes/heroi/', () => {
    const fora = [...listarFontes('app'), ...listarFontes('componentes'), ...listarFontes('lib')]
      .filter((f) => DIRETIVA_CLIENTE.test(readFileSync(f, 'utf8')))
      .filter((f) => !f.startsWith(join('componentes', 'heroi')));
    expect(fora).toEqual([]);
  });

  it('nenhuma rota, nenhum layout e nenhum dos seis componentes é cliente', () => {
    const proibidos = [
      'app/layout.tsx', 'app/page.tsx', 'app/not-found.tsx',
      'componentes/Topo.tsx', 'componentes/Rodape.tsx', 'componentes/Faixa.tsx',
      'componentes/Secao.tsx', 'componentes/Linha.tsx', 'componentes/Seta.tsx',
    ];
    const clientes = proibidos.filter((f) => DIRETIVA_CLIENTE.test(readFileSync(f, 'utf8')));
    expect(clientes).toEqual([]);
  });

  it('nenhum hook de cliente vaza para um componente de servidor', () => {
    const vazamentos: string[] = [];
    for (const arquivo of listarFontes('componentes').filter(
      (f) => !f.startsWith(join('componentes', 'heroi')),
    )) {
      const texto = readFileSync(arquivo, 'utf8');
      for (const hook of HOOKS_CLIENTE) {
        if (chamadaDeHook(hook).test(texto)) vazamentos.push(`${arquivo}: ${hook}`);
      }
    }
    expect(vazamentos).toEqual([]);
  });
});
