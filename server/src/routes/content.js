import { Router } from 'express';
import { requireAuth } from '../auth/middleware.js';
import { getConcepts } from '../content.js';

export const contentRouter = Router();

contentRouter.get('/concepts', requireAuth, (req, res) => {
  res.json(getConcepts());
});
