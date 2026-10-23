import { getDb } from '../db.js';

export function findUserByEmail(email) {
  return getDb()
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email.trim().toLowerCase());
}

export function createUser({ email, name, passwordHash, role }) {
  const normalizedEmail = email.trim().toLowerCase();
  getDb()
    .prepare(
      'INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)',
    )
    .run(normalizedEmail, name, passwordHash, role);
  return findUserByEmail(normalizedEmail);
}

export function listUsers() {
  return getDb()
    .prepare('SELECT email, name, role, created_at FROM users ORDER BY created_at')
    .all();
}

export function deleteUserByEmail(email) {
  const result = getDb()
    .prepare('DELETE FROM users WHERE email = ?')
    .run(email.trim().toLowerCase());
  return result.changes > 0;
}
