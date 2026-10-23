import { Router } from 'express';
import { requireAdmin, requireAuth } from '../auth/middleware.js';
import { deleteUserByEmail, findUserByEmail, listUsers } from '../auth/users.js';
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

  if (!answer || !answer.trim()) {
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
