import { afterEach, describe, expect, it } from 'vitest';

// lib/caminho.ts nasce no portão 05 (02_spec.md, assinatura). Hoje este
// import falha com "Cannot find module" — é o motivo certo: não existe
// função para testar, e a suíte deve dizer exatamente isso, não um erro de
// asserção genérico.
import { PREFIXO, caminho } from '../../lib/caminho';

describe('PREFIXO (G, "prefixo vazio hoje")', () => {
  it("é '' — domínio próprio, sem basePath nesta rodada", () => {
    expect(PREFIXO).toBe('');
  });
});

describe('caminho() — caso comum', () => {
  it("caminho('/pt/') === '/pt/' quando PREFIXO é vazio", () => {
    expect(caminho('/pt/')).toBe('/pt/');
  });
});

describe('caminho() — casos de borda (02_spec.md, "Casos de borda enumerados")', () => {
  const nodeEnvOriginal = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = nodeEnvOriginal;
  });

  it("entrada relativa ('imagem.png') lança em dev", () => {
    process.env.NODE_ENV = 'development';
    expect(() => caminho('imagem.png')).toThrow();
  });

  it("entrada relativa ('imagem.png') devolve a entrada intacta em produção", () => {
    process.env.NODE_ENV = 'production';
    expect(caminho('imagem.png')).toBe('imagem.png');
  });

  it('URL absoluta lança em dev', () => {
    process.env.NODE_ENV = 'development';
    expect(() => caminho('https://github.com/IvanGadioli')).toThrow();
  });

  it(
    'URL absoluta devolve intacta em produção — mesma regra geral da ' +
      "pré-condição ('não começa com /' é erro de programação, não crash em prod)",
    () => {
      process.env.NODE_ENV = 'production';
      expect(caminho('https://github.com/IvanGadioli')).toBe('https://github.com/IvanGadioli');
    }
  );

  it("barra dupla ('//pt/') devolve intacta mesmo em dev — é protocol-relative, é externo", () => {
    process.env.NODE_ENV = 'development';
    expect(caminho('//pt/')).toBe('//pt/');
  });
});
