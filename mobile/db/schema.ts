// SQLite schema para o modo Free (dados locais no device)
// Executado via expo-sqlite migrations na primeira abertura do app
// NUNCA altere este arquivo sem criar uma nova migration versionada

export const SCHEMA_VERSION = 1;

export const CREATE_NOTES_TABLE = `
  CREATE TABLE IF NOT EXISTS notes (
    id          TEXT PRIMARY KEY,
    local_id    TEXT UNIQUE NOT NULL,
    title       TEXT NOT NULL,
    body        TEXT NOT NULL,
    subject     TEXT NOT NULL DEFAULT '',
    tags        TEXT NOT NULL DEFAULT '[]',
    favorite    INTEGER NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'archived', 'deleted')),
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );
`;

export const CREATE_PLANNER_CARDS_TABLE = `
  CREATE TABLE IF NOT EXISTS planner_cards (
    id           TEXT PRIMARY KEY,
    note_id      TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    assigned_day INTEGER NOT NULL CHECK (assigned_day BETWEEN 0 AND 6),
    completed    INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL
  );
`;

export const CREATE_REVIEW_DATES_TABLE = `
  CREATE TABLE IF NOT EXISTS review_dates (
    id       TEXT PRIMARY KEY,
    note_id  TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    due_date TEXT NOT NULL,
    done     INTEGER NOT NULL DEFAULT 0
  );
`;

// Tabela de metadados do app (schema version, storage mode, etc.)
export const CREATE_META_TABLE = `
  CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT
  );
`;

// Índices para performance nas queries mais comuns
export const CREATE_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);
  CREATE INDEX IF NOT EXISTS idx_notes_subject ON notes(status, subject);
  CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(status, updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_planner_day ON planner_cards(assigned_day);
  CREATE INDEX IF NOT EXISTS idx_review_due ON review_dates(due_date, done);
`;

// Chaves armazenadas na tabela meta
export const META_KEYS = {
  SCHEMA_VERSION: 'schema_version',
  USER_ID: 'user_id',
  STORAGE_MODE: 'storage_mode',  // 'LOCAL' | 'CLOUD'
  MIGRATION_DONE: 'migration_done',
  MIGRATION_AT: 'migration_at',
  NOTE_COUNT: 'note_count',
} as const;

export const FREE_TIER_NOTE_LIMIT = 100;
