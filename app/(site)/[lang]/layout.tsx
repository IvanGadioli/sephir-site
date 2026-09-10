// Root layout do grupo (site)/[lang] — serve "/pt/". `lang` deriva do
// segmento da URL, nunca fixo, por isso o layout é async e lê `params`.
import type { ReactNode } from 'react';

export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <html lang={lang}>
      <body>{children}</body>
    </html>
  );
}
