import { describe, it, expect } from 'vitest';
import { validarPrefixo } from '../../lib/caminho';

describe('validarPrefixo', () => {
  it('aceita vazio', () => expect(validarPrefixo('')).toBe(''));
  it('aceita /__pfx', () => expect(validarPrefixo('/__pfx')).toBe('/__pfx'));
  it('recusa sem barra inicial', () => expect(() => validarPrefixo('pfx')).toThrow(/pfx/));
  it('recusa barra final', () => expect(() => validarPrefixo('/pfx/')).toThrow(/pfx/));
  it('põe o valor recebido na mensagem', () =>
    expect(() => validarPrefixo('//x')).toThrow(/\/\/x/));
});
