-- Ideas Xinfin chat: knowledge, approved cache candidates, usage counters and consented leads.
-- Conversations are never stored. Only scrubbed first-turn questions become review candidates.
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('service', 'price', 'promo', 'faq', 'education', 'policy', 'page', 'document')),
  title TEXT NOT NULL,
  question TEXT,
  content TEXT NOT NULL,
  keywords TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'internal', 'confidential')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'archived')),
  priority INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'admin',
  source_ref TEXT,
  valid_from TEXT,
  valid_until TEXT,
  content_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS knowledge_status ON knowledge (status, kind);
CREATE UNIQUE INDEX IF NOT EXISTS knowledge_source_ref ON knowledge (source, source_ref) WHERE source_ref IS NOT NULL;

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  knowledge_id INTEGER NOT NULL REFERENCES knowledge (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  text TEXT NOT NULL,
  embedding TEXT,
  model TEXT
);
CREATE INDEX IF NOT EXISTS knowledge_chunks_parent ON knowledge_chunks (knowledge_id);

CREATE TABLE IF NOT EXISTS candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('answer', 'gap')),
  question TEXT NOT NULL,
  normalized TEXT NOT NULL,
  answer TEXT,
  provider TEXT,
  hits INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  knowledge_version INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  UNIQUE (kind, normalized)
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source TEXT NOT NULL,
  name TEXT NOT NULL,
  business TEXT,
  service TEXT NOT NULL,
  need_summary TEXT NOT NULL,
  contact TEXT NOT NULL,
  budget TEXT,
  interest TEXT NOT NULL CHECK (interest IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'closed', 'discarded')),
  consent_version TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS leads_expiry ON leads (expires_at);

CREATE TABLE IF NOT EXISTS usage_daily (
  day TEXT NOT NULL,
  provider TEXT NOT NULL,
  requests INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  neurons REAL NOT NULL DEFAULT 0,
  tokens_in INTEGER NOT NULL DEFAULT 0,
  tokens_out INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, provider)
);

CREATE TABLE IF NOT EXISTS events_daily (
  day TEXT NOT NULL,
  kind TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kind)
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS error_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  provider TEXT NOT NULL,
  code TEXT NOT NULL,
  message TEXT NOT NULL
);
