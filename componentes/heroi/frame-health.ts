// Política de saúde de quadro. Pura de propósito: sem relógio, sem navegador,
// alimentada por amostras. É o teste que decide se ela está certa, não a tela.
//
// Não medir a taxa crua de requestAnimationFrame: um cap intencional de 30 fps
// ou um monitor de 120 Hz produzem queda falsa. Medir quadro APRESENTADO
// contra o alvo que o trabalho realmente tem.

const FRACAO_DO_ALVO = 0.8;
const JANELA_MS = 2000;
const INTERVALO_DE_CORTE_MS = 250;

export interface AmostraDeQuadro {
  deltaMs: number;
  ativo: boolean;
  renderizado: boolean;
  fpsAlvo: number;
}

export function criarMonitorDeQuadro({ aoDegradar }: { aoDegradar: (motivo: string) => void }) {
  let acumuladoMs = 0;
  let quadros = 0;
  // Mão única, de propósito: `jaDegradou` nunca volta a `false`. O FPS
  // apresentado melhora no instante em que a qualidade cai, o que argumentaria
  // imediatamente pela volta — e o herói oscilaria para sempre. Quem detecta a
  // segunda queda é uma instância nova de monitor, não este flag reaberto.
  let jaDegradou = false;

  function reiniciar() {
    acumuladoMs = 0;
    quadros = 0;
  }

  return {
    reiniciar,
    registrar(amostra: AmostraDeQuadro) {
      if (jaDegradou) return;
      if (!amostra.ativo || !amostra.renderizado) return;

      // Aba oculta ou ociosidade: a janela é descartada, não contada como
      // queda. Um intervalo de 4 s não é o site engasgando.
      if (amostra.deltaMs > INTERVALO_DE_CORTE_MS) {
        reiniciar();
        return;
      }

      acumuladoMs += amostra.deltaMs;
      quadros += 1;
      if (acumuladoMs < JANELA_MS) return;

      const fpsApresentado = (quadros * 1000) / acumuladoMs;
      if (fpsApresentado < amostra.fpsAlvo * FRACAO_DO_ALVO) {
        jaDegradou = true;
        aoDegradar('frame-health');
        return;
      }
      reiniciar();
    },
  };
}
