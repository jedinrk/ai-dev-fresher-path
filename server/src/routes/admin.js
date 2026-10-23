import { Router } from 'express';
import { requireAdmin, requireAuth } from '../auth/middleware.js';
import { deleteUserByEmail, findUserByEmail, listUsers } from '../auth/users.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/users', (req, res) => {
  res.json(listUsers());
});

adminRouter.delete('/users/:email', (req, res) => {
  const { email } = req.params;

  if (email.toLowerCase() === req.user.email.toLowerCase()) {
    return res.status(400).json({ error: 'cannot reset your own account' });
  }

  const target = findUserByEmail(email);
  if (!target) {
    return res.status(404).json({ error: 'no such user' });
  }

  deleteUserByEmail(email);
  res.status(204).end();
});
