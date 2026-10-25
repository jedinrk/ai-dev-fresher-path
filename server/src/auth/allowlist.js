import { getDb } from '../db.js';

function normalize(email) {
  return (email || '').trim().toLowerCase();
}

export function isAllowlisted(email) {
  return Boolean(getAllowlistEntry(email));
}

export function roleForEmail(email) {
  return getAllowlistEntry(email)?.role || 'intern';
}

export function getAllowlistEntry(email) {
  return getDb()
    .prepare('SELECT email, role, created_at FROM allowlist WHERE email = ?')
    .get(normalize(email));
}

export function listAllowlist() {
  return getDb()
    .prepare('SELECT email, role, created_at FROM allowlist ORDER BY created_at')
    .all();
}

export function countMentors() {
  return getDb()
    .prepare("SELECT COUNT(*) AS count FROM allowlist WHERE role = 'mentor'")
    .get().count;
}

export function upsertAllowlistEntry(email, role) {
  const normalized = normalize(email);
  getDb()
    .prepare(
      `INSERT INTO allowlist (email, role) VALUES (?, ?)
       ON CONFLICT(email) DO UPDATE SET role = excluded.role`,
    )
    .run(normalized, role);
  return getAllowlistEntry(normalized);
}

export function removeAllowlistEntry(email) {
  const result = getDb()
    .prepare('DELETE FROM allowlist WHERE email = ?')
    .run(normalize(email));
  return result.changes > 0;
}
