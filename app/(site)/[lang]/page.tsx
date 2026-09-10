// "/pt/" — conteúdo mínimo para esta tarefa. A home de verdade (wordmark,
// tagline, selo, lockup) é da Tarefa 4: não adiantar aqui.
import { IDIOMAS, type Idioma } from '../../../lib/rotas';

export function generateStaticParams() {
  return IDIOMAS.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export default async function Home({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}) {
  const { lang } = await params;
  return <p>{lang}</p>;
}
