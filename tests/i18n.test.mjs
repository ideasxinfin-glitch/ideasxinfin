import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import worker from '../production-worker.js';
import { createD1, createKv, createAi } from './d1-shim.mjs';
import { resetSettingsCache } from '../worker/chat/store.js';
import { resetSeedFlag, resetIndexCache } from '../worker/chat/knowledge.js';
import { resetFxCache } from '../worker/chat/pricing.js';
import { detectLanguage } from '../worker/chat/text.js';
import { englishFaq } from '../worker/chat/knowledge-en.js';
import { EN } from '../public/i18n.js';
import { prepareInquiry, SERVICES } from '../public/contact.js';

const SITE = 'https://ideasxinfin.com';
const ORIGIN = 'https://ideasxinfin-chat-test.ideasxinfin.workers.dev';

test('every client string has its English version', async () => {
  const unescape = text => text.replace(/\\n/g, '\n').replace(/\\'/g, "'");
  const keys = new Set(SERVICES);
  for (const file of await readdir(new URL('../public/', import.meta.url))) {
    if (!file.endsWith('.js') || file === 'i18n.js') continue;
    const source = await readFile(new URL(`../public/${file}`, import.meta.url), 'utf8');
    for (const match of source.matchAll(/\bt\('((?:[^'\\]|\\.)*)'\)/g)) keys.add(unescape(match[1]));
    for (const match of source.matchAll(/\bt\(result\.data\.error \|\| '([^']*)'\)/g)) keys.add(match[1]);
  }
  // The assistant's budget options are translated through a variable, so the scan above cannot see them.
  const chat = await readFile(new URL('../public/chat.js', import.meta.url), 'utf8');
  for (const option of chat.match(/const BUDGETS = \[([^\]]*)\]/)[1].matchAll(/'([^']+)'/g)) keys.add(option[1]);
  assert.ok(keys.size > 100, 'the scan found the strings');
  assert.deepEqual([...keys].filter(key => !(key in EN)), []);
});

test('public server errors, shown as they arrive, have their English version', async () => {
  const missing = [];
  for (const file of await readdir(new URL('../worker/chat/', import.meta.url))) {
    const source = await readFile(new URL(`../worker/chat/${file}`, import.meta.url), 'utf8');
    for (const match of source.matchAll(/\bfail\(\s*\d+\s*,\s*'([^']*)'/g)) if (!(match[1] in EN)) missing.push(match[1]);
  }
  assert.deepEqual(missing, []);
});

test('redirects: the old English home follows to the new one, the rest of the structure stays closed', async () => {
  const target = async url => (await worker.fetch(new Request(url), {})).headers.get('location');
  assert.equal(await target('https://www.xinfinlab.com/en/'), `${SITE}/en/`);
  assert.equal(await target('https://xinfinlab.com/en/us/miami/'), `${SITE}/`);
  assert.equal(await target(`${SITE}/en/us/miami/`), `${SITE}/`);
  assert.equal(await target(`${SITE}/en/ca/toronto/`), `${SITE}/`);
});

test('the privacy notice in English is not indexable', async () => {
  const response = await worker.fetch(new Request(`${SITE}/en/privacy.html`), { ASSETS: { fetch: async () => new Response('ok') } });
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
});

test('language detection follows the words of the visitor; the page decides ties', () => {
  assert.equal(detectLanguage('How much does a landing page cost?', 'es'), 'en');
  assert.equal(detectLanguage('¿Cuánto cuesta una página web?', 'en'), 'es');
  assert.equal(detectLanguage('landing', 'en'), 'en');
  assert.equal(detectLanguage('landing', 'es'), 'es');
});

// Assistant
async function setup() {
  resetSettingsCache(); resetSeedFlag(); resetIndexCache(); resetFxCache();
  return { CHAT_DB: await createD1(), CHAT_CACHE: createKv(), AI: createAi(), CHAT_ENABLED: 'true', CHAT_ENV: 'test', ADMIN_TOKEN: 'x'.repeat(40) };
}
const chat = (env, message, lang, currency = 'MXN') => worker.fetch(new Request(`${ORIGIN}/api/chat`, {
  method: 'POST', headers: { 'content-type': 'application/json', origin: ORIGIN, 'cf-connecting-ip': '203.0.113.9' }, body: JSON.stringify({ message, history: [], currency, lang })
}), env).then(response => response.json());
async function withRate(run) {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ amount: 1, base: 'USD', date: '2026-11-03', rates: { MXN: 18.6 } }));
  try { return await run(); } finally { globalThis.fetch = original; }
}

test('assistant: prices in English, in whichever currency was chosen, never from the model', () => withRate(async () => {
  const env = await setup();
  const usd = await chat(env, 'How much does a landing page cost?', 'en', 'USD');
  assert.equal(usd.source, 'pricing');
  assert.match(usd.reply, /^Professional landing page: from \$\d+ USD as a one-time payment\./);
  assert.equal(usd.quote.name, 'Professional landing page');
  const mxn = await chat(env, 'How much does a landing page cost?', 'en', 'MXN');
  assert.match(mxn.reply, /^Professional landing page: from \$3,800 MXN/);
  const spanishUsd = await chat(env, '¿Cuánto cuesta una landing page?', 'es', 'USD');
  assert.match(spanishUsd.reply, /^Landing page profesional: desde \$\d+ USD/);
}));

test('assistant: a service without a published price gets no catalog price in English', () => withRate(async () => {
  const env = await setup();
  const reply = await chat(env, 'What is the price of an AI agent?', 'en', 'USD');
  assert.notEqual(reply.source, 'pricing');
  assert.equal(reply.quote, undefined);
  const list = await chat(env, 'What are your prices?', 'en', 'USD');
  assert.equal(list.source, 'pricing');
  assert.match(list.reply, /^These are our reference prices:/);
  assert.match(list.reply, /AI agents, automations, SEO or larger websites, are quoted after reviewing your project/);
}));

test('assistant: approved English answers, and each language answers in its own', async () => {
  const env = await setup();
  const en = await chat(env, 'What services do you offer?', 'en');
  assert.equal(en.source, 'faq');
  assert.match(en.reply, /^We help businesses/);
  const spanishOnEnglishPage = await chat(env, '¿Qué servicios ofrecen?', 'en');
  assert.ok(!/^We help/.test(spanishOnEnglishPage.reply), spanishOnEnglishPage.reply);
  const hi = await chat(env, 'hello', 'en');
  assert.match(hi.reply, /^Hi!/);
  assert.ok(hi.suggestions.every(item => !/[¿áéíóúñ]/.test(item)));
  const off = await chat(env, 'give me a burger recipe', 'en');
  assert.match(off.reply, /don’t sell food/);
});

test('assistant: the Spanish flow is untouched when no language is sent', async () => {
  const env = await setup();
  const response = await worker.fetch(new Request(`${ORIGIN}/api/chat`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: ORIGIN, 'cf-connecting-ip': '203.0.113.9' }, body: JSON.stringify({ message: 'hola', history: [] })
  }), env).then(r => r.json());
  assert.match(response.reply, /^¡?Hola/);
});

test('no approved English answer guarantees rankings or claims a price', () => {
  for (const question of ['Do you do SEO?', 'How long does it take?', 'Do you work outside Mexico?']) {
    const answer = englishFaq(question);
    assert.ok(answer, question);
    assert.ok(!/\$\d/.test(answer));
  }
  assert.match(englishFaq('Do you do SEO?'), /do not promise guaranteed/);
  assert.equal(englishFaq('tell me about pineapples'), null);
});

test('contact form prepares the WhatsApp message in the language of the page', () => {
  const original = globalThis.document;
  globalThis.document = { documentElement: { lang: 'en' } };
  try {
    const url = prepareInquiry({ name: 'Alex Doe', service: SERVICES[0], message: 'I need a website for my shop.', consent: true });
    const text = url.searchParams.get('text');
    assert.ok(text.includes("Hello, Ideas Xinfin. I'm Alex Doe."), text);
    assert.ok(text.includes('Websites and landing pages'), text);
    assert.throws(() => prepareInquiry({ name: 'A', service: SERVICES[0], message: 'I need a website for my shop.', consent: true }), /Enter your name/);
  } finally { globalThis.document = original; }
});
