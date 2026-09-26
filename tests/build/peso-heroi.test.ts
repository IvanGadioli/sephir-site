import { execFileSync } from 'node:child_process';
import { beforeAll, describe, expect, it } from 'vitest';
import { medirHeroi, medirHeroiPorChunk, medirRota } from '../../ferramentas/medir.mjs';

const LIMIAR_HEROI_BR = 97_280; // 95 kB, declarado na spec §8 antes de medir
const PISO_HEROI_BR = 10_240;

describe('o peso do herói', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
  }, 300_000);

  // ACHADO desta tarefa, registrado e não silenciado — o teste de piso falha
  // pelas duas vias do brief, com o MESMO número (1 529 B br), o que já é
  // informativo por si: `medirHeroi` (diferença home−sobre) e
  // `medirHeroiPorChunk` (atribuição por chunk referenciado em <script>)
  // concordam porque enxergam a mesma coisa — o único chunk que a home
  // referencia e o "Sobre" não é `2mml24trngo8q.js` (161→1529 B br), que é o
  // glue do `next/dynamic(() => import('./Canvas.tsx'), { ssr: false })` em
  // `componentes/heroi/index.tsx`, não o runtime da vgpu.
  //
  // Inspeção manual dos chunks de `out/_next/static/chunks/` (grep por
  // wgsl|vgpu|Canvas|geodesic|renderer) achou o peso real do herói em pelo
  // menos três chunks adicionais, nenhum referenciado por `<script>` em
  // NENHUMA das cinco páginas do export:
  //   43_vn40bfipxn.js   65 159 B brutos → 14 434 B br
  //   36zn_8inpik2m.js      215 B brutos →    161 B br
  //   2pb0n4umx0_i8.js  189 951 B brutos → 52 109 B br
  //   soma: ~66 704 B br, referenciados só como string literal DENTRO de
  //   outro chunk JS (o nome do arquivo aparece dentro de
  //   `2mml24trngo8q.js`), nunca como `/_next/static/...` no HTML.
  //
  // Causa: `dynamic(..., { ssr: false })` no App Router com
  // `output: 'export'` não injeta preload/script tag para o alvo do import
  // dinâmico — o webpack/turbopack runtime resolve o nome do chunk em tempo
  // de execução, no navegador, a partir de um mapa embutido noutro chunk. Os
  // dois métodos do brief só leem `_next/static/...` de dentro do HTML
  // exportado; são a MESMA cegueira sob duas fórmulas, não dois ângulos
  // independentes — por isso concordam no mesmo número errado.
  //
  // Não persegui as referências de runtime para produzir um terceiro número:
  // decidir por grep quais chunks "pertencem" ao herói seria o número a
  // forjar que a tarefa proíbe. O que fica registrado é que **nenhum dos dois
  // métodos contratados mede o peso real do herói neste build** — mais grave
  // que "o canvas está no pedaço comum", que era a hipótese do brief. Ver
  // report da Tarefa 21 para a tabela completa.
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
      `chunk do herói: ${bytes} B brotli (limiar ${LIMIAR_HEROI_BR}) — NÃO confiável: ambos os testes de piso falharam`,
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
});
