import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../production-worker.js';
import { createD1, createKv, createAi } from './d1-shim.mjs';
import { resetSettingsCache, setSetting, today } from '../worker/chat/store.js';
import { resetSeedFlag, resetIndexCache, extractSections } from '../worker/chat/knowledge.js';
import { classify, hasPersonalData, scrub } from '../worker/chat/text.js';
import { CONSENT_VERSION } from '../worker/chat/leads.js';

const ORIGIN = 'https://ideasxinfin-chat-test.ideasxinfin.workers.dev';
async function setup(vars = {}, behaviour = {}) {
  resetSettingsCache(); resetSeedFlag(); resetIndexCache();
  return { CHAT_DB: await createD1(), CHAT_CACHE: createKv(), AI: createAi(behaviour), CHAT_ENABLED: 'true', CHAT_ENV: 'test', ADMIN_TOKEN: 'x'.repeat(40), ...vars };
}
const chat = (env, message, history = [], ip = '203.0.113.1') => worker.fetch(new Request(`${ORIGIN}/api/chat`, {
  method: 'POST', headers: { 'content-type': 'application/json', origin: ORIGIN, 'cf-connecting-ip': ip }, body: JSON.stringify({ message, history })
}), env);
// The account allocation is shared: when exhausted, every Workers AI model reports it.
const QUOTA = { '@cf/google/gemma-4-26b-a4b-it': 'quota', '@cf/zai-org/glm-4.7-flash': 'quota' };
const generations = env => env.AI.calls.filter(call => !call.model.includes('bge'));

test('relevance rules separate off-topic, business and ambiguous questions', () => {
  assert.equal(classify('¿Cuánto cuesta una hamburguesa con queso y papas?').category, 'offtopic');
  assert.equal(classify('¿Puedes ayudarme con una hamburguesería?').category, 'business');
  assert.equal(classify('¿Qué opinas de mi idea?').category, 'ambiguous');
  assert.equal(classify('Hola').category, 'greeting');
  assert.ok(classify('¿Cuánto cobran por un sitio web?').priceIntent);
});

test('personal data is detected and scrubbed before any review log', () => {
  assert.ok(hasPersonalData('mi correo es ana@example.com'));
  assert.ok(hasPersonalData('llámame al 999 123 4567'));
  assert.ok(!hasPersonalData('¿Hacen landing pages?'));
  assert.ok(!scrub('Soy Ana López y quiero una web, escribe a ana@example.com').includes('ana@example.com'));
});

test('chat is a plain 404 when disabled, so the landing keeps its local demo', async () => {
  for (const env of [{}, { CHAT_ENABLED: 'false', CHAT_DB: {} }, { CHAT_ENABLED: 'true' }]) {
    const response = await worker.fetch(new Request(`${ORIGIN}/api/chat/status`), env);
    assert.equal(response.status, 404);
  }
  const admin = await worker.fetch(new Request('https://ideasxinfin.com/admin/chat/'), {});
  assert.equal(admin.status, 404);
});

test('off-topic questions get a friendly pivot without any model call', async () => {
  const env = await setup();
  const response = await chat(env, '¿Cuánto cuesta una hamburguesa con queso y papas?');
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.source, 'rules');
  assert.match(data.reply, /No vendemos comida/);
  assert.equal(generations(env).length, 0);
});

test('approved FAQ answers without generation and fills the exact cache', async () => {
  const env = await setup();
  const first = await (await chat(env, '¿Qué servicios ofrecen?')).json();
  assert.equal(first.source, 'faq');
  assert.match(first.reply, /landing pages/);
  assert.equal(generations(env).length, 0);
  assert.equal(env.CHAT_CACHE.store.size, 1);
  const second = await (await chat(env, 'que servicios ofrecen')).json();
  assert.equal(second.source, 'cache');
  assert.equal(generations(env).length, 0);
});

test('history-dependent or personal questions never use or feed the shared cache', async () => {
  const env = await setup();
  const history = [{ role: 'user', content: 'Tengo una taquería' }, { role: 'assistant', content: 'Excelente.' }];
  const data = await (await chat(env, '¿Qué tipo de página web me recomiendan?', history)).json();
  assert.equal(data.source, 'model');
  assert.equal(env.CHAT_CACHE.store.size, 0);
  await chat(env, 'Soy Ana López, mi correo es ana@example.com, ¿hacen tiendas en línea para mi negocio?', [], '203.0.113.9');
  const rows = (await env.CHAT_DB.prepare('SELECT question FROM candidates').all()).results;
  assert.ok(rows.every(row => !row.question.includes('ana@example.com')));
  assert.equal(rows.length, 0);
});

test('generated answers become review candidates, not shared cache entries', async () => {
  const env = await setup();
  const data = await (await chat(env, '¿Me ayudan a vender más en mi hamburguesería con una web?')).json();
  assert.equal(data.source, 'model');
  assert.ok(['gemma', 'glm'].includes(data.provider));
  assert.ok(!data.reply.includes('**'));
  assert.equal(env.CHAT_CACHE.store.size, 0);
  const candidate = await env.CHAT_DB.prepare("SELECT kind, status FROM candidates").first();
  assert.equal(candidate.status, 'pending');
  const system = generations(env)[0].input.messages[0];
  assert.equal(system.role, 'system');
  assert.match(system.content, /CONOCIMIENTO/);
  assert.equal(generations(env)[0].input.messages.at(-1).role, 'user');
});

test('explicit fallback: Gemma fails, GLM answers, one call each', async () => {
  const env = await setup({}, { '@cf/google/gemma-4-26b-a4b-it': 'fail' });
  const data = await (await chat(env, 'Quiero una plataforma de reservas con integraciones para mi gimnasio, con varias sucursales y pagos en línea')).json();
  assert.equal(data.provider, 'glm');
  assert.deepEqual(generations(env).map(call => call.model), ['@cf/google/gemma-4-26b-a4b-it', '@cf/zai-org/glm-4.7-flash']);
});

test('exhausted Workers AI quota pauses both Workers AI models and, without Groq, offers FAQs and WhatsApp', async () => {
  const env = await setup({}, QUOTA);
  const data = await (await chat(env, 'Necesito automatizar las citas de mi consultorio dental con varios doctores')).json();
  assert.equal(data.source, 'fallback');
  assert.ok(data.suggestions.length > 0);
  assert.deepEqual(data.actions, ['whatsapp']);
  // GLM shares the same account allocation: after the first quota error no other Workers AI model is tried.
  assert.equal(generations(env).length, 1);
  const again = await (await chat(env, 'Quiero un agente de IA para mi inmobiliaria con muchas propiedades', [], '203.0.113.2')).json();
  assert.equal(again.source, 'fallback');
  assert.equal(generations(env).length, 1);
  // Published prices answer from the catalog, so the check uses a suggestion without price intent.
  const faq = await (await chat(env, data.suggestions.find(question => !classify(question).priceIntent), [], '203.0.113.3')).json();
  assert.equal(faq.source, 'faq');
});

test('server-side neuron budget blocks generation before calling any paid-capable model', async () => {
  const env = await setup();
  await setSetting(env.CHAT_DB, 'neuronBudget', 1);
  const data = await (await chat(env, 'Quiero una estrategia de marketing digital para mi boutique de ropa')).json();
  assert.equal(data.source, 'fallback');
  assert.equal(generations(env).length, 0);
  const usage = await env.CHAT_DB.prepare("SELECT neurons FROM usage_daily WHERE day = ? AND provider = 'workers-ai'").bind(today()).first();
  assert.ok(!usage || usage.neurons <= 1);
});

test('Groq is used only when configured, after Workers AI is unavailable', async () => {
  const env = await setup({ GROQ_API_KEY: 'gsk_test_value' }, QUOTA);
  const original = globalThis.fetch; const seen = [];
  globalThis.fetch = async (url, init) => { seen.push({ url, body: JSON.parse(init.body) }); return new Response(JSON.stringify({ choices: [{ message: { content: 'Respuesta de Groq.' } }], usage: { prompt_tokens: 10, completion_tokens: 5 } }), { status: 200 }); };
  try {
    const data = await (await chat(env, 'Quiero un chatbot para atender a los clientes de mi hotel')).json();
    assert.equal(data.provider, 'groq');
    assert.equal(seen.length, 1);
    assert.equal(seen[0].body.model, 'openai/gpt-oss-120b');
  } finally { globalThis.fetch = original; }
});

test('per-visitor limits are enforced in the server', async () => {
  const env = await setup();
  await setSetting(env.CHAT_DB, 'visitorPerWindow', 2);
  await chat(env, 'Hola'); await chat(env, 'Hola');
  const response = await chat(env, 'Hola');
  assert.equal(response.status, 429);
  assert.ok(response.headers.get('retry-after'));
  const other = await chat(env, 'Hola', [], '198.51.100.7');
  assert.equal(other.status, 200);
});

test('input validation rejects oversized, cross-origin and non-JSON requests', async () => {
  const env = await setup();
  assert.equal((await chat(env, 'x'.repeat(601))).status, 400);
  const cross = await worker.fetch(new Request(`${ORIGIN}/api/chat`, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example' }, body: '{"message":"hola"}' }), env);
  assert.equal(cross.status, 403);
  const text = await worker.fetch(new Request(`${ORIGIN}/api/chat`, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'hola' }), env);
  assert.equal(text.status, 415);
});

test('leads stay disabled by default and require explicit consent when enabled', async () => {
  const lead = { name: 'Prueba', business: 'Negocio de prueba', service: 'IA y automatizaciones', need: 'Quiero automatizar las respuestas de WhatsApp', contact: 'prueba@example.test', consent: true, consentVersion: CONSENT_VERSION };
  const post = (env, body) => worker.fetch(new Request(`${ORIGIN}/api/chat/lead`, { method: 'POST', headers: { 'content-type': 'application/json', origin: ORIGIN }, body: JSON.stringify(body) }), env);
  const disabled = await setup();
  assert.equal((await post(disabled, lead)).status, 403);
  const env = await setup({ LEAD_CAPTURE_ENABLED: 'true', LEAD_RETENTION_DAYS: '90' });
  assert.equal((await post(env, { ...lead, consent: false })).status, 400);
  const created = await post(env, lead);
  assert.equal(created.status, 201);
  const row = await env.CHAT_DB.prepare('SELECT * FROM leads').first();
  assert.equal(row.consent_version, CONSENT_VERSION);
  assert.equal(row.source, 'chat');
  assert.ok(Date.parse(row.expires_at) - Date.now() < 91 * 86400000);
});

test('admin API requires the server token and approving knowledge invalidates the cache', async () => {
  const env = await setup();
  const admin = (path, init = {}, token = env.ADMIN_TOKEN) => worker.fetch(new Request(`${ORIGIN}/api/admin/${path}`, { ...init, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(init.headers || {}) } }), env);
  assert.equal((await admin('overview', {}, 'wrong-token-value-with-enough-length-000')).status, 401);
  assert.equal((await worker.fetch(new Request(`${ORIGIN}/api/admin/overview`), env)).status, 401);
  await chat(env, '¿Cuánto cuesta una página web?');
  const before = (await (await admin('overview')).json()).settings.knowledgeVersion;
  const created = await admin('knowledge', { method: 'POST', body: JSON.stringify({ kind: 'price', title: 'Landing page básica', content: 'Landing page básica desde $X MXN según alcance (dato de prueba).', status: 'approved', visibility: 'internal', priority: 50 }) });
  assert.equal(created.status, 201);
  const after = (await (await admin('overview')).json()).settings.knowledgeVersion;
  assert.ok(after > before);
  // Services outside the published catalog keep the RAG flow, where approved prices prevail over the old FAQ.
  const data = await (await chat(env, '¿Cuánto cuesta un sitio corporativo?', [], '203.0.113.50')).json();
  assert.equal(data.source, 'model');
  const system = generations(env).at(-1).input.messages[0].content;
  assert.match(system, /Landing page básica/);
  const page = await worker.fetch(new Request(`${ORIGIN}/admin/chat/`), env);
  assert.equal(page.headers.get('x-robots-tag'), 'noindex, nofollow');
});

test('confidential knowledge never reaches the model', async () => {
  const env = await setup();
  const headers = { authorization: `Bearer ${env.ADMIN_TOKEN}`, 'content-type': 'application/json' };
  await worker.fetch(new Request(`${ORIGIN}/api/admin/knowledge`, { method: 'POST', headers, body: JSON.stringify({ kind: 'policy', title: 'Costo interno de hosting', content: 'COSTO-SECRETO-123 por mes de hosting interno.', status: 'approved', visibility: 'confidential', priority: 90 }) }), env);
  await chat(env, '¿Cuál es el costo interno de hosting de sus plataformas para negocios?');
  assert.ok(generations(env).every(call => !JSON.stringify(call.input).includes('COSTO-SECRETO-123')));
});

test('landing sync extracts public sections and skips the contact form', () => {
  const sections = extractSections('<section id="servicios"><h2>Servicios</h2><p>Plataformas digitales, inteligencia artificial y marketing para negocios que quieren crecer.</p></section><section id="contacto"><h2>Contacto</h2><p>Formulario con datos personales que no debe sincronizarse nunca.</p></section>');
  assert.equal(sections.length, 1);
  assert.equal(sections[0].id, 'servicios');
});

test('production admin stays closed without Cloudflare Access and accepts only a valid Access JWT', async () => {
  const closed = await setup({ CHAT_ENV: 'production' });
  assert.equal((await worker.fetch(new Request('https://ideasxinfin.com/admin/chat/'), closed)).status, 404);
  const team = 'ideasxinfin.cloudflareaccess.com'; const aud = 'test-aud';
  const env = await setup({ CHAT_ENV: 'production', ACCESS_TEAM_DOMAIN: team, ACCESS_AUD: aud });
  const { privateKey, publicKey } = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = { ...(await crypto.subtle.exportKey('jwk', publicKey)), kid: 'k1' };
  const enc = value => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');
  const sign = async claims => { const unsigned = `${enc({ alg: 'RS256', kid: 'k1' })}.${enc(claims)}`; return `${unsigned}.${Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(unsigned))).toString('base64url')}`; };
  const original = globalThis.fetch;
  globalThis.fetch = async url => { assert.equal(String(url), `https://${team}/cdn-cgi/access/certs`); return new Response(JSON.stringify({ keys: [jwk] })); };
  try {
    const call = jwt => worker.fetch(new Request('https://ideasxinfin.com/api/admin/overview', { headers: { authorization: `Bearer ${env.ADMIN_TOKEN}`, ...(jwt ? { 'cf-access-jwt-assertion': jwt } : {}) } }), env);
    assert.equal((await call(null)).status, 403);
    assert.equal((await call(await sign({ aud: ['other'], iss: `https://${team}`, exp: Date.now() / 1000 + 60 }))).status, 403);
    assert.equal((await call(await sign({ aud: [aud], iss: `https://${team}`, exp: Date.now() / 1000 - 60 }))).status, 403);
    assert.equal((await call(await sign({ aud: [aud], iss: `https://${team}`, exp: Date.now() / 1000 + 60 }))).status, 200);
  } finally { globalThis.fetch = original; }
});
