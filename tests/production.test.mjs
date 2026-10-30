import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import worker from '../production-worker.js';
await import('../scripts/build-production.mjs');

test('www and HTTP redirect directly to final HTTPS URL, preserving path and query', async () => {
  for (const source of ['https://www.ideasxinfin.com/mx/merida/?utm_source=test', 'http://ideasxinfin.com/mx/merida/?utm_source=test']) {
    const response = await worker.fetch(new Request(source), {});
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), 'https://ideasxinfin.com/?utm_source=test');
  }
});
test('old domains preserve page paths, queries and public media in permanent redirects', async () => {
  for (const [source, target] of [
    ['http://www.xinfinlab.com/en/us/miami/?utm_source=old', 'https://ideasxinfin.com/?utm_source=old'],
    ['https://xinfinlab.com/mx/merida', 'https://ideasxinfin.com/'],
    ['https://xinfinlab.com/index.html', 'https://ideasxinfin.com/'],
    ['https://xinfinlab.com/img/pilar-landings.mp4', 'https://ideasxinfin.com/legacy/img/pilar-landings.mp4']
  ]) {
    const r = await worker.fetch(new Request(source), {});
    assert.equal(r.status, 301);
    assert.equal(r.headers.get('location'), target);
  }
});
test('production HTML is indexable while workers.dev and privacy remain noindex', async () => {
  const env = { ASSETS: { fetch: async () => new Response('<h1>Ideas Xinfin</h1>', { headers: { 'content-type': 'text/html' } }) } };
  for (const [url, noindex] of [['https://ideasxinfin.com/', false], ['https://ideasxinfin-production.ideasxinfin.workers.dev/', true], ['https://ideasxinfin.com/privacidad.html', true]]) {
    const r = await worker.fetch(new Request(url), env);
    assert.equal(r.headers.has('x-robots-tag'), noindex);
    assert.ok(r.headers.get('content-security-policy').includes("object-src 'none'"));
  }
  const robots = await worker.fetch(new Request('https://ideasxinfin-production.ideasxinfin.workers.dev/robots.txt'), env);
  assert.match(await robots.text(), /Disallow: \//);
});
test('unknown paths retain a real 404 instead of a homepage soft 404', async () => {
  const r = await worker.fetch(new Request('https://ideasxinfin.com/missing/'), { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } });
  assert.equal(r.status, 404);
  assert.equal(r.headers.get('x-robots-tag'), 'noindex, nofollow');
});
test('previous pages consolidate into the new landing and no previous HTML is published', async () => {
  const routes = JSON.parse(await readFile(new URL('../migration/routes.json', import.meta.url), 'utf8'));
  assert.equal(routes.length, 46);
  for (const route of routes.filter(r => r !== '/')) {
    const response = await worker.fetch(new Request('https://ideasxinfin.com' + route), {});
    assert.equal(response.status, 301, route);
    assert.equal(response.headers.get('location'), 'https://ideasxinfin.com/', route);
    await assert.rejects(access(new URL('../dist-production' + route + 'index.html', import.meta.url)));
  }
  const html = await readFile(new URL('../dist-production/index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('rel="canonical" href="https://ideasxinfin.com/"'));
  assert.ok(html.includes('class="device-stage"'));
  assert.ok(!html.includes('class="section coverage"'));
  assert.ok(!html.includes('href="https://ideasxinfin.com/en/"'));
  const sitemap = await readFile(new URL('../dist-production/sitemap.xml', import.meta.url), 'utf8');
  assert.equal((sitemap.match(/<loc>/g) || []).length, 1);
  const preview = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.ok(preview.includes('content="noindex,nofollow"'));
});
