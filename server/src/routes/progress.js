import { Router } from 'express';
import { requireAuth } from '../auth/middleware.js';
import { getConcepts } from '../content.js';
import {
  createPrediction,
  getPrediction,
  getPredictionsForUser,
  getProgressForUser,
  setProgressStep,
} from '../progress.js';

export const progressRouter = Router();

const VALID_STEPS = new Set(['prove', 'done']);

progressRouter.use(requireAuth);

progressRouter.get('/', (req, res) => {
  const predictions = getPredictionsForUser(req.user.email);
  const progress = getProgressForUser(req.user.email);

  const predictionByConcept = Object.fromEntries(
    predictions.map((p) => [p.concept_id, p.text]),
  );
  const stepByConcept = Object.fromEntries(progress.map((p) => [p.concept_id, p.step]));

  res.json({ predictions: predictionByConcept, steps: stepByConcept });
});

progressRouter.post('/:conceptId/prediction', (req, res) => {
  const { conceptId } = req.params;
  const { text } = req.body;

  if (!getConcepts().some((c) => c.id === conceptId)) {
    return res.status(404).json({ error: 'no such concept' });
  }

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'prediction text is required' });
  }

  if (getPrediction(req.user.email, conceptId)) {
    return res.status(409).json({ error: 'a prediction has already been submitted' });
  }

  createPrediction(req.user.email, conceptId, text.trim());
  setProgressStep(req.user.email, conceptId, 'learn');
  res.status(201).end();
});

progressRouter.post('/:conceptId/step', (req, res) => {
  const { conceptId } = req.params;
  const { step } = req.body;

  if (!VALID_STEPS.has(step)) {
    return res.status(400).json({ error: `step must be one of: ${[...VALID_STEPS].join(', ')}` });
  }

  if (!getConcepts().some((c) => c.id === conceptId)) {
    return res.status(404).json({ error: 'no such concept' });
  }

  setProgressStep(req.user.email, conceptId, step);
  res.status(204).end();
});
