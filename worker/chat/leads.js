import { clean, fail } from './text.js';
import { now, addDays, rateLimit, countEvent } from './store.js';

// Must match the consent text shown in public/chat.js and the privacy notice.
export const CONSENT_VERSION = 'chat-leads-2026-10-30';
export const SERVICES = Object.freeze(['Plataformas digitales y landing pages', 'IA y automatizaciones', 'Marketing digital, redes sociales y SEO', 'Quiero explorar una idea']);
export const BUDGETS = Object.freeze(['Prefiero comentarlo después', 'Menos de $10,000 MXN', '$10,000 a $30,000 MXN', '$30,000 a $80,000 MXN', 'Más de $80,000 MXN']);
export const LEAD_STATUSES = Object.freeze(['new', 'contacted', 'qualified', 'closed', 'discarded']);

export function validateLead(body) {
  if (!body || typeof body !== 'object' || body.website) throw fail('Solicitud no válida.');
  const lead = {
    name: clean(body.name).replace(/\s+/g, ' ').slice(0, 80), business: clean(body.business || '').slice(0, 120),
    service: body.service, need: clean(body.need).slice(0, 600), contact: clean(body.contact).slice(0, 120),
    budget: body.budget ? String(body.budget) : null
  };
  if (lead.name.length < 2) throw fail('Escribe tu nombre.');
  if (!SERVICES.includes(lead.service)) throw fail('Selecciona un servicio.');
  if (lead.need.length < 10) throw fail('Cuéntanos brevemente qué necesitas (mínimo 10 caracteres).');
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.contact);
  const phone = /^\+?[\d\s()-]{10,18}$/.test(lead.contact);
  if (!email && !phone) throw fail('Escribe un WhatsApp (10 dígitos o más) o un correo válido.');
  if (lead.budget && !BUDGETS.includes(lead.budget)) throw fail('Presupuesto no válido.');
  if (body.consent !== true || body.consentVersion !== CONSENT_VERSION) throw fail('Necesitamos tu consentimiento para guardar tus datos.');
  return lead;
}

// Interest is a rough triage signal for follow-up order, not a score shown to the visitor.
const interestOf = lead => (lead.budget && lead.budget !== BUDGETS[0] ? 'high' : lead.need.length > 80 || lead.business ? 'medium' : 'low');

export async function captureLead(env, body, visitor) {
  const lead = validateLead(body);
  const limit = await rateLimit(env.CHAT_DB, `lead:${visitor}`, 3, 86400);
  if (!limit.allowed) throw fail('Ya recibimos tus datos. Si necesitas algo más, escríbenos por WhatsApp.', 429);
  const stamp = now(); const id = crypto.randomUUID();
  const retention = Math.min(365, Math.max(30, Number.parseInt(env.LEAD_RETENTION_DAYS || '180', 10) || 180));
  await env.CHAT_DB.prepare(`INSERT INTO leads (id, created_at, updated_at, source, name, business, service, need_summary, contact, budget, interest, status, consent_version, consent_at, expires_at)
    VALUES (?, ?, ?, 'chat', ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)`)
    .bind(id, stamp, stamp, lead.name, lead.business || null, lead.service, lead.need, lead.contact, lead.budget, interestOf(lead), CONSENT_VERSION, stamp, addDays(retention)).run();
  await countEvent(env.CHAT_DB, 'lead');
  return { id, retentionDays: retention };
}
