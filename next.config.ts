import type { NextConfig } from 'next';

// `adr-fab-001` fica de pé: export estático, sem servidor por trás. É
// restrição do Cloudflare Pages, não preferência — ver spec §1.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
