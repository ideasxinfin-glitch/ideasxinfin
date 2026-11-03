import { SEED_KNOWLEDGE } from './seed.js';
import { normalize, tokens, sha256, clean } from './text.js';
import { now, getSettings, bumpKnowledgeVersion, reserveUsage, recordUsage, logError } from './store.js';

export const EMBEDDING_MODEL = '@cf/baai/bge-m3';
const EMBEDDING_NEURONS_PER_M = 1075;
export const KINDS = ['service', 'price', 'promo', 'faq', 'education', 'policy', 'page', 'document'];
export const VISIBILITY = ['public', 'internal', 'confidential'];

let seeded = false;
export async function ensureSeed(env) {
  if (seeded) return;
  const row = await env.CHAT_DB.prepare('SELECT COUNT(*) AS total FROM knowledge').first();
  if (!row.total) {
    for (const entry of SEED_KNOWLEDGE) await saveKnowledge(env, { ...entry, status: 'approved', source: 'seed' }, { skipBump: true });
    await embedMissing(env);
  }
  seeded = true;
}
export const resetSeedFlag = () => { seeded = false; };

function chunkText(title, content, size = 700) {
  const parts = []; let current = '';
  for (const paragraph of content.split(/\n{2,}|(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/)) {
    if ((current + ' ' + paragraph).length > size && current) { parts.push(current.trim()); current = ''; }
    current += ' ' + paragraph;
  }
  if (current.trim()) parts.push(current.trim());
  return parts.map(part => `${title}: ${part}`);
}

export function validateKnowledge(input) {
  const entry = {
    kind: input.kind, title: clean(input.title).slice(0, 160), question: input.question ? clean(input.question).slice(0, 240) : null,
    content: clean(input.content).slice(0, 20000), keywords: clean(input.keywords || '').slice(0, 600),
    visibility: input.visibility || 'public', status: input.status || 'draft', priority: Number.parseInt(input.priority ?? 0, 10),
    source: clean(input.source || 'admin').slice(0, 40), source_ref: input.source_ref ? clean(input.source_ref).slice(0, 200) : null,
    valid_from: input.valid_from || null, valid_until: input.valid_until || null
  };
  if (!KINDS.includes(entry.kind)) throw new Error('Tipo de conocimiento no válido.');
  if (!VISIBILITY.includes(entry.visibility)) throw new Error('Visibilidad no válida.');
  if (!['draft', 'approved', 'archived'].includes(entry.status)) throw new Error('Estado no válido.');
  if (entry.title.length < 3 || entry.content.length < 10) throw new Error('Título y contenido son obligatorios.');
  if (entry.kind === 'faq' && !entry.question) entry.question = entry.title;
  if (!Number.isFinite(entry.priority) || entry.priority < -100 || entry.priority > 100) throw new Error('Prioridad entre -100 y 100.');
  for (const field of ['valid_from', 'valid_until']) if (entry[field] && Number.isNaN(Date.parse(entry[field]))) throw new Error('Fecha de vigencia no válida.');
  return entry;
}

// Insert or update; a changed approved entry invalidates every cached answer.
export async function saveKnowledge(env, input, { id = null, skipBump = false } = {}) {
  const db = env.CHAT_DB; const entry = validateKnowledge(input); const stamp = now();
  const hash = await sha256([entry.title, entry.question, entry.content, entry.visibility, entry.valid_from, entry.valid_until].join('|'));
  let knowledgeId = id; let changed = true; let wasApproved = false;
  if (id) {
    const existing = await db.prepare('SELECT content_hash, status FROM knowledge WHERE id = ?').bind(id).first();
    if (!existing) throw new Error('No existe ese conocimiento.');
    changed = existing.content_hash !== hash; wasApproved = existing.status === 'approved';
    await db.prepare(`UPDATE knowledge SET kind = ?, title = ?, question = ?, content = ?, keywords = ?, visibility = ?, status = ?, priority = ?, source = ?, source_ref = ?, valid_from = ?, valid_until = ?, content_hash = ?, version = version + ?, updated_at = ? WHERE id = ?`)
      .bind(entry.kind, entry.title, entry.question, entry.content, entry.keywords, entry.visibility, entry.status, entry.priority, entry.source, entry.source_ref, entry.valid_from, entry.valid_until, hash, changed ? 1 : 0, stamp, id).run();
  } else {
    const result = await db.prepare(`INSERT INTO knowledge (kind, title, question, content, keywords, visibility, status, priority, source, source_ref, valid_from, valid_until, content_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(entry.kind, entry.title, entry.question, entry.content, entry.keywords, entry.visibility, entry.status, entry.priority, entry.source, entry.source_ref, entry.valid_from, entry.valid_until, hash, stamp, stamp).run();
    knowledgeId = result.meta.last_row_id;
  }
  if (changed || !id) {
    await db.prepare('DELETE FROM knowledge_chunks WHERE knowledge_id = ?').bind(knowledgeId).run();
    const texts = [];
    if (entry.kind === 'faq') texts.push(entry.question);
    texts.push(...chunkText(entry.title, entry.kind === 'faq' ? `Pregunta: ${entry.question}\nRespuesta: ${entry.content}` : entry.content));
    for (const [position, text] of texts.entries()) await db.prepare('INSERT INTO knowledge_chunks (knowledge_id, position, text) VALUES (?, ?, ?)').bind(knowledgeId, position, text).run();
  }
  if (!skipBump && (changed || entry.status === 'approved' || wasApproved)) await bumpKnowledgeVersion(db);
  return knowledgeId;
}

export async function setKnowledgeStatus(env, id, status) {
  if (!['draft', 'approved', 'archived'].includes(status)) throw new Error('Estado no válido.');
  await env.CHAT_DB.prepare('UPDATE knowledge SET status = ?, updated_at = ? WHERE id = ?').bind(status, now(), id).run();
  await bumpKnowledgeVersion(env.CHAT_DB);
}

// Embeddings are optional: without budget or binding, retrieval falls back to keywords.
export async function embed(env, texts) {
  if (!env.AI || !texts.length) return null;
  const settings = await getSettings(env.CHAT_DB);
  const estimate = Math.max(0.01, texts.join(' ').length / 3 * EMBEDDING_NEURONS_PER_M / 1e6);
  if (!(await reserveUsage(env.CHAT_DB, 'workers-ai', estimate, settings.neuronBudget))) return null;
  try {
    const result = await env.AI.run(EMBEDDING_MODEL, { text: texts });
    await recordUsage(env.CHAT_DB, 'embeddings', { requests: 1, neurons: estimate });
    return result?.data || null;
  } catch (error) {
    await recordUsage(env.CHAT_DB, 'embeddings', { requests: 1, errors: 1 });
    await logError(env.CHAT_DB, 'embeddings', 'run', error.message);
    return null;
  }
}
const pack = vector => JSON.stringify(vector.map(value => Math.round(value * 10000) / 10000));

export async function embedMissing(env, limit = 60) {
  const { results } = await env.CHAT_DB.prepare(`SELECT c.id, c.text FROM knowledge_chunks c JOIN knowledge k ON k.id = c.knowledge_id WHERE c.embedding IS NULL AND k.status = 'approved' AND k.visibility != 'confidential' LIMIT ?`).bind(limit).all();
  let done = 0;
  for (let index = 0; index < results.length; index += 20) {
    const batch = results.slice(index, index + 20);
    const vectors = await embed(env, batch.map(row => row.text));
    if (!vectors) break;
    for (const [position, row] of batch.entries()) {
      await env.CHAT_DB.prepare('UPDATE knowledge_chunks SET embedding = ?, model = ? WHERE id = ?').bind(pack(vectors[position]), EMBEDDING_MODEL, row.id).run();
      done++;
    }
  }
  if (done) indexCache.version = null;
  return { embedded: done, pending: results.length - done };
}

export function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

// Isolate-level cache keyed by knowledge version: a version bump reloads it.
const indexCache = { version: null, rows: [] };
async function loadIndex(env, version) {
  if (indexCache.version === version) return indexCache.rows;
  const stamp = now();
  const { results } = await env.CHAT_DB.prepare(`SELECT c.id, c.position, c.text, c.embedding, k.id AS knowledge_id, k.kind, k.title, k.question, k.content, k.keywords, k.priority, k.visibility, k.updated_at
    FROM knowledge_chunks c JOIN knowledge k ON k.id = c.knowledge_id
    WHERE k.status = 'approved' AND k.visibility != 'confidential' AND (k.valid_from IS NULL OR k.valid_from <= ?) AND (k.valid_until IS NULL OR k.valid_until >= ?)`).bind(stamp, stamp).all();
  indexCache.rows = results.map(row => ({ ...row, vector: row.embedding ? JSON.parse(row.embedding) : null, terms: new Set(tokens(`${row.title} ${row.text} ${row.keywords.replaceAll('|', ' ')}`)) }));
  indexCache.version = version;
  return indexCache.rows;
}
export const resetIndexCache = () => { indexCache.version = null; };

export async function hasActivePromos(env, version) {
  return (await loadIndex(env, version)).some(row => row.kind === 'promo');
}

export async function hasCurrentPrices(env, version) {
  return (await loadIndex(env, version)).some(row => row.kind === 'price' || row.kind === 'promo');
}

// Level 1 + level 3: approved FAQ by exact phrasing, then by meaning.
export async function matchFaq(env, settings, question, vector) {
  const rows = (await loadIndex(env, settings.knowledgeVersion)).filter(row => row.kind === 'faq' && row.position === 0);
  const text = normalize(question);
  for (const row of rows) {
    const phrasings = [row.question, ...row.keywords.split('|')].map(normalize).filter(Boolean);
    if (phrasings.includes(text)) return { row, score: 1, method: 'faq' };
  }
  if (!vector) return null;
  let best = null;
  for (const row of rows) { const score = cosine(vector, row.vector); if (!best || score > best.score) best = { row, score, method: 'semantic' }; }
  return best && best.score >= settings.semanticThreshold ? best : null;
}

// RAG: only the few most relevant approved chunks reach the model.
export async function retrieve(env, settings, question, vector, { priceIntent = false, limit = 4 } = {}) {
  const rows = (await loadIndex(env, settings.knowledgeVersion)).filter(row => !(row.kind === 'faq' && row.position === 0));
  const query = tokens(question);
  const scored = rows.map(row => {
    const keyword = query.length ? query.filter(term => row.terms.has(term)).length / query.length : 0;
    const semantic = vector && row.vector ? cosine(vector, row.vector) : 0;
    const boost = row.priority / 500 + (priceIntent && (row.kind === 'price' || row.kind === 'promo') ? 0.15 : 0);
    return { row, relevance: Math.max(semantic, keyword * 0.85), score: Math.max(semantic, keyword * 0.85) + boost };
  }).sort((a, b) => b.score - a.score);
  const seen = new Set(); const picked = [];
  // Current approved prices and promotions always reach the model for price questions.
  if (priceIntent) for (const item of scored.filter(entry => entry.row.kind === 'price' || entry.row.kind === 'promo').slice(0, 2)) { seen.add(item.row.knowledge_id); picked.push(item); }
  for (const item of scored) {
    if (seen.has(item.row.knowledge_id)) continue;
    seen.add(item.row.knowledge_id); picked.push(item);
    if (picked.length === limit) break;
  }
  return { chunks: picked, best: picked[0]?.relevance || 0 };
}

export async function topFaqs(env, settings, limit = 4) {
  const rows = (await loadIndex(env, settings.knowledgeVersion)).filter(row => row.kind === 'faq' && row.position === 0);
  return rows.sort((a, b) => b.priority - a.priority).slice(0, limit).map(row => row.question);
}
export async function faqByQuestion(env, settings, question) {
  const rows = (await loadIndex(env, settings.knowledgeVersion)).filter(row => row.kind === 'faq' && row.position === 0);
  return rows.find(row => normalize(row.question) === normalize(question)) || null;
}

// Public landing sync: reads the deployed page itself, so new sections need no code change.
export function extractSections(html) {
  const sections = [];
  for (const match of html.matchAll(/<section\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)) {
    const [, id, body] = match;
    if (id === 'contacto') continue;
    const heading = clean((body.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/) || [])[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') || id);
    const text = clean(body.replace(/<(script|style|svg|form|button)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' '));
    if (text.length > 60) sections.push({ id, title: `Página: ${heading}`.slice(0, 160), content: text.slice(0, 6000) });
  }
  return sections;
}
export async function syncSite(env, origin = 'https://ideasxinfin.com') {
  if (!env.ASSETS) return { updated: 0, archived: 0, skipped: 'sin ASSETS' };
  const response = await env.ASSETS.fetch(new Request(`${origin}/index.html`));
  if (!response.ok) return { updated: 0, archived: 0, skipped: `HTTP ${response.status}` };
  const sections = extractSections(await response.text());
  const { results: existing } = await env.CHAT_DB.prepare("SELECT id, source_ref, content_hash, status FROM knowledge WHERE source = 'site'").all();
  let updated = 0, archived = 0;
  for (const section of sections) {
    const current = existing.find(row => row.source_ref === section.id);
    const entry = { kind: 'page', title: section.title, content: section.content, status: 'approved', visibility: 'public', priority: 0, source: 'site', source_ref: section.id };
    const hash = await sha256([entry.title, null, entry.content, 'public', null, null].join('|'));
    if (current && current.content_hash === hash && current.status === 'approved') continue;
    await saveKnowledge(env, entry, { id: current?.id || null, skipBump: true }); updated++;
  }
  for (const row of existing) if (!sections.some(section => section.id === row.source_ref) && row.status !== 'archived') {
    await env.CHAT_DB.prepare("UPDATE knowledge SET status = 'archived', updated_at = ? WHERE id = ?").bind(now(), row.id).run(); archived++;
  }
  if (updated || archived) { await bumpKnowledgeVersion(env.CHAT_DB); await embedMissing(env); }
  return { updated, archived };
}

// PDFs and office documents become drafts: nothing reaches visitors before approval.
export async function importDocument(env, file) {
  if (!file || typeof file.arrayBuffer !== 'function') throw new Error('Adjunta un archivo.');
  if (file.size > 4 * 1024 * 1024) throw new Error('El archivo supera 4 MB.');
  let content;
  if (/\.(txt|md|csv)$/i.test(file.name)) content = await file.text();
  else {
    if (!env.AI?.toMarkdown) throw new Error('Conversión de documentos no disponible en este entorno.');
    const [converted] = await env.AI.toMarkdown([{ name: file.name, blob: new Blob([await file.arrayBuffer()], { type: file.type || 'application/octet-stream' }) }]);
    if (!converted || converted.format === 'error') throw new Error('No se pudo leer el documento.');
    content = converted.data;
  }
  return saveKnowledge(env, { kind: 'document', title: file.name.slice(0, 160), content, status: 'draft', visibility: 'internal', source: 'upload' }, { skipBump: true });
}
