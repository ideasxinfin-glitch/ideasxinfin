import { getSettings, reserveUsage, recordUsage, logError, setCooldown, coolingDown, nextUtcMidnight } from './store.js';

// Identifiers verified in the Workers AI catalog (wrangler ai models) on 2026-10-30.
// Prices: neurons per million tokens from developers.cloudflare.com/workers-ai/platform/pricing.
export const PROVIDERS = Object.freeze({
  gemma: { label: 'Gemma 4 26B (Workers AI)', type: 'workers-ai', model: '@cf/google/gemma-4-26b-a4b-it', price: { input: 9091, output: 27273 }, maxTokens: 650 },
  glm: { label: 'GLM 4.7 Flash (Workers AI)', type: 'workers-ai', model: '@cf/zai-org/glm-4.7-flash', price: { input: 5500, output: 36400 }, maxTokens: 650 },
  groq: { label: 'GroqCloud (plan gratuito)', type: 'groq', model: 'openai/gpt-oss-120b', maxTokens: 650 }
});
const TIMEOUT_MS = 15000;
const estimateTokens = messages => Math.ceil(messages.reduce((total, message) => total + message.content.length, 0) / 3);
const neurons = (price, input, output) => (input * price.input + output * price.output) / 1e6;

function withTimeout(promise, ms) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'timeout' })), ms); })]).finally(() => clearTimeout(timer));
}

function readCompletion(result) {
  const text = result?.choices?.[0]?.message?.content ?? result?.response ?? result?.result?.response ?? '';
  const usage = result?.usage || {};
  return { text: typeof text === 'string' ? text : '', tokensIn: usage.prompt_tokens || 0, tokensOut: usage.completion_tokens || 0 };
}

// Daily allocation exhausted (Workers AI 4006) means no further calls until 00:00 UTC.
const isQuotaError = error => /4006|daily free allocation|neurons|quota|rate limit|429|capacity/i.test(`${error.code || ''} ${error.message || ''}`);

async function callWorkersAi(env, settings, id, messages) {
  const provider = PROVIDERS[id];
  const reserved = neurons(provider.price, estimateTokens(messages), provider.maxTokens);
  // One shared counter: switching between Gemma and GLM never resets the account allocation.
  if (!(await reserveUsage(env.CHAT_DB, 'workers-ai', reserved, settings.neuronBudget))) return { skipped: 'budget' };
  try {
    const result = await withTimeout(env.AI.run(provider.model, {
      messages, max_completion_tokens: provider.maxTokens, temperature: 0.4,
      // Both models reason by default; for short sales answers that only burns tokens and time.
      chat_template_kwargs: { enable_thinking: false }
    }), TIMEOUT_MS);
    const { text, tokensIn, tokensOut } = readCompletion(result);
    const actual = tokensIn || tokensOut ? neurons(provider.price, tokensIn, tokensOut) : reserved;
    // Reconcile the reservation with the real usage reported by the model.
    await recordUsage(env.CHAT_DB, 'workers-ai', { neurons: actual - reserved });
    await recordUsage(env.CHAT_DB, id, { requests: 1, neurons: actual, tokensIn, tokensOut });
    if (!text.trim()) throw Object.assign(new Error('empty completion'), { code: 'empty' });
    return { text };
  } catch (error) {
    await recordUsage(env.CHAT_DB, id, { requests: 1, errors: 1 });
    await logError(env.CHAT_DB, id, error.code || 'error', error.message);
    const quota = isQuotaError(error);
    if (quota) await setCooldown(env.CHAT_DB, 'workers-ai', nextUtcMidnight());
    else if (error.code === 'timeout') await setCooldown(env.CHAT_DB, id, Date.now() + 120000);
    return { error, quota };
  }
}

async function callGroq(env, settings, messages) {
  if (!env.GROQ_API_KEY) return { skipped: 'not-configured' };
  if (!(await reserveUsage(env.CHAT_DB, 'groq-quota', 1, settings.groqDailyRequests, 'requests'))) return { skipped: 'budget' };
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: env.GROQ_MODEL || PROVIDERS.groq.model, messages, max_tokens: PROVIDERS.groq.maxTokens, temperature: 0.4 })
    });
    if (!response.ok) {
      const retry = Number(response.headers.get('retry-after')) || 0;
      throw Object.assign(new Error(`HTTP ${response.status}`), { code: response.status, retry });
    }
    const { text, tokensIn, tokensOut } = readCompletion(await response.json());
    await recordUsage(env.CHAT_DB, 'groq', { requests: 1, tokensIn, tokensOut });
    if (!text.trim()) throw Object.assign(new Error('empty completion'), { code: 'empty' });
    return { text };
  } catch (error) {
    await recordUsage(env.CHAT_DB, 'groq', { requests: 1, errors: 1 });
    await logError(env.CHAT_DB, 'groq', error.code || error.name || 'error', error.message);
    if (error.code === 429) await setCooldown(env.CHAT_DB, 'groq', error.retry && error.retry < 3600 ? Date.now() + error.retry * 1000 : nextUtcMidnight());
    else if (error.code === 401 || error.code === 403) await setCooldown(env.CHAT_DB, 'groq', nextUtcMidnight());
    return { error };
  }
}

// Explicit, ordered fallback: one provider at a time, one attempt each, never in parallel.
export async function generate(env, messages, { simple = false } = {}) {
  const settings = await getSettings(env.CHAT_DB, { fresh: true });
  let order = settings.providers.filter(item => item.enabled && PROVIDERS[item.id]).map(item => item.id);
  // Simple questions try the lighter model first when both Workers AI models are enabled.
  if (simple && order.includes('glm') && order.includes('gemma') && order.indexOf('gemma') < order.indexOf('glm')) order = ['glm', ...order.filter(id => id !== 'glm')];
  const attempts = []; let workersAiBlocked = !env.AI || coolingDown(settings, 'workers-ai');
  for (const id of order) {
    const provider = PROVIDERS[id];
    if (coolingDown(settings, id) || (provider.type === 'workers-ai' && workersAiBlocked)) { attempts.push({ id, skipped: 'cooldown' }); continue; }
    const result = provider.type === 'groq' ? await callGroq(env, settings, messages) : await callWorkersAi(env, settings, id, messages);
    if (result.text) return { text: result.text, provider: id, attempts };
    // Quota or budget exhaustion is account-wide: the other Workers AI model would fail too.
    if (provider.type === 'workers-ai' && (result.quota || result.skipped === 'budget')) workersAiBlocked = true;
    attempts.push({ id, skipped: result.skipped, error: result.error?.code || (result.error ? 'error' : undefined) });
  }
  return { text: null, provider: null, attempts };
}
