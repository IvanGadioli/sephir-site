import { describe, expect, it, vi } from 'vitest';
import { criarMonitorDeQuadro } from '../../componentes/heroi/frame-health.ts';

const amostra = (deltaMs: number) => ({ deltaMs, ativo: true, renderizado: true, fpsAlvo: 30 });

describe('o monitor de saúde de quadro', () => {
  it('não pede queda quando o FPS está no alvo', () => {
    const aoDegradar = vi.fn();
    const m = criarMonitorDeQuadro({ aoDegradar });
    for (let i = 0; i < 200; i++) m.registrar(amostra(1000 / 30));
    expect(aoDegradar).not.toHaveBeenCalled();
  });

  it('pede queda quando o FPS fica sob 80% do alvo por 2 s de tempo ativo', () => {
    const aoDegradar = vi.fn();
    const m = criarMonitorDeQuadro({ aoDegradar });
    // 20 fps = 50 ms por quadro. 2 s de tempo ativo = 40 quadros.
    for (let i = 0; i < 60; i++) m.registrar(amostra(50));
    expect(aoDegradar).toHaveBeenCalledOnce();
    expect(aoDegradar).toHaveBeenCalledWith('frame-health');
  });

  it('não pede queda antes de 2 s, mesmo com FPS ruim', () => {
    const aoDegradar = vi.fn();
    const m = criarMonitorDeQuadro({ aoDegradar });
    for (let i = 0; i < 10; i++) m.registrar(amostra(50));
    expect(aoDegradar).not.toHaveBeenCalled();
  });

  it('pede queda uma vez só, nunca em sequência', () => {
    const aoDegradar = vi.fn();
    const m = criarMonitorDeQuadro({ aoDegradar });
    for (let i = 0; i < 400; i++) m.registrar(amostra(50));
    expect(aoDegradar).toHaveBeenCalledOnce();
  });

  it('um intervalo acima de 250 ms reinicia a janela, em vez de contar como queda', () => {
    const aoDegradar = vi.fn();
    const m = criarMonitorDeQuadro({ aoDegradar });
    for (let i = 0; i < 30; i++) m.registrar(amostra(50));
    m.registrar(amostra(4000)); // aba oculta, ociosidade
    for (let i = 0; i < 30; i++) m.registrar(amostra(50));
    // A primeira janela foi descartada; a segunda ainda não fechou 2 s.
    expect(aoDegradar).not.toHaveBeenCalled();
  });

  it('ignora quadro inativo', () => {
    const aoDegradar = vi.fn();
    const m = criarMonitorDeQuadro({ aoDegradar });
    for (let i = 0; i < 200; i++) {
      m.registrar({ deltaMs: 50, ativo: false, renderizado: true, fpsAlvo: 30 });
    }
    expect(aoDegradar).not.toHaveBeenCalled();
  });

  it('ignora tique que não apresentou quadro', () => {
    const aoDegradar = vi.fn();
    const m = criarMonitorDeQuadro({ aoDegradar });
    for (let i = 0; i < 200; i++) {
      m.registrar({ deltaMs: 50, ativo: true, renderizado: false, fpsAlvo: 30 });
    }
    expect(aoDegradar).not.toHaveBeenCalled();
  });

  it('reiniciar zera a janela', () => {
    const aoDegradar = vi.fn();
    const m = criarMonitorDeQuadro({ aoDegradar });
    for (let i = 0; i < 30; i++) m.registrar(amostra(50));
    m.reiniciar();
    for (let i = 0; i < 30; i++) m.registrar(amostra(50));
    expect(aoDegradar).not.toHaveBeenCalled();
  });
});
