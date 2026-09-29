import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  medirHeroi,
  medirHeroiPorChunk,
  medirHeroiPorNavegador,
  medirRota,
} from '../../ferramentas/medir.mjs';

const LIMIAR_HEROI_BR = 97_280; // 95 kB, declarado na spec §8 antes de medir
const PISO_HEROI_BR = 10_240;
const PORTA_SONDA = 4183; // dedicada, para não colidir com a 4173 do E2E

async function esperarServidor(url: string, tentativas = 50): Promise<void> {
  for (let i = 0; i < tentativas; i++) {
    try {
      const resposta = await fetch(url);
      if (resposta.ok || resposta.status === 404) return;
    } catch {
      // servidor ainda não subiu — tenta de novo
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`servidor não respondeu em ${url}`);
}

describe('o peso do herói', () => {
  let servidor: ChildProcess;

  beforeAll(async () => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
    servidor = spawn('node', ['tests/support/servidor-estatico.mjs', 'out', String(PORTA_SONDA)], {
      stdio: 'ignore',
    });
    await esperarServidor(`http://localhost:${PORTA_SONDA}/pt/`);
  }, 300_000);

  afterAll(() => {
    servidor?.kill();
  });

  // ACHADO desta tarefa, registrado e não silenciado — o teste de piso falha
  // pelas duas vias do brief, com o MESMO número (1 529 B br), o que já é
  // informativo por si: `medirHeroi` (diferença home−sobre) e
  // `medirHeroiPorChunk` (atribuição por chunk referenciado em <script>)
  // concordam porque enxergam a mesma coisa — o único chunk que a home
  // referencia e o "Sobre" não é `2mml24trngo8q.js` (1529 B br), que é o
  // glue do `next/dynamic(() => import('./Canvas.tsx'), { ssr: false })` em
  // `componentes/heroi/index.tsx`, não o runtime da vgpu.
  //
  // Causa: `dynamic(..., { ssr: false })` no App Router com
  // `output: 'export'` não injeta preload/script tag para o alvo do import
  // dinâmico — o webpack/turbopack runtime resolve o nome do chunk em tempo
  // de execução, no navegador, a partir de um mapa embutido noutro chunk. Os
  // dois métodos abaixo só leem `_next/static/...` de dentro do HTML
  // exportado; são a MESMA cegueira sob duas fórmulas, não dois ângulos
  // independentes — por isso concordam no mesmo número pequeno demais.
  //
  // Estes dois testes FICAM, marcados `.fails()`: documentam que a medição
  // por HTML é estruturalmente inválida para este build, e essa é
  // informação que a Tarefa 23 precisa. O terceiro método — o navegador real
  // como fonte de "quais arquivos", o brotli em disco como fonte de "quanto
  // cada um pesa" — está no describe aninhado logo abaixo, e é o número que
  // deve entrar na comparação. Ver o report da Tarefa 21 para a tabela
  // completa de achados.
  it.fails('mede alguma coisa pela diferença home−sobre: o herói não pode custar zero', () => {
    expect(medirHeroi('out')).toBeGreaterThan(PISO_HEROI_BR);
  });

  it.fails('mede alguma coisa por atribuição de chunk: o herói não pode custar zero', () => {
    // Fallback do Step 3 do brief. Dá o MESMO número que a diferença — ver o
    // comentário acima do primeiro teste de piso para o porquê.
    expect(medirHeroiPorChunk('out')).toBeGreaterThan(PISO_HEROI_BR);
  });

  it('o chunk do herói cabe no limiar declarado — número não confiável, ver achado acima', () => {
    const bytes = medirHeroi('out');
    console.log(
      `chunk do herói (por HTML): ${bytes} B brotli (limiar ${LIMIAR_HEROI_BR}) — NÃO confiável: ambos os testes de piso por HTML falharam. Número que importa: o do describe "via navegador real" abaixo.`,
    );
    expect(bytes).toBeLessThanOrEqual(LIMIAR_HEROI_BR);
  });

  it('as rotas sem herói não pagam por ele', () => {
    const sobre = medirRota('out', 'pt/sobre/index.html');
    const comoEFeito = medirRota('out', 'pt/como-e-feito/index.html');
    // As duas carregam o mesmo piso de framework, sem nada do canvas.
    expect(Math.abs(sobre.js - comoEFeito.js)).toBeLessThan(2_048);
  });

  it('a casca de / não carrega o herói', () => {
    const casca = medirRota('out', 'index.html');
    const home = medirRota('out', 'pt/index.html');
    expect(casca.js).toBeLessThan(home.js);
  });

  // Terceiro método, corrigindo o ponto cego dos dois de cima: o navegador
  // real decide QUAIS arquivos (via rede — `page.on('response')`, o mesmo
  // recurso que `tests/e2e/marca.spec.ts` já usa para provar que nenhuma
  // fonte vem de CDN), e o brotli em disco decide QUANTO cada um pesa — não
  // o `transfer size` da resposta, que o servidor de teste serve sem
  // compressão e mentiria.
  describe('via navegador real (o número que vale)', () => {
    let resultado: Awaited<ReturnType<typeof medirHeroiPorNavegador>>;

    beforeAll(async () => {
      resultado = await medirHeroiPorNavegador(`http://localhost:${PORTA_SONDA}`, 'out');
      console.log('--- /pt/ pediu ---');
      console.log(resultado.home.join('\n'));
      console.log('--- /pt/sobre/ pediu ---');
      console.log(resultado.sobre.join('\n'));
      console.log('--- exclusivos da home (a diferença) ---');
      console.log(resultado.exclusivos.join('\n'));
      console.log('--- brotli por arquivo exclusivo ---');
      for (const [url, bytes] of Object.entries(resultado.detalhe)) {
        console.log(`${String(bytes).padStart(8)} br  ${url}`);
      }
      console.log(
        `\nchunk do herói (navegador): ${resultado.total} B brotli (limiar ${LIMIAR_HEROI_BR})`,
      );
    }, 60_000);

    it('mede alguma coisa: o herói não pode custar zero', () => {
      expect(resultado.total).toBeGreaterThan(PISO_HEROI_BR);
    });

    it('o chunk do herói cabe no limiar declarado', () => {
      expect(resultado.total).toBeLessThanOrEqual(LIMIAR_HEROI_BR);
    });
  });
});
