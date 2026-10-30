import { WHATSAPP_PHONE, SERVICES } from './contact.js';
import { track } from './analytics.js';

// Progressive enhancement: without a working /api/chat/status the page keeps its local demo
// and no chat button appears. One conversation state feeds both the inline demo and the panel.
const CONSENT_VERSION = 'chat-leads-2026-10-30';
const BUDGETS = ['Prefiero comentarlo después', 'Menos de $10,000 MXN', '$10,000 a $30,000 MXN', '$30,000 a $80,000 MXN', 'Más de $80,000 MXN'];
const state = { history: [], busy: false, config: null, opened: false };
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
let ui;

async function post(path, body) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

function addMessage(role, text) {
  const item = el('div', `chat-msg chat-msg--${role}`);
  const label = el('span', 'sr-only', role === 'user' ? 'Tú: ' : 'Asistente: ');
  item.append(label, el('p', '', text));
  ui.log.append(item); ui.log.scrollTop = ui.log.scrollHeight;
  return item;
}
function setSuggestions(questions = []) {
  ui.suggestions.replaceChildren(...questions.slice(0, 4).map(question => {
    const button = el('button', 'chat-chip', typeof question === 'string' ? question : question.label);
    button.type = 'button';
    button.addEventListener('click', () => ask(typeof question === 'string' ? question : question.question));
    return button;
  }));
}

function ensureWelcome() { if (!state.opened) { state.opened = true; addMessage('assistant', state.config.welcome); } }

// Shared entry point for the floating panel and the inline demo.
export async function ask(text) {
  const message = String(text || '').trim();
  if (!message || state.busy || !ui) return null;
  state.busy = true; ui.form.setAttribute('aria-busy', 'true'); ui.send.disabled = true;
  ensureWelcome(); setSuggestions([]); addMessage('user', message);
  const typing = el('div', 'chat-msg chat-msg--assistant chat-typing');
  typing.append(el('span', 'sr-only', 'El asistente está escribiendo…'), el('i'), el('i'), el('i'));
  ui.log.append(typing); ui.log.scrollTop = ui.log.scrollHeight;
  let data;
  try {
    const result = await post('/api/chat', { message, history: state.history.slice(-6) });
    data = result.data.reply ? result.data : { reply: result.data.error || 'No pude responder en este momento. Puedes escribirnos por WhatsApp.', actions: ['whatsapp'] };
  } catch {
    data = { reply: 'No pude conectarme en este momento. Puedes escribirnos por WhatsApp y el equipo te atenderá.', actions: ['whatsapp'] };
  }
  typing.remove();
  addMessage('assistant', data.reply);
  if (data.source !== 'limit') state.history.push({ role: 'user', content: message }, { role: 'assistant', content: data.reply });
  state.history = state.history.slice(-12);
  setSuggestions(data.suggestions || []);
  state.busy = false; ui.form.removeAttribute('aria-busy'); ui.send.disabled = false;
  track('assistant_message');
  return data;
}

function whatsappComposer() {
  const topics = state.history.filter(item => item.role === 'user').slice(-3).map(item => `• ${item.content.slice(0, 160)}`);
  const text = topics.length ? `Hola, Ideas Xinfin. Conversé con su asistente de IA y me interesa:\n${topics.join('\n')}` : 'Hola, Ideas Xinfin. Me gustaría hablar sobre un proyecto.';
  const box = el('div', 'chat-extra-box');
  const label = el('label', '', 'Mensaje para WhatsApp. Revísalo o edítalo antes de abrirlo:');
  const area = el('textarea'); area.id = 'chat-wa-text'; area.rows = 4; area.maxLength = 900; area.value = text; label.htmlFor = area.id;
  const open = el('a', 'button primary small', 'Abrir WhatsApp ↗'); open.target = '_blank'; open.rel = 'noopener noreferrer';
  const sync = () => { open.href = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(area.value.trim())}`; };
  area.addEventListener('input', sync); sync();
  open.addEventListener('click', () => { track('whatsapp_click'); closeExtra(); });
  const cancel = el('button', 'chat-link', 'Cancelar'); cancel.type = 'button'; cancel.addEventListener('click', closeExtra);
  const row = el('div', 'chat-extra-actions'); row.append(open, cancel);
  box.append(label, area, el('small', '', 'Nada se envía hasta que lo confirmes en WhatsApp.'), row);
  showExtra(box); area.focus();
}

function leadForm() {
  const form = el('form', 'chat-extra-box chat-lead');
  const field = (labelText, control) => { const wrap = el('div', 'chat-field'); const label = el('label', '', labelText); control.id = `chat-lead-${control.name}`; label.htmlFor = control.id; wrap.append(label, control); return wrap; };
  const input = (name, type = 'text', required = true, max = 120) => { const node = el('input'); node.name = name; node.type = type; node.required = required; node.maxLength = max; return node; };
  const select = (name, options, placeholder) => { const node = el('select'); node.name = name; node.required = Boolean(placeholder); if (placeholder) { const first = el('option', '', placeholder); first.value = ''; node.append(first); } options.forEach(option => node.append(el('option', '', option))); return node; };
  const need = el('textarea'); need.name = 'need'; need.required = true; need.maxLength = 600; need.rows = 3;
  need.value = state.history.filter(item => item.role === 'user').slice(-1)[0]?.content || '';
  const consent = el('input'); consent.type = 'checkbox'; consent.name = 'consent'; consent.required = true; consent.id = 'chat-lead-consent';
  const consentLabel = el('label', 'chat-consent'); consentLabel.htmlFor = consent.id;
  const privacy = el('a', '', 'aviso de privacidad'); privacy.href = '/privacidad.html'; privacy.target = '_blank'; privacy.rel = 'noopener';
  consentLabel.append(consent, ' Acepto que Ideas Xinfin guarde estos datos solo para responder a mi solicitud, por un tiempo limitado, conforme al ', privacy, '.');
  const trap = input('website', 'text', false, 80); trap.tabIndex = -1; trap.autocomplete = 'off'; const trapWrap = el('div', 'chat-trap'); trapWrap.setAttribute('aria-hidden', 'true'); trapWrap.append(trap);
  const status = el('p', 'chat-status'); status.setAttribute('role', 'status');
  const submit = el('button', 'button primary small', 'Enviar datos'); submit.type = 'submit';
  const cancel = el('button', 'chat-link', 'Cancelar'); cancel.type = 'button'; cancel.addEventListener('click', closeExtra);
  const row = el('div', 'chat-extra-actions'); row.append(submit, cancel);
  form.append(el('strong', '', 'Déjanos tus datos y te contactamos'), field('Nombre *', input('name', 'text', true, 80)), field('Negocio', input('business', 'text', false)),
    field('Servicio *', select('service', SERVICES, 'Selecciona un servicio')), field('¿Qué necesitas resolver? *', need),
    field('WhatsApp o correo *', input('contact', 'text', true, 120)), field('Presupuesto aproximado (opcional)', select('budget', BUDGETS)), consentLabel, trapWrap, row, status);
  form.addEventListener('submit', async event => {
    event.preventDefault(); submit.disabled = true; status.textContent = 'Enviando…';
    const data = Object.fromEntries(new FormData(form));
    try {
      const result = await post('/api/chat/lead', { ...data, consent: consent.checked, consentVersion: CONSENT_VERSION });
      if (!result.ok) throw new Error(result.data.error || 'No pudimos guardar tus datos.');
      closeExtra(); addMessage('assistant', '¡Gracias! Recibimos tus datos y el equipo de Ideas Xinfin te contactará. Si prefieres, también puedes escribirnos por WhatsApp.');
      track('lead_submit');
    } catch (error) { status.textContent = error.message; submit.disabled = false; }
  });
  showExtra(form); form.querySelector('input').focus();
}
function showExtra(node) { ui.extra.replaceChildren(node); ui.extra.hidden = false; ui.form.hidden = true; }
function closeExtra() { ui.extra.replaceChildren(); ui.extra.hidden = true; ui.form.hidden = false; ui.input.focus(); }

function openPanel() {
  ui.panel.hidden = false; ui.launcher.setAttribute('aria-expanded', 'true'); document.body.classList.add('chat-open');
  if (!state.opened) { ensureWelcome(); if (!state.history.length) setSuggestions(state.config.starters); }
  requestAnimationFrame(() => ui.input.focus()); track('assistant_open');
}
function minimize() { ui.voice?.stop(); ui.panel.hidden = true; ui.launcher.setAttribute('aria-expanded', 'false'); document.body.classList.remove('chat-open'); ui.launcher.focus(); }
function reset() {
  state.history = []; state.opened = false; ui.log.replaceChildren(); setSuggestions([]); closeExtra(); minimize();
}

// Voice dictation with the browser's own speech service (Chrome, Edge, Safari; desktop and mobile).
// The text lands in the box for review and is never sent on its own. Unsupported browsers get no button.
const PLACEHOLDER = 'Escribe tu pregunta…';
function dictation(input) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition || !window.isSecureContext) return null;
  const button = el('button', 'chat-mic'); button.type = 'button';
  button.setAttribute('aria-label', 'Dictar mensaje por voz'); button.setAttribute('aria-pressed', 'false'); button.title = 'Dictar por voz';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.7'); svg.setAttribute('stroke-linecap', 'round');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21');
  svg.append(path); button.append(svg);
  let recognition = null; let failed = false;
  const stop = () => { if (recognition) recognition.stop(); };
  button.addEventListener('click', () => {
    if (recognition) return stop();
    const before = input.value.trim(); failed = false;
    recognition = new Recognition();
    recognition.lang = 'es-MX'; recognition.interimResults = true; recognition.continuous = false; recognition.maxAlternatives = 1;
    recognition.onresult = event => {
      const spoken = [...event.results].map(result => result[0].transcript).join('').trim();
      input.value = `${before}${before && spoken ? ' ' : ''}${spoken}`.slice(0, input.maxLength);
    };
    recognition.onerror = event => {
      failed = true;
      input.placeholder = ['not-allowed', 'service-not-allowed'].includes(event.error) ? 'Permite el micrófono para dictar' : event.error === 'no-speech' ? 'No te escuché, intenta de nuevo' : 'No se pudo dictar; escribe tu pregunta';
    };
    recognition.onend = () => {
      recognition = null; button.classList.remove('is-listening'); button.setAttribute('aria-pressed', 'false');
      if (!failed) input.placeholder = PLACEHOLDER;
    };
    try { recognition.start(); } catch { recognition = null; return; }
    button.classList.add('is-listening'); button.setAttribute('aria-pressed', 'true'); input.placeholder = 'Escuchando… habla ahora';
  });
  input.addEventListener('input', () => { if (!recognition) input.placeholder = PLACEHOLDER; });
  return { button, stop };
}

function build(config) {
  const icon = () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.6'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', 'M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5Z');
    const spark = document.createElementNS('http://www.w3.org/2000/svg', 'path'); spark.setAttribute('d', 'M12 6.5v5M9.5 9h5');
    svg.append(path, spark); return svg;
  };
  const launcher = el('button', 'chat-launcher'); launcher.type = 'button';
  launcher.setAttribute('aria-expanded', 'false'); launcher.setAttribute('aria-controls', 'chat-panel'); launcher.setAttribute('aria-label', 'Abrir asistente de inteligencia artificial');
  launcher.append(icon(), el('span', '', 'Asistente IA'));
  const panel = el('section', 'chat-panel'); panel.id = 'chat-panel'; panel.hidden = true; panel.setAttribute('aria-labelledby', 'chat-title');
  const head = el('header', 'chat-head'); const titles = el('div'); const title = el('strong', '', 'Ideas Xinfin · Asistente IA'); title.id = 'chat-title';
  const sub = el('small'); sub.append(el('span', 'chat-dot'), 'Asistente de inteligencia artificial');
  titles.append(title, sub);
  const minimizeButton = el('button', 'chat-icon', '–'); minimizeButton.type = 'button'; minimizeButton.setAttribute('aria-label', 'Minimizar asistente'); minimizeButton.title = 'Minimizar';
  const closeButton = el('button', 'chat-icon', '×'); closeButton.type = 'button'; closeButton.setAttribute('aria-label', 'Cerrar y borrar la conversación'); closeButton.title = 'Cerrar';
  head.append(titles, minimizeButton, closeButton);
  const log = el('div', 'chat-log'); log.setAttribute('role', 'log'); log.setAttribute('aria-live', 'polite'); log.tabIndex = 0; log.setAttribute('aria-label', 'Conversación');
  const suggestions = el('div', 'chat-suggestions');
  const extra = el('div', 'chat-extra'); extra.hidden = true;
  const form = el('form', 'chat-form'); const label = el('label', 'sr-only', 'Escribe tu mensaje');
  const input = el('textarea'); input.id = 'chat-input'; input.rows = 1; input.maxLength = 600; input.placeholder = PLACEHOLDER; label.htmlFor = input.id;
  const send = el('button', 'chat-send', '➤'); send.type = 'submit'; send.setAttribute('aria-label', 'Enviar mensaje');
  const voice = dictation(input);
  form.append(label, input, ...(voice ? [voice.button] : []), send);
  const actions = el('div', 'chat-actions');
  const human = el('button', 'chat-link', 'Hablar con una persona por WhatsApp ↗'); human.type = 'button'; human.addEventListener('click', whatsappComposer);
  actions.append(human);
  if (config.leads) { const lead = el('button', 'chat-link', 'Quiero que me contacten'); lead.type = 'button'; lead.addEventListener('click', leadForm); actions.append(lead); }
  const note = el('p', 'chat-note', 'Respuestas generadas por IA; pueden contener errores. No compartas datos sensibles. ');
  const privacy = el('a', '', 'Privacidad'); privacy.href = '/privacidad.html'; note.append(privacy);
  panel.append(head, log, suggestions, extra, form, actions, note);
  document.body.append(launcher, panel);
  ui = { launcher, panel, log, suggestions, extra, form, input, send, voice };

  launcher.addEventListener('click', () => (panel.hidden ? openPanel() : minimize()));
  minimizeButton.addEventListener('click', minimize);
  closeButton.addEventListener('click', reset);
  panel.addEventListener('keydown', event => { if (event.key === 'Escape') { event.stopPropagation(); minimize(); } });
  form.addEventListener('submit', event => { event.preventDefault(); voice?.stop(); const text = input.value; input.value = ''; ask(text); });
  input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
}

// The inline demo in "Automatización con sentido" now talks to the same service.
function connectInlineDemo() {
  const preview = document.querySelector('.assistant-preview');
  if (!preview) return;
  const status = preview.querySelector('.assistant-top small');
  if (status?.lastChild) status.lastChild.textContent = ' Asistente IA en línea';
  const disclaimer = preview.querySelector('.demo-disclaimer');
  if (disclaimer) disclaimer.textContent = 'Asistente de IA conectado. Puede equivocarse; la conversación continúa en el chat.';
  const message = preview.querySelector('.assistant-message');
  const questions = { propuesta: 'Quiero una propuesta para mi negocio', landing: 'Me interesa una landing page', automatizar: 'Necesito automatizar procesos de mi negocio', seo: 'Quiero mejorar mi SEO' };
  preview.querySelectorAll('[data-assistant]').forEach(button => button.addEventListener('click', async () => {
    if (state.busy) return;
    preview.querySelectorAll('[data-assistant]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    message.textContent = 'Escribiendo…'; message.setAttribute('aria-busy', 'true');
    const data = await ask(questions[button.dataset.assistant]);
    message.removeAttribute('aria-busy');
    if (data) message.textContent = data.reply;
  }));
  preview.querySelector('.assistant-compose')?.addEventListener('click', event => { event.preventDefault(); openPanel(); });
}

async function init() {
  let config;
  try {
    const response = await fetch('/api/chat/status', { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(6000) });
    if (!response.ok) return;
    config = await response.json();
  } catch { return; }
  if (!config?.enabled) return;
  state.config = config;
  document.documentElement.dataset.chat = 'live';
  build(config); connectInlineDemo();
}
init();
