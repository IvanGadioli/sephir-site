// O quarto caso de fallback do herói (spec §5): a GPU falha DEPOIS de o
// primeiro quadro ter pintado. Era o achado I10 da revisão final, e o único
// defeito de implementação dos dez — o único que muda o que o visitante vê.
//
// Por que unitário e não E2E: provocar perda de device WebGPU num navegador de
// verdade é caro e frágil (é a mesma razão pela qual o terceiro caso, falha de
// `init()`, nunca ganhou E2E). O renderer, por outro lado, tem uma superfície
// pequena e injetável — `vgpu` entra por `await import('vgpu')` e a cadeia de
// shaders por `./pipeline.ts` —, então o caminho de falha é exercitável aqui
// com o `requestAnimationFrame` na mão, quadro por quadro.
//
// O contrato que estes testes travam é o da spec §5: **o pôster volta a
// aparecer**. Em código isso é `aoDesligar()` — é ele que devolve `pintando` a
// `false` no `Canvas.tsx`, o que tira `heroi__canvas--visivel` do <canvas> e o
// leva de volta a `opacity: 0`, revelando o pôster que nunca saiu do DOM.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const descartarGpu = vi.fn();
const quadro = vi.fn();
const redimensionarSuperficie = vi.fn();

vi.mock('vgpu', () => ({
  init: async () => ({ device: {}, gpu: { queue: {} }, dispose: descartarGpu }),
  surface: () => ({ size: [800, 600] as const, resize: redimensionarSuperficie }),
  frame: (...args: unknown[]) => quadro(...args),
}));

// A cadeia real de nove shaders não tem nada a dizer sobre o caminho de falha, e
// carregá-la exigiria os `.wgsl` e um device de verdade.
vi.mock('../../componentes/heroi/pipeline.ts', () => ({
  createEffects: () => ({}),
  createTargets: () => ({}),
  destroyTargets: () => {},
  prewarm: async () => {},
  renderChain: () => {},
  setBakeUniforms: () => {},
  setBindings: () => {},
  setPostUniforms: () => {},
  setShadeUniforms: () => {},
}));

// Fila de `requestAnimationFrame` sob controle do teste: sem isto o laço de
// quadro é inobservável, e é exatamente dentro dele que o defeito vivia.
const fila = new Map<number, (t: number) => void>();
let proximoHandle = 0;

function correrQuadros(timestamp: number): void {
  const agendados = [...fila.entries()];
  fila.clear();
  for (const [, callback] of agendados) callback(timestamp);
}

const ouvinte = () => {};
const consulta = () => ({
  matches: false,
  addEventListener: ouvinte,
  removeEventListener: ouvinte,
});

beforeEach(() => {
  fila.clear();
  proximoHandle = 0;
  vi.clearAllMocks();
  // Ambiente de navegador mínimo, escrito à mão em vez de jsdom: o renderer só
  // toca nestas cinco coisas, e uma dependência nova de teste custa mais que
  // vinte linhas de stub. `ResizeObserver` e `IntersectionObserver` ficam
  // ausentes de propósito — o renderer já os trata como opcionais.
  // `defineProperty`, e não `Object.assign`: no Node `globalThis.navigator` é
  // acessor sem setter, e atribuir nele lança `TypeError`.
  const ambiente: Record<string, unknown> = {
    requestAnimationFrame: (cb: (t: number) => void) => {
      const handle = ++proximoHandle;
      fila.set(handle, cb);
      return handle;
    },
    cancelAnimationFrame: (handle: number) => {
      fila.delete(handle);
    },
    navigator: { gpu: {} },
    document: { hidden: false, addEventListener: ouvinte, removeEventListener: ouvinte },
    window: {
      devicePixelRatio: 1,
      innerWidth: 1920,
      matchMedia: consulta,
      addEventListener: ouvinte,
      removeEventListener: ouvinte,
    },
  };
  for (const [chave, valor] of Object.entries(ambiente)) {
    Object.defineProperty(globalThis, chave, { value: valor, configurable: true, writable: true });
  }
});

afterEach(() => {
  for (const chave of ['requestAnimationFrame', 'cancelAnimationFrame', 'document', 'window']) {
    delete (globalThis as Record<string, unknown>)[chave];
  }
  // `navigator` existe no Node de verdade; devolvê-lo sem `gpu` é o estado
  // original desta suíte, e apagá-lo quebraria qualquer teste vizinho.
  Object.defineProperty(globalThis, 'navigator', {
    value: { gpu: undefined },
    configurable: true,
    writable: true,
  });
});

async function heroiPintando() {
  const { criarRenderer } = await import('../../componentes/heroi/renderer.ts');
  const aoDesligar = vi.fn();
  const canvas = { clientWidth: 800, clientHeight: 600 } as unknown as HTMLCanvasElement;
  const renderer = criarRenderer({ canvas, aoDesligar });
  await renderer.pronto;
  // Dois quadros: o `aplicarResize` agendado por `medir()` e o primeiro `tick`
  // do laço. Depois deste ponto o herói está pintando — é o estado em que o
  // defeito I10 existia, e o estado que nenhum teste da branch alcançava.
  correrQuadros(0);
  correrQuadros(0);
  expect(quadro, 'o primeiro quadro pintou').toHaveBeenCalledTimes(1);
  expect(aoDesligar, 'ninguém desligou nada ainda').not.toHaveBeenCalled();
  return { renderer, aoDesligar };
}

describe('falha de GPU depois do primeiro quadro', () => {
  it('devolve o pôster: chama aoDesligar, e não só descarta em silêncio', async () => {
    const { aoDesligar } = await heroiPintando();
    const registrado = vi.spyOn(console, 'error').mockImplementation(() => {});

    quadro.mockImplementationOnce(() => {
      throw new Error('device perdido');
    });
    // 40 ms passa o pacing de 30 fps (MIN_FRAME_INTERVAL_MS ≈ 31,3 ms).
    correrQuadros(40);

    // O contrato da spec §5. Antes da correção, `lidarComFalha` chamava
    // `descartarInterno()` direto: o canvas ficava visível e morto por cima do
    // pôster, e este `expect` reprovava.
    expect(aoDesligar).toHaveBeenCalledTimes(1);
    expect(descartarGpu).toHaveBeenCalled();
    expect(registrado).toHaveBeenCalled();
    registrado.mockRestore();
  });

  it('não joga exceção para dentro do requestAnimationFrame', async () => {
    await heroiPintando();
    const registrado = vi.spyOn(console, 'error').mockImplementation(() => {});

    quadro.mockImplementationOnce(() => {
      throw new Error('device perdido');
    });
    // `correrQuadros` invoca o callback do rAF exatamente como o navegador
    // faria — sem `try` em volta. Antes da correção, `lidarComFalha` relançava
    // daqui e isto virava `pageerror` na aba do visitante; a linha abaixo é o
    // navegador, e ela não deve ver erro nenhum.
    expect(() => correrQuadros(40)).not.toThrow();

    registrado.mockRestore();
  });

  it('para o laço: nenhum quadro novo depois da falha', async () => {
    await heroiPintando();
    const registrado = vi.spyOn(console, 'error').mockImplementation(() => {});

    quadro.mockImplementationOnce(() => {
      throw new Error('device perdido');
    });
    correrQuadros(40);
    const depoisDaFalha = quadro.mock.calls.length;

    correrQuadros(200);
    correrQuadros(400);
    expect(quadro.mock.calls.length, 'nenhum vgpu.frame num gpu já descartado').toBe(
      depoisDaFalha,
    );
    registrado.mockRestore();
  });

  it('falha de init continua rejeitando `pronto`, que é como o Canvas desiste', async () => {
    const { criarRenderer } = await import('../../componentes/heroi/renderer.ts');
    const vgpu = await import('vgpu');
    vi.spyOn(vgpu, 'init').mockRejectedValueOnce(new Error('sem adapter'));

    const aoDesligar = vi.fn();
    const canvas = { clientWidth: 800, clientHeight: 600 } as unknown as HTMLCanvasElement;
    const renderer = criarRenderer({ canvas, aoDesligar });

    // O caminho de `pronto` é o único que ainda relança, e tem de continuar
    // relançando: é por essa rejeição que o `.catch()` do Canvas.tsx impede
    // `setPintando(true)`. Sem ela o Canvas mostraria um <canvas> vazio opaco.
    await expect(renderer.pronto).rejects.toThrow('sem adapter');
    expect(aoDesligar).toHaveBeenCalledTimes(1);
  });
});
