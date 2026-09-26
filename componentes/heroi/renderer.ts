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
// - o `IntersectionObserver` e o `document.hidden`, que de fato param o laço
//   (`laco.stop()`, via `reconciliarLaco()`) quando o herói não está à vista
//   ou a aba está em segundo plano — o que evita queimar bateria numa aba de
//   fundo. O `ResizeObserver` é diferente: ele só remede o canvas
//   (`aplicarResize()`), não pausa nada — não remover a checagem achando-a
//   redundante com os outros dois;
// - o pacing manual do laço de quadro, com uma mudança: `TARGET_FPS = 30`,
//   não 60 — política da spec §5, decidida antes de qualquer medição.
// Divergências de API já corrigidas na porta (ver `pipeline.ts` e o report
// da Tarefa 18): `@vgpu/wgsl/wgsl-types` (não `@vgpu/wgsl/types`) e
// `quadro.pass(alvo, efeito)` (não `efeito.draw(quadro, alvo)`).
//
// Tarefa 20: degradação por saúde de quadro (`frame-health.ts`). A superfície
// é criada com `autoResize: false` — deixá-la ligada relê `devicePixelRatio`
// a cada quadro e sobrescreveria o DPR fixado pela degradação; é o
// anti-padrão que o guia da vgpu nomeia. O DPR agora é estado nosso
// (`dprAtual`), começa em `clamp(devicePixelRatio, 1, 2)` e só muda por
// decisão da degradação — nunca por leitura do navegador depois do primeiro
// quadro. Também resolvido aqui, por ser o mesmo ciclo de vida do laço: o
// `matchMedia('(prefers-reduced-motion: reduce)')` agora é reavaliado depois
// da montagem (não só uma vez, como o `podeTentar` do `Canvas.tsx`, que
// continua correto para a decisão inicial) — sem isso o `requestAnimationFrame`
// seguia rodando atrás do `display: none` quando a preferência mudava com a
// página já aberta.
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
import { criarMonitorDeQuadro } from './frame-health.ts';
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
const CONSULTA_MOVIMENTO_REDUZIDO = '(prefers-reduced-motion: reduce)';
// DPR mínimo e máximo que a superfície aceita antes de qualquer degradação —
// mesmo grampo que já existia para `escalaBloom`, agora também governando o
// DPR real da superfície.
const DPR_MINIMO = 1;
const DPR_MAXIMO = 2;

type TamanhoRender = { width: number; height: number };

export function criarRenderer({
  canvas,
  aoDesligar,
}: {
  canvas: HTMLCanvasElement;
  /** Chamado quando a degradação persiste mesmo em DPR 1: o herói desliga e o pôster assume. */
  aoDesligar?: () => void;
}) {
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
  // DPR inicial: o mesmo grampo que a Tarefa 19 já aplicava só ao bloom passa
  // a governar também a resolução real da superfície. `dprAtual` é estado
  // nosso — só muda por `aoDegradarPrimeiraVez`, nunca relido do navegador
  // depois deste ponto.
  let dprAtual = Math.min(
    Math.max(typeof window === 'undefined' ? 1 : window.devicePixelRatio, DPR_MINIMO),
    DPR_MAXIMO
  );
  const escalaBloom = dprAtual / 2;
  settings.bloom.radius *= escalaBloom;
  settings.bloom.strength *= escalaBloom;

  let descartado = false;
  let desligado = false;

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

  const consultaMovimentoReduzido =
    typeof window === 'undefined' ? undefined : window.matchMedia(CONSULTA_MOVIMENTO_REDUZIDO);
  let movimentoReduzido = consultaMovimentoReduzido?.matches ?? false;

  // Monitor de saúde de quadro. Troca de instância uma vez, na primeira
  // degradação: o `jaDegradou` de cada `criarMonitorDeQuadro` é de mão única,
  // então depois da queda de DPR o monitor original nunca mais dispara — o
  // `monitorAtivo` passa a apontar para um segundo monitor, que decide o
  // desligamento se a queda de DPR não bastar.
  let monitorAtivo = criarMonitorDeQuadro({ aoDegradar: aoDegradarPrimeiraVez });

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
  // Item carregado da Tarefa 18: `podeTentar()` do Canvas.tsx só decide a
  // montagem inicial e está correto — o que faltava era reavaliar depois. Sem
  // isto, o `requestAnimationFrame` seguia rodando atrás do `display: none`
  // quando o visitante ligava a preferência com a página já aberta.
  const aoMudarMovimentoReduzido = () => {
    movimentoReduzido = consultaMovimentoReduzido?.matches ?? false;
    reconciliarLaco();
  };
  consultaMovimentoReduzido?.addEventListener('change', aoMudarMovimentoReduzido);

  function reconciliarLaco(): void {
    if (!iniciado || !gpu || !api) return;
    const deveRodar =
      !descartado && !desligado && documentoVisivel && canvasIntersecta && !movimentoReduzido;
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
      const anterior = ultimoApresentadoEm;
      if (anterior === undefined || timestamp - anterior >= MIN_FRAME_INTERVAL_MS) {
        ultimoApresentadoEm = timestamp;
        // Quadro APRESENTADO, não a taxa crua de rAF: só chega aqui quando o
        // pacing deixou passar, então `renderizado` é sempre `true` neste
        // ponto — o monitor descarta o resto sozinho (`ativo`, o corte de
        // 250 ms).
        monitorAtivo.registrar({
          deltaMs: anterior === undefined ? 1000 / TARGET_FPS : timestamp - anterior,
          ativo: documentoVisivel && canvasIntersecta,
          renderizado: true,
          fpsAlvo: TARGET_FPS,
        });
        // `registrar` acima pode disparar `aoDegradarSegundaVez` → `desligar()`
        // de forma síncrona, que descarta o gpu. `parado` já viraria `true`
        // (via `laco.stop()` dentro de `descartarInterno`), mas só é checado
        // no topo do próximo `tick` — sem reler aqui, este quadro ainda
        // chamaria `vgpu.frame` num gpu já descartado.
        if (parado) return;
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
      // `dprAtual` é lido aqui, não no agendamento: uma degradação que muda o
      // DPR entre `redimensionar()` e este `requestAnimationFrame` já se
      // aplica neste resize, sem precisar de uma segunda rodada.
      const tamanhoPixels: readonly [number, number] = [
        Math.max(1, Math.round(tamanho.width * dprAtual)),
        Math.max(1, Math.round(tamanho.height * dprAtual)),
      ];
      // A superfície está com `autoResize: false` (Tarefa 20): ninguém mais a
      // redimensiona sozinha, então o resize dela entra aqui, ao lado do dos
      // alvos internos — os dois sempre em sincronia com o mesmo `dprAtual`.
      alvo.resize(tamanhoPixels);
      const targetsAnteriores = targets;
      const proximosTargets = createTargets(api, gpu, tamanhoPixels);
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

  // Tarefa 20, passo 5.3: no `aoDegradar` do monitor principal, fixa o DPR em
  // 1, redimensiona a superfície e os alvos, e reinicia o monitor — mas desta
  // vez trocando `monitorAtivo` para uma instância nova, com `aoDegradar`
  // apontando para o desligamento. `monitor.reiniciar()` não bastaria sozinho
  // aqui: o `jaDegradou` do monitor original é de mão única por desenho (ver
  // `frame-health.ts`), então ele nunca mais chamaria `aoDegradar` — é por
  // isso que a política pede um segundo monitor, não o mesmo reiniciado.
  function aoDegradarPrimeiraVez(_motivo: string): void {
    if (descartado || desligado) return;
    dprAtual = DPR_MINIMO;
    medir();
    monitorAtivo = criarMonitorDeQuadro({ aoDegradar: aoDegradarSegundaVez });
  }

  // Passo 5.4: se o laço ainda não sustentar mesmo em DPR 1, desliga — o
  // Canvas volta `pintando` para `false` e o CSS devolve `opacity: 0`; o
  // pôster, que nunca saiu do DOM, permanece.
  function aoDegradarSegundaVez(_motivo: string): void {
    desligar();
  }

  function desligar(): void {
    if (desligado || descartado) return;
    desligado = true;
    aoDesligar?.();
    descartarInterno();
  }

  const descartarInterno = () => {
    if (descartado) return;
    descartado = true;
    laco?.stop();
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    if (typeof window !== 'undefined') {
      consultaMovel?.removeEventListener('change', aoMudarLayout);
      consultaMovimentoReduzido?.removeEventListener('change', aoMudarMovimentoReduzido);
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
    // `autoResize: false` (Tarefa 20): a superfície não relê
    // `devicePixelRatio` a cada quadro por conta própria — isso sobrescreveria
    // o DPR fixado pela degradação, o anti-padrão que o guia da vgpu nomeia.
    // `dpr: dprAtual` ainda dá a ela o tamanho inicial correto; os resizes
    // seguintes (inclusive o da degradação) passam por `aplicarResize`.
    alvo = vgpu.surface(gpu, canvas, { dpr: dprAtual, autoResize: false });
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
