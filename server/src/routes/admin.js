import { Router } from 'express';
import { requireAdmin, requireAuth } from '../auth/middleware.js';
import { deleteUserByEmail, findUserByEmail, listUsers } from '../auth/users.js';
import { gateStatusForWeek, getCheckpoint, signOffCheckpoint } from '../progress.js';
import { WEEKS } from '../weeks.js';

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

adminRouter.get('/checkpoints', (req, res) => {
  const interns = listUsers().filter((u) => u.role === 'intern');

  const result = interns.map((user) => ({
    email: user.email,
    name: user.name,
    weeks: WEEKS.map((week) => {
      const checkpoint = getCheckpoint(user.email, week);
      return {
        week,
        gatePassed: gateStatusForWeek(user.email, week),
        signedOffAt: checkpoint?.signed_off_at || null,
        mentorNotes: checkpoint?.mentor_notes || '',
      };
    }),
  }));

  res.json(result);
});

adminRouter.post('/checkpoints/:email/:week', (req, res) => {
  const { email, week } = req.params;
  const { notes } = req.body;
  const weekNumber = Number(week);

  if (!findUserByEmail(email)) {
    return res.status(404).json({ error: 'no such user' });
  }

  if (!WEEKS.includes(weekNumber)) {
    return res.status(400).json({ error: 'no such week' });
  }

  if (!gateStatusForWeek(email, weekNumber)) {
    return res
      .status(400)
      .json({ error: 'not all concepts for this week are done yet' });
  }

  signOffCheckpoint(email, weekNumber, notes);
  res.status(204).end();
});
