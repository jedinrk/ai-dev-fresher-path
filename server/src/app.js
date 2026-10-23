import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import express from 'express';
import { adminRouter } from './routes/admin.js';
import { authRouter } from './routes/auth.js';
import { contentRouter } from './routes/content.js';
import { progressRouter } from './routes/progress.js';
import { questionsRouter } from './routes/questions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '../../client/dist');

export function createApp() {
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required');
  }

  const app = express();
  app.use(express.json());
  app.use(cookieParser(process.env.SESSION_SECRET));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/content', contentRouter);
  app.use('/api/progress', progressRouter);
  app.use('/api/questions', questionsRouter);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(clientDist));
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  return app;
}
