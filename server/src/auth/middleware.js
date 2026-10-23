import { isAllowlisted } from './allowlist.js';
import { readSessionEmail } from './session.js';
import { findUserByEmail } from './users.js';

export function requireAuth(req, res, next) {
  const email = readSessionEmail(req);
  if (!email || !isAllowlisted(email)) {
    return res.status(401).json({ error: 'not authenticated' });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'not authenticated' });
  }

  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user.role !== 'mentor') {
    return res.status(403).json({ error: 'not authorised' });
  }
  next();
}
