import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { listar } from '../support/arvore.mjs';

// Um href interno resolve para: o próprio arquivo (se termina em extensão), ou
// <rota>/index.html (se termina em barra). Fragmento e query são descartados
// antes de resolver.
function resolverHref(href: string): string | null {
  const semFragmento = href.split('#')[0]?.split('?')[0] ?? '';
  if (semFragmento === '') return null;
  const semBarra = semFragmento.replace(/^\//, '');
  if (/\.[a-z0-9]+$/i.test(semBarra)) return semBarra;
  return join(semBarra, 'index.html');
}

describe('a integridade dos links internos', () => {
  let paginas: string[] = [];

  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
    paginas = listar('out', (n) => n.endsWith('.html'));
  }, 300_000);

  it('todo href interno aponta para um arquivo que existe', () => {
    const quebrados: string[] = [];
    for (const pagina of paginas) {
      const html = readFileSync(join('out', pagina), 'utf8');
      const hrefs = [...html.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1] ?? '');
      for (const href of hrefs) {
        const alvo = resolverHref(href);
        if (alvo === null) continue;
        if (!existsSync(join('out', alvo))) quebrados.push(`${pagina} → ${href} (${alvo})`);
      }
    }
    expect(quebrados).toEqual([]);
  });

  it('toda src interna aponta para um arquivo que existe', () => {
    const quebrados: string[] = [];
    for (const pagina of paginas) {
      const html = readFileSync(join('out', pagina), 'utf8');
      const srcs = [...html.matchAll(/src="(\/[^"]*)"/g)].map((m) => m[1] ?? '');
      for (const src of srcs) {
        const alvo = src.replace(/^\//, '');
        if (!existsSync(join('out', alvo))) quebrados.push(`${pagina} → ${src}`);
      }
    }
    expect(quebrados).toEqual([]);
  });

  it('todo fragmento apontado existe como id na página de destino', () => {
    const quebrados: string[] = [];
    for (const pagina of paginas) {
      const html = readFileSync(join('out', pagina), 'utf8');
      const comFragmento = [...html.matchAll(/href="(\/[^"#]*)#([^"]+)"/g)];
      for (const achado of comFragmento) {
        const alvo = resolverHref(achado[1] ?? '');
        if (alvo === null || !existsSync(join('out', alvo))) continue;
        const destino = readFileSync(join('out', alvo), 'utf8');
        if (!destino.includes(`id="${achado[2]}"`)) {
          quebrados.push(`${pagina} → ${achado[1]}#${achado[2]}`);
        }
      }
    }
    expect(quebrados).toEqual([]);
  });
});
