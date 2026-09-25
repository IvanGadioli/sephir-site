import type { NextConfig } from 'next';

// `adr-fab-001` fica de pé: export estático, sem servidor por trás. É
// restrição do Cloudflare Pages, não preferência — ver spec §1.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // O loader resolve o grafo de import entre os .wgsl em tempo de build e
  // entrega a effect() um shader já achatado. `as: '*.js'` é obrigatório:
  // sem ele o Turbopack não trata a saída do loader como módulo JavaScript.
  turbopack: {
    rules: {
      '*.wgsl': { loaders: ['@vgpu/wgsl/loader-webpack'], as: '*.js' },
    },
  },
};

export default nextConfig;
