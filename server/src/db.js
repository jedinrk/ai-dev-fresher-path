import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';

let db;

export function getDb() {
  if (db) return db;

  const dbPath = process.env.DB_PATH || './data/app.db';
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
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
  `);

  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = undefined;
  }
}
