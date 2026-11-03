import { normalize } from './text.js';

// Single source of the published "desde" prices, shared by the landing (/api/chat/pricing) and the assistant.
// MXN amounts are the authorised base prices. USD is a reference derived from them; see docs/PRECIOS.md.
export const PRICING_POLICY = Object.freeze({
  roundUsdTo: 5,       // USD always rounds up to the next multiple of 5; never cents.
  refreshHours: 12,    // A stored rate is reused for this long before asking the provider again.
  staleAfterDays: 7,   // Older rates are still used (never invented), but flagged as stale.
  rateBounds: [10, 40], // Sanity check: anything outside is treated as a provider error.
  provider: 'Frankfurter (tipo de referencia del Banco Central Europeo)',
  providerUrl: 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=MXN'
});

// usdMinimum: commercial floor in USD for that service (null = none). usdMargin: optional fraction (0.05 = +5 %).
export const CATALOG = Object.freeze([
  Object.freeze({ id: 'landing', name: 'Landing page profesional', nameEn: 'Professional landing page', mxn: 3800, billing: 'one_time', usdMinimum: 220, usdMargin: 0 }),
  Object.freeze({ id: 'landing_ai', name: 'Landing page con inteligencia artificial', nameEn: 'AI-powered landing page', mxn: 6500, billing: null, usdMinimum: 350, usdMargin: 0 }),
  Object.freeze({ id: 'social', name: 'Gestión de redes sociales y Google Business', nameEn: 'Social media and Google Business management', mxn: 3500, billing: 'monthly', usdMinimum: null, usdMargin: 0 })
]);
const BILLING = { es: { one_time: 'en un solo pago', monthly: 'al mes' }, en: { one_time: 'as a one-time payment', monthly: 'per month' } };
export const CURRENCIES = Object.freeze(['MXN', 'USD']);

export function usdFor(item, rate, policy = PRICING_POLICY) {
  if (!(rate > 0)) return null;
  const raw = (item.mxn / rate) * (1 + (item.usdMargin || 0));
  // The epsilon keeps exact multiples (e.g. 195.0000001 from float division) from jumping a step.
  const rounded = Math.ceil(raw / policy.roundUsdTo - 1e-9) * policy.roundUsdTo;
  return Math.max(rounded, item.usdMinimum || 0);
}

export const formatPrice = (amount, currency) => `$${amount.toLocaleString('en-US')} ${currency}`;
const formatDate = (iso, lang = 'es') => (lang === 'en'
  ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
  : iso.split('-').reverse().join('/'));

// Exchange rate: memory → KV → provider. A failed or absurd answer keeps the last valid value; with none, USD is unavailable.
const FX_KEY = 'fx:USD-MXN';
let memory = null;
export function resetFxCache() { memory = null; }

export async function getExchangeRate(env, { fetcher = globalThis.fetch, nowMs = Date.now(), policy = PRICING_POLICY } = {}) {
  let stored = memory;
  if (!stored && env.CHAT_CACHE) stored = await env.CHAT_CACHE.get(FX_KEY, 'json').catch(() => null);
  const age = stored ? nowMs - Date.parse(stored.fetchedAt) : Infinity;
  if (stored && age < policy.refreshHours * 3600000) return withStaleness(memory = stored, nowMs, policy);
  try {
    const response = await fetcher(policy.providerUrl, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const rate = Number(data?.rates?.MXN);
    if (!(rate >= policy.rateBounds[0] && rate <= policy.rateBounds[1]) || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) throw new Error('Respuesta no válida');
    const fresh = { rate, date: data.date, fetchedAt: new Date(nowMs).toISOString(), source: policy.provider };
    memory = fresh;
    if (env.CHAT_CACHE) await env.CHAT_CACHE.put(FX_KEY, JSON.stringify(fresh)).catch(() => {});
    return withStaleness(fresh, nowMs, policy);
  } catch {
    // Keep the last valid rate (with its own date); retry the provider on a later request.
    if (stored) { memory = { ...stored, fetchedAt: new Date(nowMs - (policy.refreshHours - 1) * 3600000).toISOString() }; return withStaleness(stored, nowMs, policy, true); }
    return null;
  }
}
function withStaleness(fx, nowMs, policy, providerFailed = false) {
  const days = (nowMs - Date.parse(`${fx.date}T00:00:00Z`)) / 86400000;
  return { rate: fx.rate, date: fx.date, fetchedAt: fx.fetchedAt, source: fx.source, stale: days > policy.staleAfterDays, providerFailed };
}

export async function pricingPayload(env, options) {
  const fx = await getExchangeRate(env, options);
  return {
    currencies: CURRENCIES, roundUsdTo: PRICING_POLICY.roundUsdTo,
    fx: fx && { rate: fx.rate, date: fx.date, source: fx.source, stale: fx.stale },
    services: CATALOG.map(item => ({ id: item.id, name: item.name, billing: item.billing, mxn: item.mxn, usd: fx ? usdFor(item, fx.rate) : null }))
  };
}

// Assistant: deterministic "desde" answers from the catalog, so prices never depend on the model.
const SERVICE_PATTERNS = [
  ['landing_ai', /\blanding\b.*\b(ia|ai|inteligencia artificial|artificial intelligence|asistente|assistant|chatbot|bot)\b|\b(ia|ai|inteligencia artificial|artificial intelligence|asistente|assistant|chatbot)\b.*\blanding\b|\b(ai|ai powered)\b.*\b(website|site)\b|\b(website|site)\b.*\b(with|using) (ai|artificial intelligence)\b/],
  ['landing', /\blanding\b/],
  ['social', /\b(redes|red social|redes sociales|social media|social networks?|google business|perfil de empresa|instagram|facebook|tiktok|community)\b/]
];
// Other services have no published price: those questions keep the regular knowledge flow.
const OTHER_SERVICE = /\b(agente|agentes|agent|agents|automatiz\w*|automat\w*|seo|posicionamiento|plataforma|plataformas|platform|platforms|tienda|store|shop|ecommerce|e commerce|sistema|system|app|aplicacion|application|chatbot|integracion\w*|integration\w*|corporativ\w*|corporate|branding|logo)\b/;
const PROMO = /\b(promocion|promociones|descuento|descuentos|oferta|ofertas|meses sin intereses|promotion|promotions|discount|discounts|coupon|deal|deals)\b/;

export function detectService(text) {
  const normalized = normalize(text);
  for (const [id, pattern] of SERVICE_PATTERNS) if (pattern.test(normalized)) return id;
  return OTHER_SERVICE.test(normalized) ? 'other' : null;
}

export async function pricingReply(env, message, history, requested, options, lang = 'es') {
  if (PROMO.test(normalize(message))) return null;
  let service = detectService(message);
  if (!service) {
    const previous = history.filter(item => item.role === 'user').slice(-1)[0]?.content;
    service = previous ? detectService(previous) : null;
  }
  if (service === 'other') return null;
  const fx = requested === 'USD' ? await getExchangeRate(env, options) : null;
  const currency = fx ? 'USD' : 'MXN';
  const priceOf = item => (currency === 'USD' ? usdFor(item, fx.rate) : item.mxn);
  const en = lang === 'en';
  const nameOf = item => (en ? item.nameEn : item.name);
  const line = item => `${en ? 'from' : 'desde'} ${formatPrice(priceOf(item), currency)}${item.billing ? ` ${BILLING[lang][item.billing]}` : ''}`;
  const note = requested === 'USD' && !fx ? (en ? 'For now I can only give you the price in Mexican pesos. ' : 'Por ahora solo puedo darte el precio en pesos mexicanos. ')
    : currency === 'USD' ? (en ? `This is a reference price in US dollars, based on the exchange rate of ${formatDate(fx.date, lang)}. ` : `Es un precio de referencia en dólares, calculado con el tipo de cambio del ${formatDate(fx.date)}. `) : '';
  const close = en ? 'The final cost depends on what your project needs; before we start, we send you a proposal with scope, price and validity. If you like, an advisor can help you on WhatsApp.'
    : 'El costo final depende de lo que necesite tu proyecto; antes de empezar te enviamos una propuesta con alcance, precio y vigencia. Si quieres, un asesor te ayuda por WhatsApp.';
  if (service) {
    const item = CATALOG.find(entry => entry.id === service);
    return {
      reply: `${nameOf(item)}: ${line(item)}. ${note}${close}`, source: 'pricing', actions: ['whatsapp'],
      quote: { service: item.id, name: nameOf(item), currency, amount: priceOf(item), rateDate: fx?.date || null }
    };
  }
  const list = CATALOG.map(item => `• ${nameOf(item)}: ${line(item)}.`).join('\n');
  return {
    reply: en ? `These are our reference prices:\n${list}\nOther services, such as AI agents, automations, SEO or larger websites, are quoted after reviewing your project. ${note}${close}`
      : `Estos son nuestros precios de referencia:\n${list}\nOtros servicios, como agentes de IA, automatizaciones, SEO o sitios más amplios, se cotizan después de un diagnóstico. ${note}${close}`,
    source: 'pricing', actions: ['whatsapp'], quote: null
  };
}

// Quote context sent with a lead: validated against the catalog so it cannot carry free text.
export function quoteNote(quote) {
  if (!quote || typeof quote !== 'object') return '';
  const item = CATALOG.find(entry => entry.id === quote.service);
  const amount = Number(quote.amount);
  if (!item || !CURRENCIES.includes(quote.currency) || !Number.isInteger(amount) || amount <= 0 || amount > 1000000) return '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(quote.rateDate || '') ? `, tipo de cambio del ${formatDate(quote.rateDate)}` : '';
  return `[Precio de referencia mostrado: ${item.name}, desde ${formatPrice(amount, quote.currency)}${date}. Orientativo, no es una cotización formal.]`;
}
