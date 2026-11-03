// Minimal D1 + KV + Workers AI doubles for tests. No network, no Cloudflare account.
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';

class Statement {
  constructor(db, sql, args = []) { this.db = db; this.sql = sql; this.args = args; }
  bind(...args) { return new Statement(this.db, this.sql, args.map(value => (value === undefined ? null : value))); }
  async first(column) { const row = this.db.prepare(this.sql).get(...this.args); return row ? (column ? row[column] : { ...row }) : null; }
  async all() { return { results: this.db.prepare(this.sql).all(...this.args).map(row => ({ ...row })) }; }
  async run() { const info = this.db.prepare(this.sql).run(...this.args); return { meta: { changes: Number(info.changes), last_row_id: Number(info.lastInsertRowid) } }; }
}
export async function createD1() {
  const db = new DatabaseSync(':memory:');
  db.exec(await readFile(new URL('../migrations/chat/0001_init.sql', import.meta.url), 'utf8'));
  return { prepare: sql => new Statement(db, sql), batch: async statements => Promise.all(statements.map(statement => statement.run())), raw: db };
}
export function createKv() {
  const store = new Map();
  return { store, async get(key, type) { const value = store.get(key); return value == null ? null : type === 'json' ? JSON.parse(value) : value; }, async put(key, value) { store.set(key, value); } };
}
// Fake AI: deterministic embeddings from word hashes, scripted chat behaviour per model.
export function createAi(behaviour = {}) {
  const calls = [];
  const vector = text => {
    const out = new Array(64).fill(0);
    for (const word of text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\W+/).filter(w => w.length > 2)) {
      let h = 0; for (const char of word) h = (h * 31 + char.charCodeAt(0)) >>> 0; out[h % 64] += 1;
    }
    return out;
  };
  return {
    calls,
    async run(model, input) {
      calls.push({ model, input });
      if (model.includes('bge')) return { data: input.text.map(vector) };
      const action = behaviour[model] || 'ok';
      if (action === 'fail') throw new Error('upstream error');
      if (action === 'quota') throw new Error('4006: you have used up your daily free allocation of 10,000 neurons');
      return { choices: [{ message: { content: `Respuesta de ${model}. **Podemos ayudarte** con tu proyecto.` } }], usage: { prompt_tokens: 800, completion_tokens: 120 } };
    }
  };
}
