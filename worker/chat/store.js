// D1 helpers shared by the public chat, the admin API and maintenance.
export const now = () => new Date().toISOString();
export const today = () => now().slice(0, 10);
export const addDays = (days, from = new Date()) => new Date(from.getTime() + days * 86400000).toISOString();
export const nextUtcMidnight = () => { const date = new Date(); date.setUTCHours(24, 0, 0, 0); return date.getTime(); };

// Every value can be changed from the admin panel; these are the safe defaults.
export const DEFAULT_SETTINGS = Object.freeze({
  providers: [
    { id: 'gemma', enabled: true },
    { id: 'glm', enabled: true },
    { id: 'groq', enabled: true }
  ],
  // Workers AI gives 10,000 neurons per UTC day to the WHOLE account, shared by every model
  // and every project. Keep headroom so other projects and estimates never trigger overage.
  neuronBudget: 6000,
  groqDailyRequests: 300,
  generationsPerDay: 400,
  visitorPerWindow: 10,
  visitorWindowSeconds: 600,
  visitorPerDay: 40,
  semanticThreshold: 0.84,
  cacheTtlDays: 30,
  kvWritesPerDay: 300,
  knowledgeVersion: 1,
  cooldowns: {}
});

const settingsCache = { value: null, at: 0 };
export async function getSettings(db, { fresh = false } = {}) {
  if (!fresh && settingsCache.value && Date.now() - settingsCache.at < 30000) return settingsCache.value;
  const { results } = await db.prepare('SELECT key, value FROM settings').all();
  const stored = Object.fromEntries(results.map(row => { try { return [row.key, JSON.parse(row.value)]; } catch { return [row.key, undefined]; } }));
  const value = { ...DEFAULT_SETTINGS, ...Object.fromEntries(Object.entries(stored).filter(([key, item]) => key in DEFAULT_SETTINGS && item !== undefined)) };
  settingsCache.value = value; settingsCache.at = Date.now();
  return value;
}
export async function setSetting(db, key, value) {
  if (!(key in DEFAULT_SETTINGS)) throw new Error(`Unknown setting ${key}`);
  await db.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at')
    .bind(key, JSON.stringify(value), now()).run();
  settingsCache.value = null;
}
export const resetSettingsCache = () => { settingsCache.value = null; };

// A new version makes every exact-cache key and approved shortcut obsolete at once.
export async function bumpKnowledgeVersion(db) {
  const settings = await getSettings(db, { fresh: true });
  await setSetting(db, 'knowledgeVersion', (Number(settings.knowledgeVersion) || 1) + 1);
}

export async function countEvent(db, kind, amount = 1) {
  await db.prepare('INSERT INTO events_daily (day, kind, count) VALUES (?, ?, ?) ON CONFLICT(day, kind) DO UPDATE SET count = count + excluded.count')
    .bind(today(), kind, amount).run();
}
export async function eventCount(db, kind) {
  const row = await db.prepare('SELECT count FROM events_daily WHERE day = ? AND kind = ?').bind(today(), kind).first();
  return row?.count || 0;
}

// Atomic reservation: the UPDATE only succeeds while the reservation fits the budget.
export async function reserveUsage(db, provider, amount, limit, field = 'neurons') {
  const day = today();
  await db.prepare('INSERT OR IGNORE INTO usage_daily (day, provider) VALUES (?, ?)').bind(day, provider).run();
  const result = await db.prepare(`UPDATE usage_daily SET ${field} = ${field} + ? WHERE day = ? AND provider = ? AND ${field} + ? <= ?`)
    .bind(amount, day, provider, amount, limit).run();
  return result.meta.changes === 1;
}
export async function recordUsage(db, provider, { requests = 0, errors = 0, neurons = 0, tokensIn = 0, tokensOut = 0 }) {
  await db.prepare(`INSERT INTO usage_daily (day, provider, requests, errors, neurons, tokens_in, tokens_out) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(day, provider) DO UPDATE SET requests = requests + excluded.requests, errors = errors + excluded.errors, neurons = neurons + excluded.neurons, tokens_in = tokens_in + excluded.tokens_in, tokens_out = tokens_out + excluded.tokens_out`)
    .bind(today(), provider, requests, errors, neurons, tokensIn, tokensOut).run();
}

export async function rateLimit(db, key, limit, windowSeconds) {
  const stamp = Date.now();
  await db.prepare(`INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET count = CASE WHEN reset_at < ? THEN 1 ELSE count + 1 END, reset_at = CASE WHEN reset_at < ? THEN excluded.reset_at ELSE reset_at END`)
    .bind(key, stamp + windowSeconds * 1000, stamp, stamp).run();
  const row = await db.prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?').bind(key).first();
  return { allowed: row.count <= limit, retryAfter: Math.max(1, Math.ceil((row.reset_at - stamp) / 1000)) };
}

// Errors are logged without prompts, visitor text or credentials.
export async function logError(db, provider, code, message) {
  const safe = String(message || '').replace(/Bearer\s+\S+/gi, 'Bearer [omitido]').replace(/gsk_[\w-]+/g, '[omitido]').slice(0, 240);
  await db.prepare('INSERT INTO error_log (at, provider, code, message) VALUES (?, ?, ?, ?)').bind(now(), provider, String(code).slice(0, 40), safe).run();
}

export async function setCooldown(db, provider, until) {
  const settings = await getSettings(db, { fresh: true });
  await setSetting(db, 'cooldowns', { ...settings.cooldowns, [provider]: until });
}
export const coolingDown = (settings, provider) => (settings.cooldowns?.[provider] || 0) > Date.now();
