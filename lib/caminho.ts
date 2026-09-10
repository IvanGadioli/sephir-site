// PREFIXO e o helper de caminho.
// `sistemas/01_publicacao/features/02_esqueleto-publicado/04_plano.md`, seção Interfaces.

const FORMA_PREFIXO = /^\/[^/](?:.*[^/])?$/;

export function validarPrefixo(bruto: string): string {
  if (bruto === '') return '';
  if (!FORMA_PREFIXO.test(bruto)) {
    throw new Error(`PREFIXO inválido, forma esperada "/algo" sem barra final: "${bruto}"`);
  }
  return bruto;
}

export const PREFIXO = validarPrefixo(process.env.PREFIXO ?? '');

export function caminho(rota: string): string {
  if (!rota.startsWith('/')) {
    throw new Error(`rota inválida, precisa começar em "/": "${rota}"`);
  }
  return `${PREFIXO}${rota}`;
}
