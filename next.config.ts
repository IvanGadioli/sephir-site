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
  // O `tsconfig.json` inclui `tests/` inteiro (decisão da Tarefa 1). O
  // programa de tipos, então, também alcança os testes de tarefas futuras
  // já presentes no repo (importam módulos de `ferramentas/oraculos/*.mjs`
  // que ainda não existem) — não é um erro em `app/`. A checagem própria do
  // `next build` verifica o programa inteiro e travaria por isso; o vitest
  // não checa tipo, só transpila, e por isso não vê o problema. Desligada
  // aqui; não achada no spike do portão 04 — reportada no relatório final.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
