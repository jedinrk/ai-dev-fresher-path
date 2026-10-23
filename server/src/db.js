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
    )
  `);

  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = undefined;
  }
}
