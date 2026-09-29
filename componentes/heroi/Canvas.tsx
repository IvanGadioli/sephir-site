'use client';

import { useEffect, useRef, useState } from 'react';
import { criarRenderer } from './renderer.ts';

// Divergência deliberada do brief da Tarefa 18: o Canvas.tsx original do
// brief sempre retornava o <canvas> (o useEffect só decidia se o renderer
// arrancava, não se a tag existia). Isso reprovava o próprio E2E do brief —
// `tests/e2e/heroi.spec.ts` espera `.heroi__canvas` com count 0 quando
// `navigator.gpu` está ausente, não apenas invisível por opacidade. Corrigido
// decidindo a tentativa de forma síncrona, na montagem, e não renderizando o
// <canvas> quando ela falha. Seguro porque este componente só existe no
// cliente (dynamic com ssr:false em index.tsx): nunca corre no servidor, e
// `navigator`/`matchMedia` sempre existem quando ele monta.
function podeTentar(): boolean {
  if (typeof navigator === 'undefined' || navigator.gpu === undefined) return false;
  if (typeof window === 'undefined') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function Canvas() {
  const [tentar] = useState(podeTentar);
  const ref = useRef<HTMLCanvasElement>(null);
  const [pintando, setPintando] = useState(false);

  useEffect(() => {
    // Terceiro motivo para nada acontecer, que a checagem síncrona acima não
    // cobre: falha de init() ou de compilação. Com um buraco negro em
    // rotação, honrar prefers-reduced-motion não é boa prática — é
    // necessidade — mas essa preferência já barrou a montagem do <canvas>
    // antes deste efeito rodar.
    if (!tentar) return;

    const canvas = ref.current;
    if (canvas === null) return;

    let cancelado = false;
    // `aoDesligar`: a Tarefa 20 (degradação por saúde de quadro) chama isto
    // quando o herói não sustenta nem em DPR 1 — o renderer já se descartou
    // sozinho (`descartarInterno`, dentro de `desligar()`); aqui só falta
    // devolver `pintando` a `false`, para o CSS voltar a esconder o <canvas>
    // (`opacity: 0`) e o pôster, que nunca saiu do DOM, reaparecer.
    const renderer = criarRenderer({
      canvas,
      aoDesligar: () => {
        if (!cancelado) setPintando(false);
      },
    });
    void renderer.pronto
      .then(() => {
        if (!cancelado) setPintando(true);
      })
      .catch(() => {
        // Falha de init ou de compilação: o pôster permanece e nada mais
        // acontece. Silenciar aqui é a decisão certa — o visitante não tem o
        // que fazer com um erro de WebGPU.
      });

    return () => {
      cancelado = true;
      renderer.descartar();
    };
  }, [tentar]);

  // Sem navigator.gpu, ou com movimento reduzido: o <canvas> nem entra no
  // DOM — não há o que sobrepor ao pôster. A regra CSS em base.css
  // (`@media (prefers-reduced-motion: reduce)`) continua como segunda linha
  // de defesa, para o caso da preferência mudar depois de um canvas já
  // montado (ela não reavalia `tentar`).
  if (!tentar) return null;

  return (
    <canvas
      ref={ref}
      className={pintando ? 'heroi__canvas heroi__canvas--visivel' : 'heroi__canvas'}
      aria-hidden="true"
    />
  );
}
