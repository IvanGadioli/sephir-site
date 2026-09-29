'use client';

import dynamic from 'next/dynamic';

// O canvas entra sem SSR: ele só existe depois de navigator.gpu responder, e
// renderizá-lo no servidor produziria um <canvas> vazio no HTML — peso morto
// para quem nunca vai pintá-lo.
const Canvas = dynamic(() => import('./Canvas.tsx').then((m) => m.Canvas), {
  ssr: false,
});

export default function Heroi() {
  return (
    <>
      <img className="heroi__poster" src="/poster/heroi.webp" alt="" />
      <Canvas />
    </>
  );
}
