import { describe, expect, it } from 'vitest';
import { defaultHeroSettings } from '../../componentes/heroi/settings.ts';

describe('a configuração do herói', () => {
  it('no desktop, desloca o buraco negro para a direita', () => {
    const c = defaultHeroSettings();
    expect(c.centerX).toBe(0.8);
    expect(c.centerY).toBe(0.3);
  });

  it('mantém o roll e o yaw do exemplo', () => {
    const c = defaultHeroSettings();
    expect(c.cameraRoll).toBeCloseTo(-0.27);
    expect(c.mouseYaw).toBeCloseTo(0.15);
  });

  it('não esmaece o centro no desktop', () => {
    expect(defaultHeroSettings().centerFade).toBe(0);
  });
});
