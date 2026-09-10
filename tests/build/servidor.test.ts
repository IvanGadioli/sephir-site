import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { criarServidor } from '../support/servidor-estatico.mjs';

let s: { url: string; fechar: () => Promise<void> };
beforeAll(async () => { s = await criarServidor({ raiz: 'out', porta: 4199 }); });
afterAll(async () => { await s.fechar(); });

const get = (p: string, init?: RequestInit) =>
  fetch(`${s.url}${p}`, { redirect: 'manual', ...init });

describe('a origem resolve como o Cloudflare Pages', () => {
  it('serve a casca', async () => expect((await get('/')).status).toBe(200));
  it('serve a home', async () => expect((await get('/pt/')).status).toBe(200));
  it('301 na falta da barra final', async () => {
    const r = await get('/pt');
    expect(r.status).toBe(301);
    expect(r.headers.get('location')).toBe('/pt/');
  });
  it('404 com o corpo do 404.html', async () => {
    const r = await get('/nao-existe/');
    expect(r.status).toBe(404);
    expect(await r.text()).toContain('href="/pt/"');
  });
  it('comprime, e diz que comprimiu', async () => {
    const r = await get('/pt/', { headers: { 'accept-encoding': 'gzip' } });
    // o status entra na asserção de propósito: sem ele, este teste passa
    // com out/ ausente — o servidor comprime o corpo do 404 e o
    // content-encoding sai igual. Era o único verde da leva RED do portão 05.
    expect(r.status).toBe(200);
    expect(r.headers.get('content-encoding')).toBe('gzip');
  });
});
