import { WHATSAPP_PHONE, SERVICES } from './contact.js';
import { track } from './analytics.js';
import { requestedCurrency, quoteText } from './pricing.js';

// Progressive enhancement: without a working /api/chat/status the page keeps its local demo
// and no chat button appears. One conversation state feeds both the inline demo and the panel.
const CONSENT_VERSION = 'chat-leads-2026-10-30';
const BUDGETS = ['Prefiero comentarlo después', 'Menos de $10,000 MXN', '$10,000 a $30,000 MXN', '$30,000 a $80,000 MXN', 'Más de $80,000 MXN'];
// Home screen of the panel. Edit these lists to change the cards or the frequent questions:
// each one sends its `question` to /api/chat, so every answer comes from the real assistant.
const HOME_CARDS = [
  { tone: 'blue', icon: 'laptop', title: 'Crear mi página web', text: 'Un sitio web profesional y enfocado en resultados.', question: 'Quiero crear una página web para mi negocio. ¿Cómo me pueden ayudar?' },
  { tone: 'violet', icon: 'bot', title: 'Automatizar con IA', text: 'Ahorra tiempo y mejora la atención con agentes IA.', question: 'Quiero automatizar la atención y los procesos de mi negocio con IA. ¿Qué me recomiendan?' },
  { tone: 'teal', icon: 'growth', title: 'Conseguir más clientes', text: 'Estrategias digitales para atraer y vender más.', question: 'Quiero conseguir más clientes para mi negocio. ¿Qué estrategias digitales ofrecen?' },
  { tone: 'gold', icon: 'search', title: 'Mejorar mi SEO', text: 'Haz que tu negocio aparezca en Google.', question: 'Quiero mejorar el SEO de mi negocio para aparecer en Google. ¿Cómo lo trabajan?' },
  { tone: 'indigo', icon: 'building', title: 'Solución para mi negocio', text: 'Soluciones digitales para inmobiliarias, colegios, comercios y más.', question: '¿Qué soluciones digitales tienen para mi tipo de negocio, como inmobiliarias, colegios o comercios?' },
  { tone: 'sky', icon: 'tag', title: 'Precios y servicios', text: 'Conoce nuestros planes y cómo pueden ayudarte.', question: '¿Qué servicios ofrecen y cómo se definen los precios?' }
];
const HOME_FAQS = [
  { label: '¿En cuánto tiempo se realiza?', question: '¿En cuánto tiempo se realiza un proyecto con Ideas Xinfin?' },
  { label: '¿Qué incluye cada plan?', question: '¿Qué incluye cada plan o servicio de Ideas Xinfin?' },
  { label: '¿Puedo integrar WhatsApp?', question: '¿Puedo integrar WhatsApp en mi sitio web o asistente?' }
];
const state = { history: [], busy: false, config: null, quote: null };
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const SVG_NS = 'http://www.w3.org/2000/svg';
const svgNode = (tag, attributes = {}) => { const item = document.createElementNS(SVG_NS, tag); Object.entries(attributes).forEach(([key, value]) => item.setAttribute(key, value)); return item; };
let ui;

// Line icons drawn with currentColor: [tag, attributes] per shape.
const ICONS = {
  laptop: [['rect', { x: '4', y: '5', width: '16', height: '11', rx: '1.6' }], ['path', { d: 'M2 19.5h20' }]],
  bot: [['rect', { x: '4.5', y: '8', width: '15', height: '11.5', rx: '4' }], ['path', { d: 'M12 4.6V8M2.8 12.5v3.4M21.2 12.5v3.4M10 16.4q2 1.2 4 0M9 12.6q.6-.9 1.2 0M13.8 12.6q.6-.9 1.2 0' }], ['circle', { cx: '12', cy: '3.6', r: '1' }]],
  growth: [['path', { d: 'M4 20.5h17M6 20.5v-4M10.5 20.5v-6.5M15 20.5v-5M19.5 20.5v-9M4 12l5-4.5 3.5 2.5L19 4M15 4h4v4' }]],
  search: [['circle', { cx: '10.5', cy: '10.5', r: '6.5' }], ['path', { d: 'M15.4 15.4 21 21' }]],
  building: [['path', { d: 'M3 21h18M5 21V5.5L12 3v18M12 21V9h7v12M8 8h1M8 11.5h1M8 15h1M15 12.5h1M15 16h1' }]],
  tag: [['path', { d: 'M3 12.2V4h8.2L21 13.8 13.8 21 3 12.2Z' }], ['circle', { cx: '7.6', cy: '8', r: '1.5' }]],
  arrow: [['path', { d: 'M5 12h14M13 6l6 6-6 6' }]],
  back: [['path', { d: 'M19 12H5M11 6l-6 6 6 6' }]],
  faq: [['path', { d: 'M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5Z' }], ['path', { d: 'M9 10h.01M12 10h.01M15 10h.01' }]],
  message: [['path', { d: 'M20.5 12a8.5 8.5 0 0 1-12.4 7.6L3.5 21l1.4-4.4A8.5 8.5 0 1 1 20.5 12Z' }]],
  send: [['path', { d: 'M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5 21 3Z' }]],
  whatsapp: [['path', { d: 'M20.5 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20l1.2-4.6a8.5 8.5 0 1 1 16.3-3.9Z' }], ['path', { d: 'M8.2 7.3c-.8.6-1 1.7-.4 2.9 1.1 2.6 2.6 4 5.2 5.1 1.2.5 2.3.2 2.9-.6l.4-1-2.3-1.2-.9 1c-1.7-.8-2.5-1.6-3.3-3.2l.8-.9-1.2-2.3Z' }]],
  shield: [['path', { d: 'M12 3l7.5 3v5.2c0 4.6-3.1 8-7.5 9.8-4.4-1.8-7.5-5.2-7.5-9.8V6L12 3Z' }], ['path', { d: 'M8.8 12.2l2.2 2.2 4.2-4.4' }]],
  sparkle: [['path', { d: 'M12 3.5l1.9 5.6 5.6 1.9-5.6 1.9L12 18.5l-1.9-5.6L4.5 11l5.6-1.9Z' }], ['path', { d: 'M19 17.5v3M17.5 19h3' }]],
  expand: [['path', { d: 'M14.5 4H20v5.5M9.5 20H4v-5.5M20 4l-6.5 6.5M4 20l6.5-6.5' }]],
  minimize: [['path', { d: 'M6 12h12' }]],
  close: [['path', { d: 'M6.5 6.5l11 11M17.5 6.5l-11 11' }]],
  external: [['path', { d: 'M8 16 16 8M9.5 8H16v6.5' }]]
};
function icon(name, className = '') {
  const svg = svgNode('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  if (className) svg.setAttribute('class', className);
  ICONS[name].forEach(([tag, attributes]) => svg.append(svgNode(tag, attributes)));
  return svg;
}

// Friendly assistant mascot (welcome card and header). `head` crops it to the head only.
let mascotCount = 0;
function mascot(className, head = false) {
  const id = `chat-mascot-${++mascotCount}`;
  const svg = svgNode('svg', { viewBox: head ? '6 0 108 96' : '0 0 120 132', 'aria-hidden': 'true', focusable: 'false', class: `chat-mascot ${className}` });
  const linear = (name, stops, x2 = '0', y2 = '1') => { const node = svgNode('linearGradient', { id: `${id}-${name}`, x1: '0', y1: '0', x2, y2 }); stops.forEach(([offset, color]) => node.append(svgNode('stop', { offset, 'stop-color': color }))); return node; };
  const defs = svgNode('defs');
  defs.append(linear('shell', [['0', '#ffffff'], ['.6', '#e3eaf6'], ['1', '#a9b8d6']]), linear('visor', [['0', '#1c2c55'], ['1', '#050a1a']]), linear('tone', [['0', '#38d6ff'], ['1', '#8b5cf6']], '1', '1'));
  const url = name => `url(#${id}-${name})`;
  const eyes = svgNode('g', { class: 'mascot-eyes', fill: 'none', stroke: '#5fe6ff', 'stroke-width': '4.2', 'stroke-linecap': 'round' });
  eyes.append(svgNode('path', { d: 'M41 60q7-9 14 0' }), svgNode('path', { d: 'M65 60q7-9 14 0' }));
  svg.append(defs,
    svgNode('path', { d: 'M60 10v14', stroke: '#c9d4ea', 'stroke-width': '3.2', 'stroke-linecap': 'round' }),
    svgNode('circle', { class: 'mascot-bulb', cx: '60', cy: '8', r: '5.5', fill: url('tone') }),
    svgNode('rect', { x: '9', y: '44', width: '15', height: '32', rx: '7.5', fill: url('tone') }),
    svgNode('rect', { x: '96', y: '44', width: '15', height: '32', rx: '7.5', fill: url('tone') }),
    svgNode('rect', { x: '17', y: '22', width: '86', height: '68', rx: '31', fill: url('shell') }),
    svgNode('rect', { class: 'mascot-visor', x: '27', y: '35', width: '66', height: '43', rx: '21', fill: url('visor'), stroke: url('tone'), 'stroke-opacity': '.55', 'stroke-width': '1.5' }),
    eyes);
  if (!head) {
    svg.append(svgNode('path', { d: 'M28 132c0-23 13-36 32-36s32 13 32 36Z', fill: url('shell') }),
      svgNode('path', { d: 'M60 116c-3.5-4.5-10-4.5-10 0s6.5 4.5 10 0 10-4.5 10 0-6.5 4.5-10 0Z', fill: 'none', stroke: url('tone'), 'stroke-width': '3', 'stroke-linejoin': 'round' }));
  }
  return svg;
}

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

// The panel shows either the home screen (cards and frequent questions) or the conversation.
function showConversation() {
  if (!ui.convo.hidden) return;
  ui.home.hidden = true; ui.convo.hidden = false; ui.panel.classList.add('is-chatting');
}
function showHome() {
  ui.convo.hidden = true; ui.home.hidden = false; ui.panel.classList.remove('is-chatting');
  ui.resume.hidden = !state.history.length;
  ui.home.scrollTop = 0; ui.cards[0]?.focus({ preventScroll: true });
}

// Shared entry point for the floating panel and the inline demo.
export async function ask(text) {
  const message = String(text || '').trim();
  if (!message || state.busy || !ui) return null;
  state.busy = true; ui.form.setAttribute('aria-busy', 'true'); ui.send.disabled = true;
  showConversation(); setSuggestions([]); addMessage('user', message);
  const typing = el('div', 'chat-msg chat-msg--assistant chat-typing');
  typing.append(el('span', 'sr-only', 'El asistente está escribiendo…'), el('i'), el('i'), el('i'));
  ui.log.append(typing); ui.log.scrollTop = ui.log.scrollHeight;
  let data;
  try {
    const result = await post('/api/chat', { message, history: state.history.slice(-6), currency: requestedCurrency() });
    data = result.data.reply ? result.data : { reply: result.data.error || 'No pude responder en este momento. Puedes escribirnos por WhatsApp.', actions: ['whatsapp'] };
  } catch {
    data = { reply: 'No pude conectarme en este momento. Puedes escribirnos por WhatsApp y el equipo te atenderá.', actions: ['whatsapp'] };
  }
  typing.remove();
  addMessage('assistant', data.reply);
  // The last published price the assistant quoted travels to WhatsApp and the lead form as a reference.
  if (data.quote) state.quote = data.quote;
  if (data.source !== 'limit') state.history.push({ role: 'user', content: message }, { role: 'assistant', content: data.reply });
  state.history = state.history.slice(-12);
  setSuggestions(data.suggestions || []);
  state.busy = false; ui.form.removeAttribute('aria-busy'); ui.send.disabled = false;
  track('assistant_message');
  return data;
}

function whatsappComposer() {
  const topics = state.history.filter(item => item.role === 'user').slice(-3).map(item => `• ${item.content.slice(0, 160)}`);
  const quote = state.quote ? `\nPrecio de referencia que vi: ${quoteText(state.quote)} (orientativo).` : '';
  const text = topics.length ? `Hola, Ideas Xinfin. Conversé con su asistente de IA y me interesa:\n${topics.join('\n')}${quote}` : `Hola, Ideas Xinfin. Me gustaría hablar sobre un proyecto.${quote}`;
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
      const result = await post('/api/chat/lead', { ...data, consent: consent.checked, consentVersion: CONSENT_VERSION, quote: state.quote });
      if (!result.ok) throw new Error(result.data.error || 'No pudimos guardar tus datos.');
      closeExtra(); showConversation(); addMessage('assistant', '¡Gracias! Recibimos tus datos y el equipo de Ideas Xinfin te contactará. Si prefieres, también puedes escribirnos por WhatsApp.');
      track('lead_submit');
    } catch (error) { status.textContent = error.message; submit.disabled = false; }
  });
  showExtra(form); form.querySelector('input').focus();
}
function showExtra(node) { ui.extra.replaceChildren(node); ui.extra.hidden = false; ui.form.hidden = true; ui.panel.classList.add('has-extra'); }
function closeExtra() { ui.extra.replaceChildren(); ui.extra.hidden = true; ui.form.hidden = false; ui.panel.classList.remove('has-extra'); if (!ui.panel.hidden) ui.input.focus(); }

// On phones the panel follows the visible viewport, so the on-screen keyboard never covers the input.
function fitViewport() {
  const view = window.visualViewport;
  if (!view || !ui || ui.panel.hidden) return;
  ui.panel.style.setProperty('--chat-vh', `${Math.round(view.height)}px`);
  ui.panel.style.setProperty('--chat-kb', `${Math.max(0, Math.round(innerHeight - view.height - view.offsetTop))}px`);
}
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
function openPanel() {
  ui.panel.hidden = false; ui.launcher.setAttribute('aria-expanded', 'true'); document.body.classList.add('chat-open'); fitViewport();
  // Touch devices get focus on the panel instead of the input, so the keyboard does not hide the cards.
  requestAnimationFrame(() => (finePointer.matches ? ui.input : ui.panel).focus({ preventScroll: true })); track('assistant_open');
}
function minimize() { ui.voice?.stop(); ui.panel.hidden = true; ui.launcher.setAttribute('aria-expanded', 'false'); document.body.classList.remove('chat-open'); ui.launcher.focus(); }
function reset() {
  state.history = []; state.quote = null; ui.log.replaceChildren(); setSuggestions([]); closeExtra(); showHome(); minimize();
}

// Voice dictation with the browser's own speech service (Chrome, Edge, Safari; desktop and mobile).
// The text lands in the box for review and is never sent on its own. Unsupported browsers get no button.
const PLACEHOLDER = 'Escribe tu pregunta…';
function dictation(input) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition || !window.isSecureContext) return null;
  const button = el('button', 'chat-mic'); button.type = 'button';
  button.setAttribute('aria-label', 'Dictar mensaje por voz'); button.setAttribute('aria-pressed', 'false'); button.title = 'Dictar por voz';
  const svg = icon('message'); svg.replaceChildren(svgNode('path', { d: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21' }));
  button.append(svg);
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

function iconButton(name, label, className = 'chat-icon') {
  const button = el('button', className); button.type = 'button'; button.setAttribute('aria-label', label); button.title = label;
  button.append(icon(name)); return button;
}

function buildHome() {
  const home = el('div', 'chat-home');
  const resume = el('button', 'chat-nav-link'); resume.type = 'button'; resume.hidden = true;
  resume.append('Volver a la conversación', icon('arrow'));
  resume.addEventListener('click', () => { showConversation(); ui.input.focus(); });
  const welcome = el('div', 'chat-welcome');
  const copy = el('div', 'chat-welcome-copy');
  copy.append(el('h2', '', '¡Hola! 👋 Soy tu asistente digital.'), el('p', '', 'Cuéntame qué quieres mejorar de tu negocio. Te ayudaré a encontrar la mejor solución de Ideas Xinfin.'));
  welcome.append(mascot('chat-welcome-bot'), copy);
  const cardsTitle = el('h3', 'chat-section-title', '¿Qué te gustaría hacer?'); cardsTitle.id = 'chat-cards-title';
  const grid = el('div', 'chat-cards'); grid.setAttribute('role', 'group'); grid.setAttribute('aria-labelledby', cardsTitle.id);
  const cards = HOME_CARDS.map((card, index) => {
    const button = el('button', 'chat-card'); button.type = 'button'; button.dataset.tone = card.tone; button.style.setProperty('--i', index);
    const badge = el('span', 'chat-card-icon'); badge.append(icon(card.icon));
    const go = el('span', 'chat-card-go'); go.append(icon('arrow'));
    button.append(badge, el('strong', '', card.title), el('small', '', card.text), go);
    button.addEventListener('click', () => ask(card.question));
    return button;
  });
  grid.append(...cards);
  const faq = el('div', 'chat-faq');
  const faqTitle = el('p', 'chat-faq-title'); faqTitle.id = 'chat-faq-title'; faqTitle.append(icon('faq'), 'Preguntas frecuentes:');
  const faqList = el('div', 'chat-faq-list'); faqList.setAttribute('role', 'group'); faqList.setAttribute('aria-labelledby', faqTitle.id);
  faqList.append(...HOME_FAQS.map(item => { const button = el('button', 'chat-chip', item.label); button.type = 'button'; button.addEventListener('click', () => ask(item.question)); return button; }));
  faq.append(faqTitle, faqList);
  home.append(resume, welcome, cardsTitle, grid, faq);
  return { home, resume, cards };
}

function build(config) {
  const bubble = () => {
    const svg = svgNode('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'chat-icon-bubble' });
    svg.append(svgNode('path', { d: 'M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5Z' }), svgNode('path', { d: 'M12 6.5v5M9.5 9h5' }));
    return svg;
  };
  // Mobile-only icon: a friendly robot face with a spark, so the round button reads as "AI" without its label.
  const robot = () => {
    const svg = svgNode('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', fill: 'none', stroke: 'url(#chat-robot-tone)', 'stroke-width': '1.9', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'chat-icon-robot' });
    const tone = svgNode('linearGradient', { id: 'chat-robot-tone', x1: '3', y1: '3', x2: '21', y2: '21', gradientUnits: 'userSpaceOnUse' });
    tone.append(svgNode('stop', { offset: '0', 'stop-color': '#22b8d8' }), svgNode('stop', { offset: '1', 'stop-color': '#7c5cf0' }));
    const defs = svgNode('defs'); defs.append(tone);
    const eyes = svgNode('g', { class: 'robot-eyes', fill: 'url(#chat-robot-tone)', stroke: 'none' });
    eyes.append(svgNode('circle', { cx: '9.4', cy: '12.4', r: '1.45' }), svgNode('circle', { cx: '14.6', cy: '12.4', r: '1.45' }));
    svg.append(defs, svgNode('path', { d: 'M12 4.6v2.2M3.4 11.4v3M20.6 11.4v3M10 15.9q2 1.2 4 0' }), svgNode('rect', { x: '5.2', y: '6.8', width: '13.6', height: '11.8', rx: '3.6' }), svgNode('circle', { cx: '12', cy: '3.6', r: '1', fill: 'url(#chat-robot-tone)', stroke: 'none' }), eyes,
      svgNode('path', { class: 'robot-spark', d: 'M20.2 1.6l.55 1.25 1.25.55-1.25.55-.55 1.25-.55-1.25-1.25-.55 1.25-.55z', fill: '#7c5cf0', stroke: 'none' }));
    return svg;
  };
  const launcher = el('button', 'chat-launcher'); launcher.type = 'button';
  launcher.setAttribute('aria-expanded', 'false'); launcher.setAttribute('aria-controls', 'chat-panel'); launcher.setAttribute('aria-label', 'Abrir asistente de inteligencia artificial');
  const badge = el('b', 'chat-badge', 'IA'); badge.setAttribute('aria-hidden', 'true');
  launcher.append(bubble(), robot(), el('span', '', 'Asistente IA'), badge);

  const panel = el('section', 'chat-panel'); panel.id = 'chat-panel'; panel.hidden = true; panel.tabIndex = -1; panel.setAttribute('aria-labelledby', 'chat-title');
  const head = el('header', 'chat-head');
  const logo = el('img', 'chat-logo'); logo.src = '/assets/logo-wordmark-dark.webp'; logo.width = 720; logo.height = 192; logo.alt = 'Ideas Xinfin'; logo.decoding = 'async';
  const titles = el('div', 'chat-titles'); const title = el('strong', '', 'Asistente Ideas Xinfin'); title.id = 'chat-title';
  const sub = el('small'); const dot = el('span', 'chat-dot'); dot.setAttribute('aria-hidden', 'true');
  sub.append(dot, 'Asistente de inteligencia artificial', el('span', 'sr-only', ' · en línea'));
  titles.append(title, sub);
  const wave = svgNode('svg', { class: 'chat-wave', viewBox: '0 0 240 60', preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false' });
  const waveTone = svgNode('linearGradient', { id: 'chat-wave-tone', x1: '0', y1: '0', x2: '1', y2: '0' });
  waveTone.append(svgNode('stop', { offset: '0', 'stop-color': '#38d6ff', 'stop-opacity': '0' }), svgNode('stop', { offset: '.45', 'stop-color': '#38bdf8' }), svgNode('stop', { offset: '1', 'stop-color': '#a855f7' }));
  const waveDefs = svgNode('defs'); waveDefs.append(waveTone);
  wave.append(waveDefs, svgNode('path', { d: 'M0 48C40 48 60 30 100 30s60 22 100 14 32-22 40-24', fill: 'none', stroke: 'url(#chat-wave-tone)', 'stroke-width': '2' }));
  const expandButton = iconButton('expand', 'Ampliar asistente', 'chat-icon chat-expand'); expandButton.setAttribute('aria-pressed', 'false');
  const minimizeButton = iconButton('minimize', 'Minimizar asistente');
  const closeButton = iconButton('close', 'Cerrar y borrar la conversación');
  const tools = el('div', 'chat-tools'); tools.append(expandButton, minimizeButton, closeButton);
  head.append(wave, logo, el('span', 'chat-sep'), mascot('chat-avatar', true), titles, tools);

  const body = el('div', 'chat-body');
  const { home, resume, cards } = buildHome();
  const convo = el('div', 'chat-convo'); convo.hidden = true;
  const back = el('button', 'chat-nav-link chat-back'); back.type = 'button'; back.append(icon('back'), 'Explorar servicios');
  back.addEventListener('click', showHome);
  const log = el('div', 'chat-log'); log.setAttribute('role', 'log'); log.setAttribute('aria-live', 'polite'); log.tabIndex = 0; log.setAttribute('aria-label', 'Conversación');
  const suggestions = el('div', 'chat-suggestions');
  convo.append(back, log, suggestions);
  body.append(home, convo);

  const extra = el('div', 'chat-extra'); extra.hidden = true;
  const form = el('form', 'chat-form'); const label = el('label', 'sr-only', 'Escribe tu mensaje');
  const input = el('textarea'); input.id = 'chat-input'; input.rows = 1; input.maxLength = 600; input.placeholder = PLACEHOLDER; input.enterKeyHint = 'send'; label.htmlFor = input.id;
  const send = el('button', 'chat-send'); send.type = 'submit'; send.setAttribute('aria-label', 'Enviar mensaje'); send.append(icon('send'));
  const voice = dictation(input);
  form.append(icon('message', 'chat-form-icon'), label, input, ...(voice ? [voice.button] : []), send);

  const foot = el('footer', 'chat-foot');
  const human = el('button', 'chat-wa'); human.type = 'button'; human.append(icon('whatsapp'), el('span', '', 'Hablar con un asesor por WhatsApp'), icon('external'));
  human.addEventListener('click', whatsappComposer);
  const links = el('div', 'chat-foot-links');
  const privacy = el('a', '', 'Privacidad'); privacy.href = '/privacidad.html'; privacy.prepend(icon('shield'));
  const brand = el('span', '', 'IA de Ideas Xinfin'); brand.prepend(icon('sparkle'));
  links.append(privacy, brand);
  const lead = config.leads ? el('button', 'chat-link', 'Quiero que me contacten') : null;
  if (lead) { lead.type = 'button'; lead.addEventListener('click', leadForm); }
  const note = el('p', 'chat-note', 'Respuestas generadas por IA; pueden contener errores. No compartas datos sensibles.');
  foot.append(human, links, note, ...(lead ? [lead] : []));

  panel.append(head, body, extra, form, foot);
  document.body.append(launcher, panel);
  ui = { launcher, panel, home, resume, cards, convo, log, suggestions, extra, form, input, send, voice };

  launcher.addEventListener('click', () => (panel.hidden ? openPanel() : minimize()));
  expandButton.addEventListener('click', () => {
    const wide = panel.classList.toggle('is-wide');
    expandButton.setAttribute('aria-pressed', String(wide)); expandButton.setAttribute('aria-label', wide ? 'Reducir asistente' : 'Ampliar asistente'); expandButton.title = expandButton.getAttribute('aria-label');
  });
  minimizeButton.addEventListener('click', minimize);
  closeButton.addEventListener('click', reset);
  panel.addEventListener('keydown', event => { if (event.key === 'Escape') { event.stopPropagation(); minimize(); } });
  form.addEventListener('submit', event => { event.preventDefault(); voice?.stop(); const text = input.value; input.value = ''; ask(text); });
  input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
  window.visualViewport?.addEventListener('resize', fitViewport);
  window.visualViewport?.addEventListener('scroll', fitViewport);
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
