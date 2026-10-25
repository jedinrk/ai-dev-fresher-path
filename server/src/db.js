import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";

let db;

export function getDb() {
  if (db) return db;

  const dbPath = process.env.DB_PATH || "./data/app.db";
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('mentor', 'intern')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      concept_id TEXT NOT NULL,
      text TEXT NOT NULL,
      wrong_flag INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (user_email, concept_id)
    );

    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      concept_id TEXT NOT NULL,
      step TEXT NOT NULL CHECK (step IN ('predict', 'learn', 'prove', 'done')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (user_email, concept_id)
    );

    CREATE TABLE IF NOT EXISTS checkpoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      week INTEGER NOT NULL,
      mentor_notes TEXT,
      signed_off_at TEXT,
      UNIQUE (user_email, week)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      question_text TEXT NOT NULL,
      answer TEXT,
      answered_at TEXT,
      flagged INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS explanations (
      user_email TEXT NOT NULL,
      concept_id TEXT NOT NULL,
      text TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_email, concept_id)
    );

    CREATE TABLE IF NOT EXISTS journey_reviews (
      user_email TEXT NOT NULL,
      version TEXT NOT NULL,
      week INTEGER NOT NULL,
      evidence_url TEXT NOT NULL,
      summary TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('submitted', 'changes_requested', 'approved')),
      mentor_notes TEXT NOT NULL DEFAULT '',
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_at TEXT,
      PRIMARY KEY (user_email, version, week)
    );

    CREATE TABLE IF NOT EXISTS allowlist (
      email TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('mentor', 'intern')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  seedAllowlistFromEnvIfEmpty(db);

  return db;
}

// The allowlist used to live only in ALLOWLIST_EMAILS/MENTOR_EMAIL env vars.
// Those are now just a one-time bootstrap: whoever is in them when the
// allowlist table is first created gets seeded in, so the first mentor can
// sign in and manage the allowlist from the admin panel from then on.
function seedAllowlistFromEnvIfEmpty(database) {
  const { count } = database.prepare('SELECT COUNT(*) AS count FROM allowlist').get();
  if (count > 0) return;

  const emails = (process.env.ALLOWLIST_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (emails.length === 0) return;

  const mentorEmail = (process.env.MENTOR_EMAIL || '').trim().toLowerCase();
  const insert = database.prepare(
    'INSERT OR IGNORE INTO allowlist (email, role) VALUES (?, ?)',
  );
  const insertAll = database.transaction((list) => {
    for (const email of list) {
      insert.run(email, email === mentorEmail ? 'mentor' : 'intern');
    }
  });
  insertAll(emails);
}

export function closeDb() {
  if (db) {
    db.close();
    db = undefined;
  }
}
