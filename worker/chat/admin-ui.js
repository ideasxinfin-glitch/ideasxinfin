// Minimal admin panel, served only by the Worker (never part of public/ or the sitemap).
// The token lives in sessionStorage for the tab; every API call is authorized server-side.
export const ADMIN_HTML = '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Asistente · Administración</title><link rel="stylesheet" href="/admin/chat/admin.css"></head><body><header><strong>Ideas Xinfin · Asistente IA</strong><span id="env"></span><button id="logout" type="button" hidden>Salir</button></header><main id="app"><form id="login"><label for="token">Token administrativo</label><input id="token" type="password" autocomplete="off" required minlength="32"><button type="submit">Entrar</button><p id="login-status" role="status"></p></form></main><script type="module" src="/admin/chat/admin.js"></script></body></html>';

export const ADMIN_CSS = `:root{color-scheme:light dark;--bg:#f6f6f3;--surface:#fff;--ink:#252a2d;--muted:#576164;--line:#252a2d26;--accent:#52676c}
@media(prefers-color-scheme:dark){:root{--bg:#191c1e;--surface:#222729;--ink:#f7f6f2;--muted:#bdc3c0;--line:#ffffff24;--accent:#c7b99c}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 'Segoe UI',Arial,sans-serif}
header{display:flex;gap:16px;align-items:center;padding:14px 22px;border-bottom:1px solid var(--line)}header span{color:var(--muted);font-size:12px}header button{margin-left:auto}
main{padding:22px;max-width:1200px;margin:auto}nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
button,input,select,textarea{font:inherit;color:inherit;background:var(--surface);border:1px solid var(--line);border-radius:7px;padding:7px 11px}
button{cursor:pointer}button[aria-pressed=true],button.primary{background:var(--accent);color:var(--bg);border-color:var(--accent)}
textarea{width:100%;min-height:110px}input,select{max-width:100%}label{display:block;font-size:12px;color:var(--muted);margin:10px 0 4px}
table{width:100%;border-collapse:collapse;background:var(--surface);font-size:13px}th,td{border-bottom:1px solid var(--line);padding:7px;text-align:left;vertical-align:top}th{color:var(--muted);font-weight:600}
.card{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:16px;margin-bottom:16px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}
.stat strong{display:block;font-size:22px}.muted{color:var(--muted)}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}#login{max-width:420px}
pre{white-space:pre-wrap;word-break:break-word;margin:0;font:12px/1.5 Consolas,monospace}td.clip{max-width:420px}`;

export const ADMIN_JS = String.raw`const app = document.querySelector('#app');
let token = sessionStorage.getItem('ixf-admin') || '';
const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key === 'text') node.textContent = value;
    else if (value !== false && value != null) node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) if (child != null) node.append(child.nodeType ? child : document.createTextNode(String(child)));
  return node;
};
async function api(path, options = {}) {
  const headers = { Authorization: 'Bearer ' + token, ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}) };
  const response = await fetch('/api/admin/' + path, { ...options, headers, body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) { sessionStorage.removeItem('ixf-admin'); token = ''; location.reload(); }
  if (!response.ok) throw new Error(data.error || 'Error ' + response.status);
  return data;
}
const notice = el('p', { role: 'status', class: 'muted' });
const tell = text => { notice.textContent = text; };
const guard = fn => async (...args) => { try { await fn(...args); } catch (error) { tell(error.message); } };
const tabs = { resumen: overview, conocimiento: knowledge, candidatas: candidates, prospectos: leads, modelos: models };
let current = 'resumen';
function shell() {
  const nav = el('nav', {}, Object.keys(tabs).map(name => el('button', { type: 'button', 'aria-pressed': String(name === current), onclick: () => { current = name; shell(); } }, name[0].toUpperCase() + name.slice(1))));
  const view = el('section');
  app.replaceChildren(nav, notice, view);
  guard(tabs[current])(view);
}
async function overview(view) {
  const data = await api('overview');
  document.querySelector('#env').textContent = 'Entorno: ' + data.environment + ' · versión de conocimiento ' + data.settings.knowledgeVersion;
  const today = new Date().toISOString().slice(0, 10);
  const used = data.usage.find(row => row.day === today && row.provider === 'workers-ai');
  const events = kind => data.events.filter(row => row.day === today && row.kind === kind).reduce((sum, row) => sum + row.count, 0);
  const stat = (label, value) => el('div', { class: 'card stat' }, el('strong', { text: String(value) }), el('span', { class: 'muted', text: label }));
  view.append(el('div', { class: 'grid' },
    stat('Neuronas hoy (estimadas) / presupuesto', Math.round(used?.neurons || 0) + ' / ' + data.settings.neuronBudget),
    stat('Respuestas generadas hoy', events('generated')), stat('Desde FAQ / caché hoy', events('faq') + events('cache_exact') + events('cache_semantic')),
    stat('Fuera de tema hoy', events('offtopic')), stat('Sin proveedor disponible hoy', events('exhausted')), stat('Límite por visitante hoy', events('rate_limited')),
    stat('Conocimiento aprobado / borradores', data.counts.approved + ' / ' + data.counts.drafts), stat('Candidatas pendientes', data.counts.candidates), stat('Prospectos', data.counts.leads + (data.leadsEnabled ? '' : ' (captura inactiva)'))));
  view.append(el('div', { class: 'card' }, el('h3', { text: 'Uso por proveedor (14 días)' }), table(['Día', 'Proveedor', 'Solicitudes', 'Errores', 'Neuronas', 'Tokens entrada', 'Tokens salida'], data.usage.map(row => [row.day, row.provider, row.requests, row.errors, Math.round(row.neurons * 100) / 100, row.tokens_in, row.tokens_out]))));
  view.append(el('div', { class: 'card' }, el('h3', { text: 'Eventos (14 días)' }), table(['Día', 'Evento', 'Total'], data.events.map(row => [row.day, row.kind, row.count]))));
  view.append(el('div', { class: 'card' }, el('h3', { text: 'Errores recientes' }), table(['Fecha', 'Proveedor', 'Código', 'Mensaje'], data.errors.map(row => [row.at, row.provider, row.code, row.message]))));
  view.append(el('div', { class: 'row' },
    el('button', { type: 'button', onclick: guard(async () => tell('Sincronizado: ' + JSON.stringify(await api('sync', { method: 'POST' })))) }, 'Sincronizar contenido de la landing'),
    el('button', { type: 'button', onclick: guard(async () => tell('Embeddings: ' + JSON.stringify(await api('reindex', { method: 'POST' })))) }, 'Generar embeddings pendientes (' + data.counts.unembedded + ')'),
    el('button', { type: 'button', onclick: guard(async () => { await api('cache/invalidate', { method: 'POST' }); tell('Caché invalidada.'); }) }, 'Invalidar caché')));
}
function table(headers, rows) {
  return el('table', {}, el('thead', {}, el('tr', {}, headers.map(text => el('th', { text })))), el('tbody', {}, rows.map(cells => el('tr', {}, cells.map(cell => cell && cell.nodeType ? el('td', {}, cell) : el('td', { class: 'clip', text: cell == null ? '' : String(cell) }))))));
}
const KINDS = ['service', 'price', 'promo', 'faq', 'education', 'policy', 'page', 'document'];
function knowledgeForm(item, done) {
  const field = (label, input) => el('div', {}, el('label', { text: label }), input);
  const select = (name, options, value) => el('select', { name }, options.map(option => el('option', { value: option, selected: option === value }, option)));
  const form = el('form', { class: 'card' },
    el('h3', { text: item.id ? 'Editar #' + item.id : 'Nuevo conocimiento' }),
    el('div', { class: 'grid' }, field('Tipo', select('kind', KINDS, item.kind || 'faq')), field('Visibilidad', select('visibility', ['public', 'internal', 'confidential'], item.visibility || 'public')), field('Estado', select('status', ['draft', 'approved', 'archived'], item.status || 'draft')), field('Prioridad (-100 a 100)', el('input', { name: 'priority', type: 'number', min: -100, max: 100, value: item.priority ?? 0 })), field('Vigente desde', el('input', { name: 'valid_from', type: 'date', value: (item.valid_from || '').slice(0, 10) })), field('Vigente hasta', el('input', { name: 'valid_until', type: 'date', value: (item.valid_until || '').slice(0, 10) }))),
    field('Título', el('input', { name: 'title', required: true, value: item.title || '' })),
    field('Pregunta (FAQ)', el('input', { name: 'question', value: item.question || '' })),
    field('Contenido / respuesta aprobada', el('textarea', { name: 'content', required: true }, item.content || '')),
    field('Formas alternativas de preguntar, separadas por |', el('input', { name: 'keywords', value: item.keywords || '' })),
    el('p', { class: 'muted', text: 'public: puede citarse. internal: el asistente puede usarla sin mostrarla como interna. confidential: nunca se envía al modelo.' }),
    el('div', { class: 'row' }, el('button', { class: 'primary', type: 'submit' }, 'Guardar'), el('button', { type: 'button', onclick: done }, 'Cancelar')));
  form.addEventListener('submit', guard(async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    data.priority = Number(data.priority);
    for (const key of ['valid_from', 'valid_until']) data[key] = data[key] ? data[key] + (key === 'valid_until' ? 'T23:59:59Z' : 'T00:00:00Z') : null;
    await api(item.id ? 'knowledge/' + item.id : 'knowledge', { method: item.id ? 'PUT' : 'POST', body: data });
    tell('Guardado. La caché asociada se invalidó.'); done();
  }));
  return form;
}
async function knowledge(view) {
  const { items } = await api('knowledge');
  const holder = el('div');
  const upload = el('form', { class: 'card row' }, el('label', { text: 'Importar PDF, DOCX, TXT o MD como borrador interno (máx. 4 MB)' }), el('input', { type: 'file', name: 'file', accept: '.pdf,.docx,.txt,.md,.csv', required: true }), el('button', { type: 'submit' }, 'Importar'));
  upload.addEventListener('submit', guard(async event => { event.preventDefault(); const result = await api('documents', { method: 'POST', body: new FormData(upload) }); tell('Documento importado como borrador #' + result.id + '. Revísalo y apruébalo.'); shell(); }));
  view.append(el('div', { class: 'row' }, el('button', { class: 'primary', type: 'button', onclick: () => holder.replaceChildren(knowledgeForm({}, shell)) }, 'Agregar conocimiento')), upload, holder,
    table(['#', 'Tipo', 'Título', 'Visibilidad', 'Estado', 'Prioridad', 'Vigencia', 'Actualizado', ''], items.map(item => [item.id, item.kind, item.title, item.visibility, item.status, item.priority, (item.valid_from || '').slice(0, 10) + ' → ' + (item.valid_until || '').slice(0, 10), item.updated_at.slice(0, 16),
      el('div', { class: 'row' }, el('button', { type: 'button', onclick: () => { holder.replaceChildren(knowledgeForm(item, shell)); holder.scrollIntoView(); } }, 'Editar'),
        el('button', { type: 'button', onclick: guard(async () => { await api('knowledge/' + item.id + '/status', { method: 'POST', body: { status: item.status === 'approved' ? 'archived' : 'approved' } }); shell(); }) }, item.status === 'approved' ? 'Desactivar' : 'Aprobar'))])));
}
async function candidates(view) {
  const { items } = await api('candidates');
  view.append(el('p', { class: 'muted', text: 'Preguntas reales sin datos personales. "answer": respuesta generada que puede volverse FAQ aprobada. "gap": el asistente no tenía información suficiente; agrega conocimiento.' }));
  for (const item of items) {
    const question = el('input', { value: item.question });
    const answer = el('textarea', {}, item.answer || '');
    view.append(el('div', { class: 'card' }, el('p', { class: 'muted', text: item.kind + ' · ' + item.hits + ' veces · ' + (item.provider || 'sin modelo') + ' · ' + item.updated_at.slice(0, 16) }),
      el('label', { text: 'Pregunta' }), question, el('label', { text: 'Respuesta aprobada' }), answer,
      el('div', { class: 'row' }, el('button', { class: 'primary', type: 'button', onclick: guard(async () => { await api('candidates/' + item.id + '/approve', { method: 'POST', body: { question: question.value, answer: answer.value } }); tell('Aprobada como FAQ.'); shell(); }) }, 'Aprobar como FAQ'),
        el('button', { type: 'button', onclick: guard(async () => { await api('candidates/' + item.id + '/reject', { method: 'POST' }); shell(); }) }, 'Descartar'))));
  }
  if (!items.length) view.append(el('p', { text: 'No hay candidatas pendientes.' }));
}
async function leads(view) {
  const { items, statuses } = await api('leads');
  view.append(el('div', { class: 'row' }, el('button', { type: 'button', onclick: guard(async () => tell('Eliminados por vencimiento: ' + JSON.stringify(await api('leads/purge-expired', { method: 'POST' })))) }, 'Eliminar vencidos ahora')));
  view.append(table(['Fecha', 'Nombre', 'Negocio', 'Servicio', 'Necesidad', 'Contacto', 'Presupuesto', 'Interés', 'Estado', 'Vence', ''], items.map(item => {
    const status = el('select', { onchange: guard(async event => { await api('leads/' + item.id, { method: 'PUT', body: { status: event.target.value } }); tell('Estado actualizado.'); }) }, statuses.map(value => el('option', { value, selected: value === item.status }, value)));
    return [item.created_at.slice(0, 16), item.name, item.business, item.service, item.need_summary, item.contact, item.budget, item.interest, status, item.expires_at.slice(0, 10),
      el('button', { type: 'button', onclick: guard(async () => { if (!confirm('¿Eliminar definitivamente este prospecto?')) return; await api('leads/' + item.id, { method: 'DELETE' }); shell(); }) }, 'Eliminar')];
  })));
}
async function models(view) {
  const data = await api('overview');
  const order = data.settings.providers.map(item => ({ ...item }));
  const list = el('div');
  const draw = () => list.replaceChildren(...order.map((item, index) => el('div', { class: 'card row' },
    el('strong', { text: (index + 1) + '. ' + data.providers[item.id].label }), el('span', { class: 'muted', text: data.providers[item.id].model }),
    item.id === 'groq' && !data.groqConfigured ? el('span', { class: 'muted', text: '(sin GROQ_API_KEY: se omite)' }) : null,
    el('label', {}, el('input', { type: 'checkbox', checked: item.enabled, onchange: event => { item.enabled = event.target.checked; } }), ' Activo'),
    el('button', { type: 'button', disabled: index === 0, onclick: () => { order.splice(index - 1, 0, order.splice(index, 1)[0]); draw(); } }, '↑'),
    el('button', { type: 'button', disabled: index === order.length - 1, onclick: () => { order.splice(index + 1, 0, order.splice(index, 1)[0]); draw(); } }, '↓'))));
  draw();
  const numbers = ['neuronBudget', 'groqDailyRequests', 'generationsPerDay', 'visitorPerWindow', 'visitorWindowSeconds', 'visitorPerDay', 'semanticThreshold', 'cacheTtlDays', 'kvWritesPerDay'];
  const inputs = Object.fromEntries(numbers.map(key => [key, el('input', { type: 'number', step: key === 'semanticThreshold' ? '0.01' : '1', value: data.settings[key] })]));
  view.append(el('p', { class: 'muted', text: 'Workers AI: 10,000 neuronas diarias para toda la cuenta, compartidas por todos los modelos y proyectos. Cambiar de modelo no reinicia esa cuota. Pausas activas: ' + JSON.stringify(data.settings.cooldowns) }), list,
    el('div', { class: 'card grid' }, numbers.map(key => el('div', {}, el('label', { text: key }), inputs[key]))),
    el('div', { class: 'row' }, el('button', { class: 'primary', type: 'button', onclick: guard(async () => {
      const body = { providers: order }; for (const key of numbers) body[key] = Number(inputs[key].value);
      await api('settings', { method: 'PUT', body }); tell('Configuración guardada.');
    }) }, 'Guardar'), el('button', { type: 'button', onclick: guard(async () => { await api('settings', { method: 'PUT', body: { clearCooldowns: true } }); tell('Pausas eliminadas.'); }) }, 'Quitar pausas de proveedores')));
}
const login = document.querySelector('#login');
login?.addEventListener('submit', async event => {
  event.preventDefault(); token = document.querySelector('#token').value.trim();
  try { await api('overview'); sessionStorage.setItem('ixf-admin', token); start(); } catch (error) { document.querySelector('#login-status').textContent = error.message; }
});
function start() { const out = document.querySelector('#logout'); out.hidden = false; out.onclick = () => { sessionStorage.removeItem('ixf-admin'); location.reload(); }; shell(); }
if (token) start();
`;
