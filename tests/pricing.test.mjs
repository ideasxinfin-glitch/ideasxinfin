import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker from '../production-worker.js';
import { createD1, createKv, createAi } from './d1-shim.mjs';
import { resetSettingsCache } from '../worker/chat/store.js';
import { resetSeedFlag, resetIndexCache } from '../worker/chat/knowledge.js';
import { CATALOG, PRICING_POLICY, usdFor, getExchangeRate, resetFxCache, quoteNote, detectService } from '../worker/chat/pricing.js';
import { prepareInquiry, SERVICES } from '../public/contact.js';

const ORIGIN = 'https://ideasxinfin-chat-test.ideasxinfin.workers.dev';
const item = id => CATALOG.find(entry => entry.id === id);
const NOW = Date.parse('2026-11-03T15:00:00Z');
const provider = (rate, date = '2026-11-03', calls = []) => async url => { calls.push(url); return new Response(JSON.stringify({ amount: 1, base: 'USD', date, rates: { MXN: rate } })); };
const failing = calls => async url => { calls.push(url); throw new Error('network'); };

async function setup() {
  resetSettingsCache(); resetSeedFlag(); resetIndexCache(); resetFxCache();
  return { CHAT_DB: await createD1(), CHAT_CACHE: createKv(), AI: createAi(), CHAT_ENABLED: 'true', CHAT_ENV: 'test', ADMIN_TOKEN: 'x'.repeat(40) };
}
// The worker uses the global fetch for the provider; each test swaps it and restores it.
async function withFetch(fetcher, run) {
  const original = globalThis.fetch;
  globalThis.fetch = fetcher;
  try { return await run(); } finally { globalThis.fetch = original; }
}
const chat = (env, message, currency, history = []) => worker.fetch(new Request(`${ORIGIN}/api/chat`, {
  method: 'POST', headers: { 'content-type': 'application/json', origin: ORIGIN, 'cf-connecting-ip': '203.0.113.9' }, body: JSON.stringify({ message, history, currency })
}), env).then(response => response.json());

test('authorised MXN base prices are unchanged', () => {
  assert.deepEqual(CATALOG.map(entry => [entry.id, entry.mxn]), [['landing', 3800], ['landing_ai', 6500], ['social', 3500]]);
});

test('USD at rate 18 and 18.90 follows the commercial rules', () => {
  assert.deepEqual(['landing', 'social', 'landing_ai'].map(id => usdFor(item(id), 18)), [220, 195, 365]);
  assert.deepEqual(['landing', 'social', 'landing_ai'].map(id => usdFor(item(id), 18.9)), [220, 190, 350]);
});

test('USD is always a whole multiple of the rounding step, never below the minimum', () => {
  for (let rate = 15; rate <= 25; rate += 0.0137) {
    for (const entry of CATALOG) {
      const usd = usdFor(entry, rate);
      assert.ok(Number.isInteger(usd) && usd % PRICING_POLICY.roundUsdTo === 0, `${entry.id} @ ${rate}`);
      assert.ok(usd >= entry.mxn / rate - 1e-9 && usd >= (entry.usdMinimum || 0));
    }
  }
  // Margin and rounding step are configurable per service / policy.
  assert.equal(usdFor({ mxn: 3500, usdMargin: 0.1, usdMinimum: null }, 18), 215);
  assert.equal(usdFor({ mxn: 3500, usdMargin: 0, usdMinimum: null }, 18, { roundUsdTo: 10 }), 200);
  assert.equal(usdFor(item('landing'), 0), null);
});

test('exchange rate is fetched once, stored with its date and reused inside the refresh window', async () => {
  resetFxCache();
  const env = { CHAT_CACHE: createKv() }, calls = [];
  const first = await getExchangeRate(env, { fetcher: provider(18.5974, '2026-11-02', calls), nowMs: NOW });
  assert.equal(first.rate, 18.5974); assert.equal(first.date, '2026-11-02'); assert.equal(first.stale, false);
  assert.equal(JSON.parse(env.CHAT_CACHE.store.get('fx:USD-MXN')).date, '2026-11-02');
  resetFxCache(); // A new isolate still reads KV instead of calling the provider.
  const second = await getExchangeRate(env, { fetcher: provider(30, '2026-11-03', calls), nowMs: NOW + 3600000 });
  assert.equal(second.rate, 18.5974); assert.equal(calls.length, 1);
});

test('provider failure keeps the last valid rate and date; with none stored USD is unavailable', async () => {
  resetFxCache();
  const env = { CHAT_CACHE: createKv() }, calls = [];
  await getExchangeRate(env, { fetcher: provider(18.9, '2026-11-01'), nowMs: NOW });
  const later = NOW + 13 * 3600000;
  const kept = await getExchangeRate(env, { fetcher: failing(calls), nowMs: later });
  assert.equal(kept.rate, 18.9); assert.equal(kept.date, '2026-11-01'); assert.equal(kept.providerFailed, true); assert.equal(calls.length, 1);
  // Absurd answers are provider errors too.
  const absurd = await getExchangeRate(env, { fetcher: provider(1890), nowMs: later + 2 * 3600000 });
  assert.equal(absurd.rate, 18.9);
  const old = await getExchangeRate(env, { fetcher: failing([]), nowMs: Date.parse('2026-11-20T00:00:00Z') });
  assert.equal(old.rate, 18.9); assert.equal(old.stale, true);
  resetFxCache();
  assert.equal(await getExchangeRate({ CHAT_CACHE: createKv() }, { fetcher: failing([]), nowMs: NOW }), null);
});

test('/api/chat/pricing serves both currencies from the catalog', async () => {
  const env = await setup();
  const data = await withFetch(provider(18), async () => (await worker.fetch(new Request(`${ORIGIN}/api/chat/pricing`), env)).json());
  assert.deepEqual(data.currencies, ['MXN', 'USD']);
  assert.equal(data.fx.rate, 18); assert.equal(data.fx.date, '2026-11-03');
  assert.deepEqual(data.services.map(service => [service.id, service.mxn, service.usd]), [['landing', 3800, 220], ['landing_ai', 6500, 365], ['social', 3500, 195]]);
  const failed = await setup();
  const none = await withFetch(failing([]), async () => (await worker.fetch(new Request(`${ORIGIN}/api/chat/pricing`), failed)).json());
  assert.equal(none.fx, null); assert.ok(none.services.every(service => service.usd === null && service.mxn > 0));
});

test('assistant answers the same "desde" price in MXN and USD, with date and WhatsApp', async () => {
  const env = await setup();
  await withFetch(provider(18.9), async () => {
    const mxn = await chat(env, '¿Cuánto cuesta una landing page con IA?', 'MXN');
    assert.equal(mxn.source, 'pricing'); assert.match(mxn.reply, /desde \$6,500 MXN/); assert.match(mxn.reply, /WhatsApp/);
    assert.deepEqual(mxn.quote, { service: 'landing_ai', name: 'Landing page con inteligencia artificial', currency: 'MXN', amount: 6500, rateDate: null });
    const usd = await chat(env, '¿Cuánto cuesta una landing page con IA?', 'USD');
    assert.match(usd.reply, /desde \$350 USD/); assert.match(usd.reply, /03\/11\/2026/); assert.equal(usd.quote.rateDate, '2026-11-03');
    const social = await chat(env, '¿Y cuánto cobran por manejar redes sociales?', 'USD');
    assert.match(social.reply, /desde \$190 USD al mes/);
    const followUp = await chat(env, '¿Y en cuánto sale?', 'MXN', [{ role: 'user', content: 'Me interesa una landing page' }, { role: 'assistant', content: 'Claro.' }]);
    assert.match(followUp.reply, /Landing page profesional: desde \$3,800 MXN en un solo pago/);
    const generic = await chat(env, '¿Cuánto cuestan sus servicios?', 'MXN');
    assert.match(generic.reply, /\$3,800 MXN[\s\S]*\$6,500 MXN[\s\S]*\$3,500 MXN/); assert.equal(generic.quote, null);
  });
  assert.equal(env.AI.calls.filter(call => !call.model.includes('bge')).length, 0, 'prices never come from the model');
});

test('USD request without any rate answers in MXN and says so', async () => {
  const env = await setup();
  const data = await withFetch(failing([]), () => chat(env, '¿Cuánto cuesta una landing page?', 'USD'));
  assert.match(data.reply, /desde \$3,800 MXN/); assert.match(data.reply, /solo puedo darte el precio en pesos/); assert.equal(data.quote.currency, 'MXN');
});

test('services without a published price and promotions keep the regular flow', async () => {
  assert.equal(detectService('¿Cuánto cuesta un agente de IA para WhatsApp?'), 'other');
  assert.equal(detectService('precio de landing con chatbot'), 'landing_ai');
  const env = await setup();
  const agent = await withFetch(provider(18), () => chat(env, '¿Cuánto cuesta un agente de IA para WhatsApp?', 'USD'));
  assert.notEqual(agent.source, 'pricing'); assert.ok(!/\$\d[\d,]* USD/.test(agent.reply), 'no invented USD price');
  const promo = await withFetch(provider(18), () => chat(env, '¿Tienen alguna promoción en landing pages?', 'MXN'));
  assert.notEqual(promo.source, 'pricing');
});

test('quote context in a lead is validated against the catalog', () => {
  assert.match(quoteNote({ service: 'landing', currency: 'USD', amount: 220, rateDate: '2026-11-03' }), /Landing page profesional, desde \$220 USD, tipo de cambio del 03\/11\/2026\. Orientativo/);
  for (const bad of [null, 'texto', { service: 'otro', currency: 'MXN', amount: 1 }, { service: 'landing', currency: 'EUR', amount: 1 }, { service: 'landing', currency: 'MXN', amount: 10.5 }, { service: 'landing', currency: 'MXN', amount: -1 }]) assert.equal(quoteNote(bad), '');
});

test('landing HTML ships the catalog MXN prices', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  for (const entry of CATALOG) {
    const amounts = [...html.matchAll(new RegExp(`data-price="${entry.id}" data-mxn="(\\d+)"`, 'g'))].map(match => Number(match[1]));
    assert.ok(amounts.length >= 1, entry.id); assert.ok(amounts.every(amount => amount === entry.mxn), entry.id);
  }
});

test('WhatsApp inquiry carries the reference price as orientative', () => {
  const url = prepareInquiry({ name: 'Ana', service: SERVICES[0], message: 'Quiero una página para mi negocio.', consent: true, reference: 'Landing page profesional, desde $220 USD, tipo de cambio del 03/11/2026' });
  assert.match(url.searchParams.get('text'), /Precio de referencia que vi: Landing page profesional, desde \$220 USD, tipo de cambio del 03\/11\/2026\. Entiendo que es orientativo/);
});
