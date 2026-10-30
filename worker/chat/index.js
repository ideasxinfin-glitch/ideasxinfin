import { answer, status, visitorKey } from './chat.js';
import { captureLead } from './leads.js';
import { authorize, adminConfigured, handleAdminApi, purgeExpired } from './admin.js';
import { syncSite, embedMissing } from './knowledge.js';
import { logError } from './store.js';
import { ADMIN_HTML, ADMIN_CSS, ADMIN_JS } from './admin-ui.js';

// Kill switch: without CHAT_ENABLED=true and a D1 binding every chat path is a plain 404
// and the landing keeps its local demo. Removing the bindings never breaks the page.
export const chatEnabled = env => env?.CHAT_ENABLED === 'true' && Boolean(env.CHAT_DB);
export const isChatPath = path => path === '/api/chat' || path.startsWith('/api/chat/') || path.startsWith('/api/admin/') || path === '/admin/chat' || path.startsWith('/admin/chat/');

const SECURITY = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY', 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' };
const json = (data, init = 200, extra = {}) => new Response(JSON.stringify(data), { status: init, headers: { ...SECURITY, 'Content-Type': 'application/json; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'", ...extra } });
const asset = (text, type) => new Response(text, { headers: { ...SECURITY, 'Content-Type': type, 'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" } });

async function readJson(request, limit = 8192) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) throw Object.assign(new Error('Formato no admitido.'), { status: 415, public: true });
  const text = await request.text();
  if (text.length > limit) throw Object.assign(new Error('Mensaje demasiado largo.'), { status: 413, public: true });
  try { return JSON.parse(text); } catch { throw Object.assign(new Error('Solicitud no válida.'), { status: 400, public: true }); }
}
const sameOrigin = (request, url) => { const origin = request.headers.get('origin'); return !origin || origin === url.origin; };

export async function handleChat(request, env) {
  const url = new URL(request.url); const path = url.pathname;
  if (!chatEnabled(env)) return json({ error: 'No encontrado.' }, 404);
  try {
    if (path === '/api/chat/status' && request.method === 'GET') return json(await status(env));
    if (['/api/chat', '/api/chat/lead'].includes(path)) {
      if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405, { Allow: 'POST' });
      if (!sameOrigin(request, url)) return json({ error: 'Origen no permitido.' }, 403);
      const body = await readJson(request);
      if (path === '/api/chat') {
        const result = await answer(request, env, body);
        return json(result.body, result.status || 200, result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {});
      }
      if (env.LEAD_CAPTURE_ENABLED !== 'true') return json({ error: 'La captura de datos no está activa. Escríbenos por WhatsApp.' }, 403);
      return json({ ok: true, ...(await captureLead(env, body, await visitorKey(request, env))) }, 201);
    }
    if (path === '/admin/chat' || path.startsWith('/admin/chat/')) {
      if (!adminConfigured(env)) return json({ error: 'No encontrado.' }, 404);
      if (path === '/admin/chat') return Response.redirect(`${url.origin}/admin/chat/`, 302);
      if (path === '/admin/chat/') return asset(ADMIN_HTML, 'text/html; charset=utf-8');
      if (path === '/admin/chat/admin.js') return asset(ADMIN_JS, 'text/javascript; charset=utf-8');
      if (path === '/admin/chat/admin.css') return asset(ADMIN_CSS, 'text/css; charset=utf-8');
      return json({ error: 'No encontrado.' }, 404);
    }
    if (path.startsWith('/api/admin/')) {
      if (!sameOrigin(request, url)) return json({ error: 'Origen no permitido.' }, 403);
      const auth = await authorize(request, env, await visitorKey(request, env));
      if (!auth.ok) return json({ error: auth.status === 401 ? 'Token no válido.' : 'No disponible.' }, auth.status);
      return handleAdminApi(request, env, path.slice('/api/admin/'.length));
    }
    return json({ error: 'No encontrado.' }, 404);
  } catch (error) {
    if (error.public) return json({ error: error.message }, error.status || 400);
    try { await logError(env.CHAT_DB, 'router', error.name || 'error', error.message); } catch { /* Logging must never mask the response. */ }
    return json({ error: 'No pudimos procesar el mensaje. Escríbenos por WhatsApp.' }, 500);
  }
}

// Daily cron: retention purge, landing sync and pending embeddings.
export async function runChatMaintenance(env) {
  if (!chatEnabled(env)) return null;
  const purged = await purgeExpired(env);
  const synced = await syncSite(env);
  const embedded = await embedMissing(env);
  return { purged, synced, embedded };
}
