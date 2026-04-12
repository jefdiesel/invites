import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
    migrate(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS polls (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      location TEXT DEFAULT '',
      deadline TEXT,
      phase TEXT NOT NULL DEFAULT 'polling',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS options (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      capacity INTEGER,
      confirmed INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS roster_members (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS poll_tokens (
      token TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      member_id TEXT NOT NULL REFERENCES roster_members(id) ON DELETE CASCADE,
      used_at TEXT
    );

    CREATE TABLE IF NOT EXISTS responses (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      member_id TEXT NOT NULL REFERENCES roster_members(id) ON DELETE CASCADE,
      flexibility TEXT NOT NULL DEFAULT 'flexible',
      response_type TEXT NOT NULL DEFAULT 'voted',
      submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS response_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      response_id TEXT NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
      option_id TEXT NOT NULL REFERENCES options(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK(status IN ('available','unable')),
      rank INTEGER
    );

    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      response_id TEXT NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
      option_id TEXT NOT NULL REFERENCES options(id) ON DELETE CASCADE,
      offered_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function migrate(db: Database.Database) {
  // Add response_type column if missing (existing DBs)
  try {
    db.exec(`ALTER TABLE responses ADD COLUMN response_type TEXT NOT NULL DEFAULT 'voted'`);
  } catch {
    // Column already exists
  }
}
