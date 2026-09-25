// Ciclo de vida do herói no navegador. A vgpu entra por import dinâmico: não
// pode estar no chunk de entrada.
//
// Gradiente provisório (Tarefa 18) — só para provar init → surface → effect →
// frame nesta versão da vgpu antes de portar o pipeline de nove shaders
// (Tarefa 19). Ver divergências de API no report da Tarefa 18: a chamada de
// desenho dentro do frameLoop não é `efeito.draw(quadro, alvo)` como o brief
// original supunha (v0.3.1) — é `quadro.pass(alvo, efeito)`, confirmado com
// `npx vgpu docs cat Frame` na 0.5.0.
type ApiVgpu = typeof import('vgpu');

const FONTE_PROVISORIA = /* wgsl */ `
@fragment
fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  return vec4f(0.91, 0.59, 0.23, 1.0);
}
`;

export function criarRenderer({ canvas }: { canvas: HTMLCanvasElement }) {
  let descartado = false;
  let parar: (() => void) | undefined;

  const pronto = (async () => {
    if (typeof navigator === 'undefined' || navigator.gpu === undefined) {
      throw new Error('sem WebGPU');
    }
    const vgpu: ApiVgpu = await import('vgpu');
    const gpu = await vgpu.init();
    if (descartado) return;
    const alvo = vgpu.surface(gpu, canvas);
    const efeito = vgpu.effect(gpu, FONTE_PROVISORIA);
    const laco = vgpu.frameLoop(gpu, (quadro) => {
      quadro.pass(alvo, efeito);
    });
    parar = () => laco.stop();
  })();

  return {
    pronto,
    descartar() {
      descartado = true;
      parar?.();
    },
  };
}
