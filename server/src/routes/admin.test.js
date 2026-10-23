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
