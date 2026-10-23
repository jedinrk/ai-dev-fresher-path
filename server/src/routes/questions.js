import { Router } from 'express';
import { requireAuth } from '../auth/middleware.js';
import { createQuestion, getQuestionsForUser } from '../questions.js';

export const questionsRouter = Router();

questionsRouter.use(requireAuth);

questionsRouter.get('/', (req, res) => {
  const questions = getQuestionsForUser(req.user.email).map((q) => ({
    id: q.id,
    questionText: q.question_text,
    answer: q.answer,
    answeredAt: q.answered_at,
    createdAt: q.created_at,
  }));
  res.json(questions);
});

questionsRouter.post('/', (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'question text is required' });
  }

  createQuestion(req.user.email, text.trim());
  res.status(201).end();
});
