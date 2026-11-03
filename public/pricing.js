import { t, lang, formatDate } from './i18n.js';

// Market preference: México shows MXN, Global shows USD references from /api/chat/pricing.
// It is independent from the page language: a saved choice always wins, in either language.
// The page ships MXN in its HTML (data-mxn); without the API, Global falls back to MXN and says so.
const KEY = 'ixf-market';
const MEXICO_ZONES = /^America\/(Mexico_City|Cancun|Merida|Monterrey|Matamoros|Chihuahua|Ciudad_Juarez|Ojinaga|Mazatlan|Bahia_Banderas|Hermosillo|Tijuana)$/;
const NAMES = { landing: t('Landing page profesional'), landing_ai: t('Landing page con inteligencia artificial'), social: t('Gestión de redes sociales y Google Business') };

function initialMarket() {
  try { const saved = localStorage.getItem(KEY); if (saved === 'mx' || saved === 'global') return saved; } catch { /* Storage may be blocked. */ }
  // First visit only: English starts in USD; otherwise the device time zone is the hint. The visitor can always switch.
  if (lang() === 'en') return 'global';
  try { const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; if (zone && !MEXICO_ZONES.test(zone)) return 'global'; } catch { /* Keep México. */ }
  return 'mx';
}

let market = initialMarket();
let pricing = null;
let status = 'idle'; // idle | loading | ready | failed
const formatPrice = (amount, currency) => `$${amount.toLocaleString('en-US')} ${currency}`;

export const requestedCurrency = () => (market === 'global' ? 'USD' : 'MXN');
export const currentCurrency = () => (market === 'global' && pricing?.fx ? 'USD' : 'MXN');

function mxnOf(id) { return Number(document.querySelector(`[data-price="${id}"]`)?.dataset.mxn) || null; }
// What the visitor is seeing for a service, in the currency shown on screen.
export function quoteFor(id) {
  const currency = currentCurrency();
  const service = pricing?.services.find(item => item.id === id);
  const amount = currency === 'USD' ? service?.usd : (service?.mxn || mxnOf(id));
  if (!amount || !NAMES[id]) return null;
  return { service: id, name: NAMES[id], currency, amount, rateDate: currency === 'USD' ? pricing.fx.date : null };
}
export function quoteText(quote) {
  if (!quote) return '';
  const date = quote.rateDate ? t(', tipo de cambio del {date}').replace('{date}', formatDate(quote.rateDate)) : '';
  return t('{name}, desde {price}').replace('{name}', NAMES[quote.service] || quote.name).replace('{price}', () => formatPrice(quote.amount, quote.currency)) + date;
}

function load() {
  if (status !== 'idle') return;
  status = 'loading';
  fetch('/api/chat/pricing', { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(6000) })
    .then(response => (response.ok ? response.json() : null)).catch(() => null)
    .then(data => {
      // A payload without a rate (provider never answered) keeps MXN: USD is never invented.
      pricing = data?.services && data.fx ? data : null;
      status = pricing ? 'ready' : 'failed';
      render();
    });
}

function render() {
  const currency = currentCurrency();
  document.documentElement.dataset.currency = currency;
  document.querySelectorAll('[data-market]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.market === market)));
  document.querySelectorAll('[data-price]').forEach(node => {
    const service = pricing?.services.find(item => item.id === node.dataset.price);
    const amount = currency === 'USD' ? service?.usd : Number(node.dataset.mxn);
    if (amount) node.textContent = formatPrice(amount, currency);
  });
  const note = market === 'mx' ? t('Precios en pesos mexicanos (MXN).')
    : currency === 'USD' ? t('Precios de referencia en dólares (USD), calculados con el tipo de cambio del {date}.').replace('{date}', formatDate(pricing.fx.date))
    : status === 'failed' ? t('Los precios en dólares no están disponibles en este momento; se muestran en pesos mexicanos.')
    : t('Calculando precios en dólares…');
  document.querySelectorAll('[data-pricing-note]').forEach(node => { node.textContent = note; });
  window.dispatchEvent(new CustomEvent('ideasxinfin:market', { detail: { market, currency } }));
}

function apply() { render(); if (market === 'global') load(); }
export function setMarket(next) {
  if (!['mx', 'global'].includes(next)) return;
  market = next;
  try { localStorage.setItem(KEY, next); } catch { /* The choice still applies to this visit. */ }
  apply();
}

document.querySelectorAll('[data-market]').forEach(button => button.addEventListener('click', () => setMarket(button.dataset.market)));
apply();
