// "/pt/" — a home: wordmark, <h1> do produto, tagline, selo de fase e o
// lockup do rodapé, nesta ordem (Tarefa 4). Nomenclatura travada em
// 30/07/2026 (skill `marca-sephir`): o produto estampa o <h1>, o estúdio só
// aparece no lockup do rodapé, a fase só como selo — nunca em título.
import { IDIOMAS, type Idioma } from '../../../lib/rotas';
import { Lockup } from '../../../components/Lockup';
import { SeloFase } from '../../../components/SeloFase';

export function generateStaticParams() {
  return IDIOMAS.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export default async function Home({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}) {
  await params;
  return (
    <>
      <header style={{ padding: 'var(--espaco-xl) var(--espaco-lg) 0' }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--fonte-display)',
            fontSize: 'var(--tipo-h2-tamanho)',
            color: 'var(--cor-amber)',
          }}
        >
          Sephir
        </p>
      </header>
      <main style={{ padding: 'var(--espaco-xl) var(--espaco-lg)' }}>
        <h1
          style={{
            margin: '0 0 var(--espaco-md)',
            fontSize: 'var(--tipo-hero-tamanho)',
            fontWeight: 'var(--tipo-hero-peso)',
            lineHeight: 'var(--tipo-hero-altura)',
            letterSpacing: 'var(--tipo-hero-tracking)',
          }}
        >
          Iniciativa Sephir
        </h1>
        <p
          style={{
            margin: '0 0 var(--espaco-lg)',
            fontSize: 'var(--tipo-body-tamanho)',
            lineHeight: 'var(--tipo-body-altura)',
          }}
        >
          Simulação física do cosmos, jogável.
        </p>
        <SeloFase />
      </main>
      <footer
        style={{
          padding: 'var(--espaco-lg)',
          borderTop: '1px solid var(--cor-border)',
        }}
      >
        <Lockup />
      </footer>
    </>
  );
}
