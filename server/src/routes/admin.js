import { Router } from 'express';
import {
  countMentors,
  getAllowlistEntry,
  listAllowlist,
  removeAllowlistEntry,
  upsertAllowlistEntry,
} from '../auth/allowlist.js';
import { requireAdmin, requireAuth } from '../auth/middleware.js';
import { deleteUserByEmail, findUserByEmail, listUsers, syncUserRole } from '../auth/users.js';
import { getConcepts } from '../content.js';
import {
  gateStatusForWeek,
  getCheckpoint,
  getPrediction,
  setWrongFlag,
  signOffCheckpoint,
} from '../progress.js';
import {
  answerQuestion,
  findQuestionById,
  getFlaggedQuestions,
  setQuestionFlag,
} from '../questions.js';
import { WEEK_CONCEPTS, WEEKS } from '../weeks.js';

import { getDb } from '../db.js';
import { assignCohort, listCohorts } from '../mentorship.js';

export const adminRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

adminRouter.get('/allowlist', (req, res) => {
  res.json(listAllowlist());
});

adminRouter.post('/allowlist', (req, res) => {
  const { email, role, cohortId } = req.body;

  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim()) || email.length > 254) {
    return res.status(400).json({ error: 'a valid email is required' });
  }

  if (role !== 'mentor' && role !== 'intern') {
    return res.status(400).json({ error: "role must be 'mentor' or 'intern'" });
  }

  if (cohortId != null && (!Number.isInteger(cohortId) || !listCohorts().some(c => c.id === cohortId))) {
    return res.status(400).json({ error: 'Choose an existing cohort.' });
  }
  const normalized = email.trim().toLowerCase();
  const existing = getAllowlistEntry(normalized);

  if (existing?.role === 'mentor' && role === 'intern' && countMentors() <= 1) {
    return res.status(400).json({ error: 'cannot demote the last mentor' });
  }

  const entry = getDb().transaction(() => {
    const updated = upsertAllowlistEntry(normalized, role);
    syncUserRole(normalized, role);
    if (role === 'intern') {
      const membership = getDb().prepare('SELECT cohort_id FROM cohort_members WHERE user_email = ?').get(normalized);
      assignCohort(normalized, cohortId ?? membership?.cohort_id ?? 1);
    }
    return updated;
  })();
  res.status(existing ? 200 : 201).json(entry);
});

adminRouter.delete('/allowlist/:email', (req, res) => {
  const { email } = req.params;
  const entry = getAllowlistEntry(email);

  if (!entry) {
    return res.status(404).json({ error: 'no such allowlist entry' });
  }

  if (entry.email === req.user.email.toLowerCase()) {
    return res.status(400).json({ error: 'cannot remove your own access' });
  }

  if (entry.role === 'mentor' && countMentors() <= 1) {
    return res.status(400).json({ error: 'cannot remove the last mentor' });
  }

  removeAllowlistEntry(email);
  res.status(204).end();
});

adminRouter.get('/checkpoints', (req, res) => {
  const interns = listUsers().filter((u) => u.role === 'intern');
  const conceptById = Object.fromEntries(getConcepts().map((c) => [c.id, c]));

  const result = interns.map((user) => ({
    email: user.email,
    name: user.name,
    weeks: WEEKS.map((week) => {
      const checkpoint = getCheckpoint(user.email, week);
      const predictions = (WEEK_CONCEPTS[week] || [])
        .map((conceptId) => {
          const prediction = getPrediction(user.email, conceptId);
          if (!prediction) return null;
          return {
            conceptId,
            concept: conceptById[conceptId]?.concept || conceptId,
            text: prediction.text,
            wrongFlag: Boolean(prediction.wrong_flag),
          };
        })
        .filter(Boolean);

      return {
        week,
        gatePassed: gateStatusForWeek(user.email, week),
        signedOffAt: checkpoint?.signed_off_at || null,
        mentorNotes: checkpoint?.mentor_notes || '',
        predictions,
      };
    }),
  }));

  res.json(result);
});

adminRouter.patch('/predictions/:email/:conceptId', (req, res) => {
  const { email, conceptId } = req.params;
  const { wrongFlag } = req.body;

  if (typeof wrongFlag !== 'boolean') {
    return res.status(400).json({ error: 'wrongFlag must be true or false' });
  }

  if (!findUserByEmail(email)) {
    return res.status(404).json({ error: 'no such user' });
  }

  if (!getPrediction(email, conceptId)) {
    return res.status(404).json({ error: 'no prediction for this concept' });
  }

  setWrongFlag(email, conceptId, wrongFlag);
  res.status(204).end();
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

adminRouter.get('/questions', (req, res) => {
  const questions = getFlaggedQuestions().map((q) => ({
    id: q.id,
    userEmail: q.user_email,
    questionText: q.question_text,
    createdAt: q.created_at,
  }));
  res.json(questions);
});

adminRouter.post('/questions/:id/answer', (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;

  if (typeof answer !== 'string' || !answer.trim() || answer.length > 10000) {
    return res.status(400).json({ error: 'answer text is required' });
  }

  if (!findQuestionById(id)) {
    return res.status(404).json({ error: 'no such question' });
  }

  answerQuestion(id, answer.trim());
  res.status(204).end();
});

adminRouter.patch('/questions/:id/flag', (req, res) => {
  const { id } = req.params;
  const { flagged } = req.body;

  if (typeof flagged !== 'boolean') {
    return res.status(400).json({ error: 'flagged must be true or false' });
  }

  if (!findQuestionById(id)) {
    return res.status(404).json({ error: 'no such question' });
  }

  setQuestionFlag(id, flagged);
  res.status(204).end();
});

adminRouter.get('/cohorts', (req, res) => res.json(listCohorts()));

adminRouter.post('/cohorts', (req, res) => {
  const { name } = req.body;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
    return res.status(400).json({ error: 'Use a cohort name between 1 and 100 characters.' });
  }
  if (listCohorts().some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(409).json({ error: 'A cohort with this name already exists.' });
  }
  const result = getDb().prepare('INSERT INTO cohorts (name) VALUES (?)').run(name.trim());
  res.status(201).json({ id: Number(result.lastInsertRowid), name: name.trim() });
});

adminRouter.get('/people', (req, res) => {
  res.json(getDb().prepare(`SELECT a.email, u.name, a.role, a.created_at AS invitedAt,
    u.created_at AS registeredAt, c.id AS cohortId, c.name AS cohortName,
    (SELECT MAX(created_at) FROM login_events WHERE user_email = a.email AND outcome IN ('success', 'registered')) AS lastLogin
    FROM allowlist a LEFT JOIN users u ON a.email = u.email
    LEFT JOIN cohort_members m ON m.user_email = a.email
    LEFT JOIN cohorts c ON c.id = m.cohort_id
    ORDER BY u.name, a.email`).all());
});

adminRouter.get('/login-activity', (req, res) => {
  // Bound the audit list; never expose passwords, cookies, or session identifiers.
  const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : null;
  const rows = email
    ? getDb().prepare('SELECT id, user_email AS email, outcome, created_at AS createdAt FROM login_events WHERE user_email = ? ORDER BY id DESC LIMIT 100').all(email)
    : getDb().prepare('SELECT id, user_email AS email, outcome, created_at AS createdAt FROM login_events ORDER BY id DESC LIMIT 100').all();
  res.json(rows);
});
