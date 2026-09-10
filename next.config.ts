// `adr-fab-001`: export estático, sem rota de API, sem middleware, sem
// Server Action, sem revalidate. PREFIXO entra por basePath+assetPrefix —
// ver `lib/caminho.ts` para o helper que aplica o mesmo prefixo aos `href`.
import type { NextConfig } from 'next';
import { PREFIXO } from './lib/caminho';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: PREFIXO,
  assetPrefix: PREFIXO,
  // A checagem de tipo do `next build` fica LIGADA de propósito. O que a
  // travava era `tsconfig.json` alcançar `tests/`, e com isso os testes de
  // tarefas futuras que importam módulos ainda inexistentes — nunca um erro em
  // `app/`. O conserto é separar os dois programas de tipo: produção em
  // `tsconfig.json`, testes em `tsconfig.tests.json` (`npm run typecheck`).
  // `ignoreBuildErrors: true` calaria o sintoma junto com o código de produção,
  // para sempre e sem avisar de novo.
};

export default nextConfig;
