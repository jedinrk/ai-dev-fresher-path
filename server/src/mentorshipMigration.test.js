import { afterEach, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { closeDb, getDb } from './db.js';
import { resetTestEnv } from './testUtils.js';
let directory;
afterEach(() => { closeDb(); if (directory) rmSync(directory, { recursive: true, force: true }); });
it('upgrades existing records without replacing them and can reopen the upgraded database', () => {
  resetTestEnv();
  directory = mkdtempSync(path.join(tmpdir(), 'mentor-migration-test-'));
  process.env.DB_PATH = path.join(directory, 'legacy.db');
  const old = new Database(process.env.DB_PATH);
  old.exec(`CREATE TABLE questions (id INTEGER PRIMARY KEY, user_email TEXT, question_text TEXT,
    answer TEXT, answered_at TEXT, flagged INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')));
    INSERT INTO questions (user_email, question_text) VALUES ('intern@example.com', 'An existing question');`);
  old.close();
  let db = getDb();
  expect(db.prepare('SELECT question_text, concept_id FROM questions').get()).toEqual({ question_text: 'An existing question', concept_id: null });
  expect(db.prepare("SELECT cohort_id FROM cohort_members WHERE user_email = 'intern@example.com'").get().cohort_id).toBe(1);
  db.prepare("INSERT INTO cohorts (name) VALUES ('Next cohort')").run();
  db.prepare("UPDATE cohort_members SET cohort_id = 2 WHERE user_email = 'intern@example.com'").run();
  closeDb(); db = getDb();
  expect(db.prepare('SELECT COUNT(*) AS n FROM questions').get().n).toBe(1);
  expect(db.prepare('SELECT COUNT(*) AS n FROM cohorts').get().n).toBe(2);
  expect(db.prepare("SELECT cohort_id FROM cohort_members WHERE user_email = 'intern@example.com'").get().cohort_id).toBe(2);
});
