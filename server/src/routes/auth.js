import { Router } from 'express';
import { isAllowlisted, roleForEmail } from '../auth/allowlist.js';
import { requireAuth } from '../auth/middleware.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { clearSessionCookie, setSessionCookie } from '../auth/session.js';
import { createUser, findUserByEmail } from '../auth/users.js';

export const authRouter = Router();

function publicUser(user) {
  return { email: user.email, name: user.name, role: user.role };
}

authRouter.post('/register', (req, res) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password || password.length < 8) {
    return res
      .status(400)
      .json({ error: 'email, name, and a password of at least 8 characters are required' });
  }

  if (!isAllowlisted(email)) {
    return res.status(403).json({ error: 'this email is not allowed to register' });
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ error: 'this email has already registered, please log in' });
  }

  const user = createUser({
    email,
    name,
    passwordHash: hashPassword(password),
    role: roleForEmail(email),
  });

  setSessionCookie(res, user.email);
  res.status(201).json(publicUser(user));
});

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = email && findUserByEmail(email);

  if (!user || !verifyPassword(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'invalid email or password' });
  }

  if (!isAllowlisted(user.email)) {
    return res.status(403).json({ error: 'this email is not authorised' });
  }

  setSessionCookie(res, user.email);
  res.json(publicUser(user));
});

authRouter.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json(publicUser(req.user));
});
