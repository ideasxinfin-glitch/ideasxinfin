import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import worker from '../production-worker.js';
import { SEO_ROUTES, EN_ROUTES } from '../scripts/seo-pages.mjs';
import { renderEnglishHome } from '../scripts/en-home.mjs';
await import('../scripts/build-production.mjs');

test('www and HTTP redirect directly to final HTTPS URL, preserving path and query', async () => {
  for (const source of ['https://www.ideasxinfin.com/mx/merida/?utm_source=test', 'http://ideasxinfin.com/mx/merida/?utm_source=test']) {
    const response = await worker.fetch(new Request(source), {});
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), 'https://ideasxinfin.com/mx/merida/?utm_source=test');
  }
});
test('old domains preserve page paths, queries and public media in permanent redirects', async () => {
  for (const [source, target] of [
    ['http://www.xinfinlab.com/en/us/miami/?utm_source=old', 'https://ideasxinfin.com/?utm_source=old'],
    ['https://xinfinlab.com/mx/merida', 'https://ideasxinfin.com/mx/merida/'],
    ['https://xinfinlab.com/mx/tijuana/', 'https://ideasxinfin.com/'],
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
test('previous pages without a new equivalent consolidate into the landing; city pages are served', async () => {
  const routes = JSON.parse(await readFile(new URL('../migration/routes.json', import.meta.url), 'utf8'));
  assert.equal(routes.length, 46);
  for (const route of SEO_ROUTES) {
    const page = await readFile(new URL('../dist-production' + route + 'index.html', import.meta.url), 'utf8');
    assert.ok(page.includes(`rel="canonical" href="https://ideasxinfin.com${route}"`), route);
    assert.ok(page.includes('content="index,follow'), route);
    assert.ok(!page.includes('class="section coverage"'), route);
    const served = await worker.fetch(new Request('https://ideasxinfin.com' + route), { ASSETS: { fetch: async () => new Response(page, { headers: { 'content-type': 'text/html' } }) } });
    assert.equal(served.status, 200, route);
    assert.equal(served.headers.has('x-robots-tag'), false, route);
  }
  const titles = new Set();
  for (const route of ['/', ...SEO_ROUTES]) titles.add((await readFile(new URL('../dist-production' + route + 'index.html', import.meta.url), 'utf8')).match(/<title>([^<]+)/)[1]);
  assert.equal(titles.size, SEO_ROUTES.length + 1, 'each page has its own title');
  for (const route of routes.filter(r => r !== '/' && !SEO_ROUTES.includes(r) && !EN_ROUTES.includes(r))) {
    const response = await worker.fetch(new Request('https://ideasxinfin.com' + route), {});
    assert.equal(response.status, 301, route);
    assert.equal(response.headers.get('location'), 'https://ideasxinfin.com/', route);
    await assert.rejects(access(new URL('../dist-production' + route + 'index.html', import.meta.url)));
  }
  const html = await readFile(new URL('../dist-production/index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('rel="canonical" href="https://ideasxinfin.com/"'));
  assert.ok(html.includes('class="device-stage"'));
  assert.ok(!html.includes('class="section coverage"'));
  assert.ok(html.includes('hreflang="en" href="https://ideasxinfin.com/en/"'));
  const sitemap = await readFile(new URL('../dist-production/sitemap.xml', import.meta.url), 'utf8');
  assert.equal((sitemap.match(/<loc>/g) || []).length, SEO_ROUTES.length + EN_ROUTES.length + 1);
  for (const route of SEO_ROUTES) assert.ok(html.includes(`href="${route}"`), 'home links ' + route);
  const preview = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.ok(preview.includes('content="noindex,nofollow"'));
});

// English version. These read the build this file runs on import, so they cannot live in another test file.
const SITE = 'https://ideasxinfin.com';
const built = route => readFile(new URL(`../dist-production${route}index.html`, import.meta.url), 'utf8');
const visible = html => html.replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const alternates = html => Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(m => [m[1], m[2]]));

test('each English URL is a real page in English, with its own metadata', async () => {
  const titles = new Set();
  for (const route of EN_ROUTES) {
    const html = await built(route);
    const served = await worker.fetch(new Request(SITE + route), { ASSETS: { fetch: async () => new Response(html, { headers: { 'content-type': 'text/html' } }) } });
    assert.equal(served.status, 200, route);
    assert.equal(served.headers.has('x-robots-tag'), false, route);
    assert.ok(html.includes('<html lang="en"'), route);
    assert.ok(html.includes(`rel="canonical" href="${SITE}${route}"`), route);
    assert.ok(html.includes(`property="og:url" content="${SITE}${route}"`), route);
    assert.ok(html.includes('content="index,follow'), route);
    assert.ok(!html.includes('data-en='), `${route} must not redirect to itself`);
    assert.match(html, /property="og:locale" content="en_US"/, route);
    const text = visible(html);
    assert.deepEqual(text.match(/[¿¡áéíóúñ]\S*/gi) || [], [], `${route} has Spanish text`);
    assert.deepEqual(text.match(/\b(para|nuestros|servicios|también|cuéntanos|solicitar|consulta)\b/gi) || [], [], `${route} has Spanish text`);
    assert.ok((html.match(/<h1[\s>]/g) || []).length === 1, `${route} has one H1`);
    titles.add(html.match(/<title>([^<]+)/)[1]);
    for (const block of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      JSON.parse(block[1]);
      assert.ok(!block[1].includes('<span'), `${route} structured data holds markup`);
    }
  }
  assert.equal(titles.size, EN_ROUTES.length, 'unique titles');
});

test('hreflang is reciprocal and x-default points to the Spanish version', async () => {
  const pairs = [['/', '/en/'], ['/servicios/landing-pages/', '/en/services/website-landing-page-design/'], ['/servicios/inteligencia-artificial/', '/en/services/ai-agents-automation/'], ['/servicios/redes-sociales-google-business/', '/en/services/digital-marketing/'], ['/servicios/seo/', '/en/services/seo/']];
  assert.equal(pairs.length, EN_ROUTES.length);
  for (const [es, en] of pairs) {
    for (const route of [es, en]) {
      assert.deepEqual(alternates(await built(route)), { es: SITE + es, 'es-MX': SITE + es, en: SITE + en, 'x-default': SITE + es }, route);
    }
    assert.ok((await built(es)).includes(`rel="canonical" href="${SITE}${es}"`), es);
    assert.ok((await built(es)).includes(`data-en="${en}"`), es);
  }
});

test('Spanish city pages keep their canonical and do not claim an English version', async () => {
  const cities = SEO_ROUTES.filter(route => !route.startsWith('/servicios/'));
  assert.ok(cities.length > 0);
  for (const route of cities) {
    const html = await built(route);
    assert.ok(html.includes('<html lang="es"'), route);
    assert.ok(html.includes(`rel="canonical" href="${SITE}${route}"`), route);
    assert.equal(alternates(html).en, undefined, route);
    assert.ok(!html.includes('data-en='), route);
  }
});

test('sitemap lists both languages; preview pages stay out of the index', async () => {
  const sitemap = await readFile(new URL('../dist-production/sitemap.xml', import.meta.url), 'utf8');
  for (const route of ['/', ...SEO_ROUTES, ...EN_ROUTES]) assert.ok(sitemap.includes(`<loc>${SITE}${route}</loc>`), route);
  assert.ok(!sitemap.includes('privacy'));
  const preview = renderEnglishHome(await readFile(new URL('../public/index.html', import.meta.url), 'utf8'));
  assert.ok(preview.includes('content="noindex,nofollow"'));
  const robots = await worker.fetch(new Request('https://ideasxinfin-chat-test.ideasxinfin.workers.dev/en/'), { ASSETS: { fetch: async () => new Response(preview) } });
  assert.equal(robots.headers.get('x-robots-tag'), 'noindex, nofollow');
});
