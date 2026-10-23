import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { resetTestEnv } from '../testUtils.js';

let app;
let agent;

beforeEach(async () => {
  resetTestEnv();
  app = createApp();
  agent = request.agent(app);
  await agent
    .post('/api/auth/register')
    .send({ email: 'intern@example.com', name: 'Intern', password: 'password123' });
});

describe('GET /api/questions', () => {
  it('rejects a request with no session', async () => {
    const res = await request(app).get('/api/questions');
    expect(res.status).toBe(401);
  });

  it('returns an empty list for a fresh user', async () => {
    const res = await agent.get('/api/questions');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /api/questions', () => {
  it('logs a question with no answer yet', async () => {
    const postRes = await agent.post('/api/questions').send({ text: 'What is a lockfile?' });
    expect(postRes.status).toBe(201);

    const listRes = await agent.get('/api/questions');
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0]).toMatchObject({
      questionText: 'What is a lockfile?',
      answer: null,
      answeredAt: null,
    });
  });

  it('rejects an empty question', async () => {
    const res = await agent.post('/api/questions').send({ text: '   ' });
    expect(res.status).toBe(400);
  });

  it("does not leak one user's questions to another", async () => {
    await agent.post('/api/questions').send({ text: 'Intern question.' });

    const mentorAgent = request.agent(app);
    await mentorAgent
      .post('/api/auth/register')
      .send({ email: 'mentor@example.com', name: 'Mentor', password: 'password123' });

    const res = await mentorAgent.get('/api/questions');
    expect(res.body).toEqual([]);
  });
});
