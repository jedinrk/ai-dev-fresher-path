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
  // Additive, idempotent migration: existing learning and access records stay intact.
  db.exec(`
    CREATE TABLE IF NOT EXISTS cohorts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cohort_members (
      user_email TEXT PRIMARY KEY, cohort_id INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS login_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_email TEXT NOT NULL,
      outcome TEXT NOT NULL CHECK (outcome IN ('registered', 'success', 'failed', 'denied')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS login_events_user ON login_events(user_email, id);
    CREATE TABLE IF NOT EXISTS review_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_email TEXT NOT NULL, version TEXT NOT NULL,
      week INTEGER NOT NULL, event TEXT NOT NULL, evidence_url TEXT NOT NULL,
      summary TEXT NOT NULL, mentor_notes TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS review_history_user ON review_history(user_email, version, id);
    INSERT OR IGNORE INTO cohorts (id, name) VALUES (1, 'Current cohort');
    INSERT OR IGNORE INTO cohort_members (user_email, cohort_id)
      SELECT email, 1 FROM allowlist WHERE role = 'intern';
  `);
  if (
    !db
      .prepare("PRAGMA table_info(questions)")
      .all()
      .some((c) => c.name === "concept_id")
  ) {
    db.exec("ALTER TABLE questions ADD COLUMN concept_id TEXT");
  }

  return db;
}

// The allowlist used to live only in ALLOWLIST_EMAILS/MENTOR_EMAIL env vars.
// Those are now just a one-time bootstrap: whoever is in them when the
// allowlist table is first created gets seeded in, so the first mentor can
// sign in and manage the allowlist from the admin panel from then on.
function seedAllowlistFromEnvIfEmpty(database) {
  const { count } = database
    .prepare("SELECT COUNT(*) AS count FROM allowlist")
    .get();
  if (count > 0) return;

  const emails = (process.env.ALLOWLIST_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (emails.length === 0) return;

  const mentorEmail = (process.env.MENTOR_EMAIL || "").trim().toLowerCase();
  const insert = database.prepare(
    "INSERT OR IGNORE INTO allowlist (email, role) VALUES (?, ?)",
  );
  const insertAll = database.transaction((list) => {
    for (const email of list) {
      insert.run(email, email === mentorEmail ? "mentor" : "intern");
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
