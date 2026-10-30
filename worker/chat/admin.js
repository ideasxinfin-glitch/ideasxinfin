import { getSettings, setSetting, bumpKnowledgeVersion, rateLimit, now, DEFAULT_SETTINGS } from './store.js';
import { ensureSeed, saveKnowledge, setKnowledgeStatus, syncSite, importDocument, embedMissing, resetIndexCache } from './knowledge.js';
import { PROVIDERS } from './providers.js';
import { LEAD_STATUSES } from './leads.js';
import { sha256 } from './text.js';

export const adminConfigured = env => typeof env.ADMIN_TOKEN === 'string' && env.ADMIN_TOKEN.length >= 32;

async function sameSecret(given, expected) {
  // Hash both sides so the comparison time does not depend on the matching prefix.
  const [a, b] = await Promise.all([sha256(given), sha256(expected)]);
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function authorize(request, env, visitor) {
  if (!adminConfigured(env)) return { ok: false, status: 404 };
  const attempts = await rateLimit(env.CHAT_DB, `admin:${visitor}`, 30, 3600);
  if (!attempts.allowed) return { ok: false, status: 429 };
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  return token && await sameSecret(token, env.ADMIN_TOKEN) ? { ok: true } : { ok: false, status: 401 };
}

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const body = async request => { try { return await request.json(); } catch { throw new Error('JSON no válido.'); } };

export async function handleAdminApi(request, env, path) {
  const db = env.CHAT_DB; const method = request.method;
  await ensureSeed(env);
  try {
    if (path === 'overview' && method === 'GET') {
      const since = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10);
      const [usage, events, errors, counts] = await Promise.all([
        db.prepare('SELECT * FROM usage_daily WHERE day >= ? ORDER BY day DESC, provider').bind(since).all(),
        db.prepare('SELECT * FROM events_daily WHERE day >= ? ORDER BY day DESC, kind').bind(since).all(),
        db.prepare('SELECT at, provider, code, message FROM error_log ORDER BY id DESC LIMIT 40').all(),
        db.prepare(`SELECT (SELECT COUNT(*) FROM knowledge WHERE status = 'approved') AS approved, (SELECT COUNT(*) FROM knowledge WHERE status = 'draft') AS drafts,
          (SELECT COUNT(*) FROM candidates WHERE status = 'pending') AS candidates, (SELECT COUNT(*) FROM leads) AS leads,
          (SELECT COUNT(*) FROM knowledge_chunks WHERE embedding IS NULL) AS unembedded`).first()
      ]);
      const settings = await getSettings(db, { fresh: true });
      return json({ settings, providers: PROVIDERS, groqConfigured: Boolean(env.GROQ_API_KEY), leadsEnabled: env.LEAD_CAPTURE_ENABLED === 'true', environment: env.CHAT_ENV || 'production', usage: usage.results, events: events.results, errors: errors.results, counts });
    }
    if (path === 'settings' && method === 'PUT') {
      const input = await body(request);
      if (input.providers) {
        if (!Array.isArray(input.providers) || input.providers.some(item => !PROVIDERS[item.id]) || new Set(input.providers.map(item => item.id)).size !== input.providers.length) throw new Error('Lista de proveedores no válida.');
        await setSetting(db, 'providers', input.providers.map(item => ({ id: item.id, enabled: Boolean(item.enabled) })));
      }
      const limits = { neuronBudget: [0, 9500], groqDailyRequests: [0, 900], generationsPerDay: [0, 5000], visitorPerWindow: [1, 60], visitorWindowSeconds: [60, 3600], visitorPerDay: [1, 300], semanticThreshold: [0.7, 0.99], cacheTtlDays: [1, 180], kvWritesPerDay: [0, 900] };
      for (const [key, [min, max]] of Object.entries(limits)) if (key in input) {
        const value = Number(input[key]);
        if (!Number.isFinite(value) || value < min || value > max) throw new Error(`${key} debe estar entre ${min} y ${max}.`);
        await setSetting(db, key, value);
      }
      if (input.clearCooldowns) await setSetting(db, 'cooldowns', {});
      return json({ settings: await getSettings(db, { fresh: true }) });
    }
    if (path === 'knowledge' && method === 'GET') {
      const status = new URL(request.url).searchParams.get('status');
      const query = status ? db.prepare('SELECT id, kind, title, question, content, keywords, visibility, status, priority, version, source, valid_from, valid_until, updated_at FROM knowledge WHERE status = ? ORDER BY priority DESC, updated_at DESC LIMIT 300').bind(status)
        : db.prepare('SELECT id, kind, title, question, content, keywords, visibility, status, priority, version, source, valid_from, valid_until, updated_at FROM knowledge ORDER BY status, priority DESC, updated_at DESC LIMIT 300');
      return json({ items: (await query.all()).results });
    }
    if (path === 'knowledge' && method === 'POST') { const id = await saveKnowledge(env, await body(request)); await embedMissing(env); return json({ id }, 201); }
    let match = path.match(/^knowledge\/(\d+)$/);
    if (match && method === 'PUT') { await saveKnowledge(env, await body(request), { id: Number(match[1]) }); await embedMissing(env); return json({ ok: true }); }
    match = path.match(/^knowledge\/(\d+)\/status$/);
    if (match && method === 'POST') { await setKnowledgeStatus(env, Number(match[1]), (await body(request)).status); await embedMissing(env); return json({ ok: true }); }
    if (path === 'documents' && method === 'POST') {
      const form = await request.formData();
      return json({ id: await importDocument(env, form.get('file')) }, 201);
    }
    if (path === 'sync' && method === 'POST') return json(await syncSite(env, new URL(request.url).origin));
    if (path === 'reindex' && method === 'POST') return json(await embedMissing(env, 200));
    if (path === 'cache/invalidate' && method === 'POST') { await bumpKnowledgeVersion(db); resetIndexCache(); return json({ ok: true }); }
    if (path === 'candidates' && method === 'GET') return json({ items: (await db.prepare("SELECT * FROM candidates WHERE status = 'pending' ORDER BY hits DESC, updated_at DESC LIMIT 200").all()).results });
    match = path.match(/^candidates\/(\d+)\/(approve|reject)$/);
    if (match && method === 'POST') {
      const id = Number(match[1]);
      if (match[2] === 'reject') { await db.prepare("UPDATE candidates SET status = 'rejected', updated_at = ? WHERE id = ?").bind(now(), id).run(); return json({ ok: true }); }
      const input = await body(request);
      const knowledgeId = await saveKnowledge(env, { kind: 'faq', title: input.question, question: input.question, content: input.answer, keywords: input.keywords || '', status: 'approved', priority: 10, source: 'candidate' });
      await db.prepare("UPDATE candidates SET status = 'approved', updated_at = ? WHERE id = ?").bind(now(), id).run();
      await embedMissing(env);
      return json({ knowledgeId });
    }
    if (path === 'leads' && method === 'GET') return json({ items: (await db.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 300').all()).results, statuses: LEAD_STATUSES });
    match = path.match(/^leads\/([\w-]{36})$/);
    if (match && method === 'PUT') {
      const { status } = await body(request);
      if (!LEAD_STATUSES.includes(status)) throw new Error('Estado no válido.');
      await db.prepare('UPDATE leads SET status = ?, updated_at = ? WHERE id = ?').bind(status, now(), match[1]).run();
      return json({ ok: true });
    }
    if (match && method === 'DELETE') { await db.prepare('DELETE FROM leads WHERE id = ?').bind(match[1]).run(); return json({ ok: true }); }
    if (path === 'leads/purge-expired' && method === 'POST') return json(await purgeExpired(env));
    if (path === 'defaults' && method === 'GET') return json(DEFAULT_SETTINGS);
    return json({ error: 'No encontrado.' }, 404);
  } catch (error) {
    return json({ error: error.message }, 400);
  }
}

// Retention: expired leads, candidates and counters are deleted, not archived.
export async function purgeExpired(env) {
  const db = env.CHAT_DB; const stamp = now();
  const leads = await db.prepare('DELETE FROM leads WHERE expires_at < ?').bind(stamp).run();
  const candidates = await db.prepare("DELETE FROM candidates WHERE expires_at < ? AND status != 'approved'").bind(stamp).run();
  await db.prepare('DELETE FROM rate_limits WHERE reset_at < ?').bind(Date.now()).run();
  await db.prepare('DELETE FROM error_log WHERE at < ?').bind(new Date(Date.now() - 30 * 86400000).toISOString()).run();
  await db.prepare('DELETE FROM events_daily WHERE day < ?').bind(new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10)).run();
  return { leads: leads.meta.changes, candidates: candidates.meta.changes };
}
