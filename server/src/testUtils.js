import { closeDb } from './db.js';

export function resetTestEnv() {
  closeDb();
  process.env.SESSION_SECRET = 'test-secret';
  process.env.DB_PATH = ':memory:';
  process.env.ALLOWLIST_EMAILS = 'mentor@example.com,intern@example.com';
  process.env.MENTOR_EMAIL = 'mentor@example.com';
}
