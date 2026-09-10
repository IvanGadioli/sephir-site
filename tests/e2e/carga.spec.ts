import { test, expect } from '@playwright/test';
import { medirW3W4 } from '../../ferramentas/oraculos/w3w4-carga.mjs';

test.describe.configure({ timeout: 600_000 });

test('E e F — a home cabe no orçamento de peso e de tempo', async () => {
  const r = await medirW3W4({ url: 'http://localhost:4173', rota: '/pt/' });
  expect(r.detalhe.bytes.html).toBeLessThanOrEqual(20_000);
  expect(r.detalhe.bytes.css).toBeLessThanOrEqual(25_000);
  expect(r.detalhe.bytes.js).toBeLessThanOrEqual(130_000);
  expect(r.detalhe.bytes.poster).toBe(0);
  expect(r.detalhe.bytes.total).toBeLessThanOrEqual(175_000);
  expect(r.detalhe.tempo.lcp).toBeLessThanOrEqual(2_500);
  expect(r.detalhe.tempo.cls).toBeLessThanOrEqual(0.05);
  expect(r.detalhe.tempo.tbt).toBeLessThanOrEqual(200);
});

test('o polyfill nomodule não entra na soma de JS', async () => {
  const r = await medirW3W4({ url: 'http://localhost:4173', rota: '/pt/' });
  expect(r.detalhe.excluidos.some((u: string) => u.includes('polyfills'))).toBe(true);
});

test('sem content-encoding, é ambiente e não comportamento', async () => {
  const r = await medirW3W4({ url: 'http://localhost:4173', rota: '/pt/', semCompressao: true });
  expect(r.codigo).toBe(3);
});
