import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { resetTestEnv } from '../testUtils.js';

let app;

async function registerAndLogin(agent, email, name) {
  await agent.post('/api/auth/register').send({ email, name, password: 'password123' });
}

beforeEach(() => {
  resetTestEnv();
  app = createApp();
});

describe('GET /api/admin/users', () => {
  it('rejects a request with no session', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('rejects a non-mentor user', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, 'intern@example.com', 'Intern');

    const res = await agent.get('/api/admin/users');
    expect(res.status).toBe(403);
  });

  it('lists users for the mentor', async () => {
    const internAgent = request.agent(app);
    await registerAndLogin(internAgent, 'intern@example.com', 'Intern');

    const mentorAgent = request.agent(app);
    await registerAndLogin(mentorAgent, 'mentor@example.com', 'Mentor');

    const res = await mentorAgent.get('/api/admin/users');
    expect(res.status).toBe(200);
    expect(res.body.map((u) => u.email).sort()).toEqual([
      'intern@example.com',
      'mentor@example.com',
    ]);
    expect(res.body[0]).not.toHaveProperty('password_hash');
  });
});

describe('DELETE /api/admin/users/:email', () => {
  it('lets the mentor reset another user, allowing re-registration', async () => {
    const internAgent = request.agent(app);
    await registerAndLogin(internAgent, 'intern@example.com', 'Intern');

    const mentorAgent = request.agent(app);
    await registerAndLogin(mentorAgent, 'mentor@example.com', 'Mentor');

    const deleteRes = await mentorAgent.delete('/api/admin/users/intern@example.com');
    expect(deleteRes.status).toBe(204);

    const reRegisterRes = await request(app).post('/api/auth/register').send({
      email: 'intern@example.com',
      name: 'Intern',
      password: 'newpassword123',
    });
    expect(reRegisterRes.status).toBe(201);
  });

  it('does not let the mentor reset their own account', async () => {
    const mentorAgent = request.agent(app);
    await registerAndLogin(mentorAgent, 'mentor@example.com', 'Mentor');

    const res = await mentorAgent.delete('/api/admin/users/mentor@example.com');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/admin/checkpoints', () => {
  it('reports week 1 gate as failed until F1-F3 are all done', async () => {
    const internAgent = request.agent(app);
    await registerAndLogin(internAgent, 'intern@example.com', 'Intern');
    await internAgent.post('/api/progress/F1/prediction').send({ text: 'Guess.' });
    await internAgent.post('/api/progress/F1/step').send({ step: 'done' });

    const mentorAgent = request.agent(app);
    await registerAndLogin(mentorAgent, 'mentor@example.com', 'Mentor');

    const res = await mentorAgent.get('/api/admin/checkpoints');
    expect(res.status).toBe(200);

    const intern = res.body.find((u) => u.email === 'intern@example.com');
    const week1 = intern.weeks.find((w) => w.week === 1);
    expect(week1.gatePassed).toBe(false);
    expect(week1.signedOffAt).toBeNull();
  });

  it('reports week 1 gate as passed once F1-F3 are all done', async () => {
    const internAgent = request.agent(app);
    await registerAndLogin(internAgent, 'intern@example.com', 'Intern');
    for (const conceptId of ['F1', 'F2', 'F3']) {
      await internAgent.post(`/api/progress/${conceptId}/prediction`).send({ text: 'Guess.' });
      await internAgent.post(`/api/progress/${conceptId}/step`).send({ step: 'done' });
    }

    const mentorAgent = request.agent(app);
    await registerAndLogin(mentorAgent, 'mentor@example.com', 'Mentor');

    const res = await mentorAgent.get('/api/admin/checkpoints');
    const intern = res.body.find((u) => u.email === 'intern@example.com');
    const week1 = intern.weeks.find((w) => w.week === 1);
    expect(week1.gatePassed).toBe(true);
  });

  it('does not list the mentor among the interns', async () => {
    const mentorAgent = request.agent(app);
    await registerAndLogin(mentorAgent, 'mentor@example.com', 'Mentor');

    const res = await mentorAgent.get('/api/admin/checkpoints');
    expect(res.body.some((u) => u.email === 'mentor@example.com')).toBe(false);
  });
});

describe('POST /api/admin/checkpoints/:email/:week', () => {
  it('rejects sign-off before the gate is passed', async () => {
    const internAgent = request.agent(app);
    await registerAndLogin(internAgent, 'intern@example.com', 'Intern');

    const mentorAgent = request.agent(app);
    await registerAndLogin(mentorAgent, 'mentor@example.com', 'Mentor');

    const res = await mentorAgent
      .post('/api/admin/checkpoints/intern@example.com/1')
      .send({ notes: 'Looks good' });
    expect(res.status).toBe(400);
  });

  it('signs off once the gate is passed', async () => {
    const internAgent = request.agent(app);
    await registerAndLogin(internAgent, 'intern@example.com', 'Intern');
    for (const conceptId of ['F1', 'F2', 'F3']) {
      await internAgent.post(`/api/progress/${conceptId}/prediction`).send({ text: 'Guess.' });
      await internAgent.post(`/api/progress/${conceptId}/step`).send({ step: 'done' });
    }

    const mentorAgent = request.agent(app);
    await registerAndLogin(mentorAgent, 'mentor@example.com', 'Mentor');

    const signOffRes = await mentorAgent
      .post('/api/admin/checkpoints/intern@example.com/1')
      .send({ notes: 'Great work' });
    expect(signOffRes.status).toBe(204);

    const checkpoints = await mentorAgent.get('/api/admin/checkpoints');
    const week1 = checkpoints.body
      .find((u) => u.email === 'intern@example.com')
      .weeks.find((w) => w.week === 1);
    expect(week1.signedOffAt).toBeTruthy();
    expect(week1.mentorNotes).toBe('Great work');
  });

  it('rejects a non-mentor', async () => {
    const internAgent = request.agent(app);
    await registerAndLogin(internAgent, 'intern@example.com', 'Intern');

    const res = await internAgent
      .post('/api/admin/checkpoints/intern@example.com/1')
      .send({ notes: 'nope' });
    expect(res.status).toBe(403);
  });
});
