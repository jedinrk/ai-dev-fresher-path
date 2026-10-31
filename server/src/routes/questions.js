import { Router } from 'express';
import { requireAuth } from '../auth/middleware.js';
import { createQuestion, getQuestionsForUser } from '../questions.js';

import { getProgram } from '../content.js';

export const questionsRouter = Router();

questionsRouter.use(requireAuth);

questionsRouter.get('/', (req, res) => {
  const questions = getQuestionsForUser(req.user.email).map((q) => ({
    id: q.id,
    conceptId: q.concept_id,
    questionText: q.question_text,
    answer: q.answer,
    answeredAt: q.answered_at,
    createdAt: q.created_at,
  }));
  res.json(questions);
});

questionsRouter.post('/', (req, res) => {
  const { text, conceptId } = req.body;

  if (typeof text !== 'string' || !text.trim() || text.length > 10000) {
    return res.status(400).json({ error: 'question text is required' });
  }

  if (conceptId != null && !getProgram().lessons.some(l => l.id === conceptId)) {
    return res.status(400).json({ error: 'No such lesson.' });
  }
  createQuestion(req.user.email, text.trim(), conceptId || null);
  res.status(201).end();
});
