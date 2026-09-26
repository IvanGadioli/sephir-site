// Ciclo de vida do herói no navegador. A vgpu entra por import dinâmico: não
// pode estar no chunk de entrada.
//
// Tarefa 19: a cadeia real de nove shaders (`pipeline.ts`/`settings.ts`, ver
// procedência em cada um) substitui o gradiente provisório da Tarefa 18.
// Portado do `renderer.ts` do exemplo `optimized-black-hole`, adaptando os
// nomes ao nosso contrato (`criarRenderer`, `pronto`, `descartar`) e à
// convenção do projeto (identificadores próprios em português; os nomes que
// vêm de `pipeline.ts`/`settings.ts` ficam em inglês, como no upstream).
// Mantidos do original:
// - o `matchMedia('(max-width: 767px)')` que troca o enquadramento para
//   `{ centerX: 0, centerY: 0, cameraRoll: 0, mouseYaw: 0, centerFade: 1 }`;
// - o ajuste de `bloom.radius`/`bloom.strength` por `devicePixelRatio`;
// - o `ResizeObserver`, o `IntersectionObserver` e o `document.hidden`, que
//   param o laço quando o herói não está à vista (bateria em aba de fundo);
// - o pacing manual do laço de quadro, com uma mudança: `TARGET_FPS = 30`,
//   não 60 — política da spec §5, decidida antes de qualquer medição.
// Divergências de API já corrigidas na porta (ver `pipeline.ts` e o report
// da Tarefa 18): `@vgpu/wgsl/wgsl-types` (não `@vgpu/wgsl/types`) e
// `quadro.pass(alvo, efeito)` (não `efeito.draw(quadro, alvo)`).
import type { Frame, Gpu, Surface } from 'vgpu';

import {
  createEffects,
  createTargets,
  destroyTargets,
  prewarm,
  renderChain,
  setBakeUniforms,
  setBindings,
  setPostUniforms,
  setShadeUniforms,
  type Effects,
  type Targets,
} from './pipeline.ts';
import { defaultHeroSettings } from './settings.ts';

type ApiVgpu = typeof import('vgpu');

const SCENE_YAW_TAU_S = 0.325;
const MAX_FRAME_DT_S = 0.1;
// Política da spec §5, decidida antes de qualquer medição de desempenho —
// o exemplo de origem usa 60.
const TARGET_FPS = 30;
const FRAME_PACING_EPSILON_MS = 2;
const MIN_FRAME_INTERVAL_MS = 1000 / TARGET_FPS - FRAME_PACING_EPSILON_MS;
const CONSULTA_MOVEL = '(max-width: 767px)';

type TamanhoRender = { width: number; height: number };

export function criarRenderer({ canvas }: { canvas: HTMLCanvasElement }) {
  const settings = defaultHeroSettings();
  const layoutDesktop = {
    centerX: settings.centerX,
    centerY: settings.centerY,
    cameraRoll: settings.cameraRoll,
    mouseYaw: settings.mouseYaw,
    centerFade: settings.centerFade,
  };
  const consultaMovel =
    typeof window === 'undefined' ? undefined : window.matchMedia(CONSULTA_MOVEL);
  const aplicarLayoutResponsivo = () => {
    Object.assign(
      settings,
      consultaMovel?.matches
        ? { centerX: 0, centerY: 0, cameraRoll: 0, mouseYaw: 0, centerFade: 1 }
        : layoutDesktop
    );
  };
  aplicarLayoutResponsivo();
  const escalaBloom =
    Math.min(Math.max(typeof window === 'undefined' ? 1 : window.devicePixelRatio, 1), 2) / 2;
  settings.bloom.radius *= escalaBloom;
  settings.bloom.strength *= escalaBloom;

  let descartado = false;

  let api: ApiVgpu | undefined;
  let gpu: Gpu | undefined;
  let alvo: Surface | undefined;
  let effects: Effects | undefined;
  let targets: Targets | undefined;
  let laco: { stop(): void } | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let intersectionObserver: IntersectionObserver | undefined;
  let documentoVisivel = typeof document === 'undefined' ? true : !document.hidden;
  let canvasIntersecta = true;

  let iniciado = false;
  let tempoAnimacao = 0;
  let ultimoQuadroEm: number | undefined;
  let resizeFrame = 0;
  let tamanhoPendente: TamanhoRender | undefined;
  let forcarBake = true;
  let ponteiroXNormalizado = 0;
  let yawCenaAtual = 0;
  let ultimoYawEm: number | undefined;

  const aoMudarLayout = () => {
    aplicarLayoutResponsivo();
    forcarBake = true;
  };
  consultaMovel?.addEventListener('change', aoMudarLayout);

  const aoMoverPonteiro = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    const largura = Math.max(window.innerWidth, 1);
    ponteiroXNormalizado = Math.min(1, Math.max(-1, (event.clientX / largura) * 2 - 1));
  };
  const recentrarPonteiro = () => {
    ponteiroXNormalizado = 0;
  };
  const aoSairPonteiro = (event: PointerEvent) => {
    if (event.relatedTarget === null) recentrarPonteiro();
  };
  const aoMudarVisibilidade = () => {
    if (document.hidden) recentrarPonteiro();
    documentoVisivel = !document.hidden;
    reconciliarLaco();
  };

  function reconciliarLaco(): void {
    if (!iniciado || !gpu || !api) return;
    const deveRodar = !descartado && documentoVisivel && canvasIntersecta;
    if (deveRodar === Boolean(laco)) return;
    if (deveRodar) {
      ultimoQuadroEm = undefined;
      ultimoYawEm = undefined;
      laco = iniciarLacoComPacing(api, gpu);
    } else {
      laco?.stop();
      laco = undefined;
    }
  }

  function iniciarLacoComPacing(vgpu: ApiVgpu, gpuAtivo: Gpu): { stop(): void } {
    let parado = false;
    let ultimoApresentadoEm: number | undefined;
    const tick = (timestamp: number): void => {
      if (parado) return;
      if (
        ultimoApresentadoEm === undefined ||
        timestamp - ultimoApresentadoEm >= MIN_FRAME_INTERVAL_MS
      ) {
        ultimoApresentadoEm = timestamp;
        try {
          vgpu.frame(gpuAtivo, renderizarQuadro);
        } catch (error) {
          lidarComFalha(error);
        }
      }
      if (!parado) handleQuadro = requestAnimationFrame(tick);
    };
    let handleQuadro = requestAnimationFrame(tick);
    return {
      stop(): void {
        parado = true;
        cancelAnimationFrame(handleQuadro);
      },
    };
  }

  const avancarTempoAnimacao = (agora: number): number => {
    tempoAnimacao +=
      ultimoQuadroEm === undefined ? 0 : Math.max(0, (agora - ultimoQuadroEm) / 1000);
    ultimoQuadroEm = agora;
    return tempoAnimacao;
  };

  const renderizarQuadro = (frame: Frame): void => {
    if (descartado || !effects || !targets || !alvo) return;
    const agora = relogioMs();
    const rodarBake = forcarBake;
    forcarBake = false;
    if (rodarBake) setBakeUniforms(effects, targets, settings);
    setShadeUniforms(
      effects,
      targets,
      settings,
      avancarTempoAnimacao(agora),
      avancarYawCena(agora)
    );
    renderChain(frame, effects, targets, alvo, rodarBake);
  };

  const avancarYawCena = (agora: number): number => {
    if (settings.mouseYaw <= 0) {
      yawCenaAtual = 0;
      ultimoYawEm = agora;
      return 0;
    }
    const dt =
      ultimoYawEm === undefined
        ? 0
        : Math.min(Math.max((agora - ultimoYawEm) / 1000, 0), MAX_FRAME_DT_S);
    ultimoYawEm = agora;
    const alvoYaw = ponteiroXNormalizado * Math.max(0, settings.mouseYaw);
    yawCenaAtual += (alvoYaw - yawCenaAtual) * (1 - Math.exp(-dt / SCENE_YAW_TAU_S));
    return yawCenaAtual;
  };

  const aplicarResize = () => {
    resizeFrame = 0;
    const tamanho = tamanhoPendente;
    tamanhoPendente = undefined;
    if (descartado || !tamanho || !gpu || !api || !effects || !targets || !alvo) return;
    try {
      const targetsAnteriores = targets;
      const proximosTargets = createTargets(api, gpu, [
        Math.max(1, Math.round(tamanho.width)),
        Math.max(1, Math.round(tamanho.height)),
      ]);
      try {
        setBindings(effects, proximosTargets);
        setPostUniforms(effects, proximosTargets, settings);
      } catch (error) {
        destroyTargets(proximosTargets);
        throw error;
      }
      targets = proximosTargets;
      destroyTargets(targetsAnteriores);
      forcarBake = true;
    } catch (error) {
      lidarComFalha(error);
    }
  };
  const redimensionar = (tamanho: TamanhoRender) => {
    if (descartado || tamanho.width <= 0 || tamanho.height <= 0) return;
    tamanhoPendente = tamanho;
    if (!resizeFrame) resizeFrame = requestAnimationFrame(aplicarResize);
  };
  const medir = () => {
    redimensionar({ width: canvas.clientWidth, height: canvas.clientHeight });
  };

  const descartarInterno = () => {
    if (descartado) return;
    descartado = true;
    laco?.stop();
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    if (typeof window !== 'undefined') {
      consultaMovel?.removeEventListener('change', aoMudarLayout);
      window.removeEventListener('pointermove', aoMoverPonteiro);
      window.removeEventListener('pointerout', aoSairPonteiro);
      window.removeEventListener('blur', recentrarPonteiro);
      document.removeEventListener('visibilitychange', aoMudarVisibilidade);
    }
    gpu?.dispose();
  };

  function lidarComFalha(error: unknown): never {
    descartarInterno();
    throw error;
  }

  const pronto = (async () => {
    if (typeof navigator === 'undefined' || navigator.gpu === undefined) {
      throw new Error('sem WebGPU');
    }
    const vgpu: ApiVgpu = await import('vgpu');
    const { init } = vgpu;
    if (descartado) return;
    const proximoGpu = await init();
    if (descartado) {
      proximoGpu.dispose();
      return;
    }
    gpu = proximoGpu;
    api = vgpu;
    alvo = vgpu.surface(gpu, canvas, { dpr: 1 });
    effects = createEffects(vgpu, gpu);
    targets = createTargets(vgpu, gpu, alvo.size);
    setBindings(effects, targets);
    setPostUniforms(effects, targets, settings);
    await prewarm(effects, targets, alvo);
    if (descartado) return;
    resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(medir);
    resizeObserver?.observe(canvas);
    if (typeof window !== 'undefined') {
      window.addEventListener('pointermove', aoMoverPonteiro, { passive: true });
      window.addEventListener('pointerout', aoSairPonteiro, { passive: true });
      window.addEventListener('blur', recentrarPonteiro);
      document.addEventListener('visibilitychange', aoMudarVisibilidade);
    }
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          canvasIntersecta = entries[entries.length - 1]?.isIntersecting ?? canvasIntersecta;
          reconciliarLaco();
        },
        { threshold: 0 }
      );
      intersectionObserver.observe(canvas);
    }
    medir();
    iniciado = true;
    documentoVisivel = !document.hidden;
    reconciliarLaco();
  })().catch((error: unknown) => {
    if (descartado) return;
    lidarComFalha(error);
  });

  return {
    pronto,
    descartar() {
      descartarInterno();
    },
  };
}

function relogioMs(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}
