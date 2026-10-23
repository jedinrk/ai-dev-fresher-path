import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { resetTestEnv } from '../testUtils.js';

let app;

beforeEach(() => {
  resetTestEnv();
  app = createApp();
});

describe('POST /api/auth/register', () => {
  it('rejects an email that is not on the allowlist', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'stranger@example.com',
      name: 'Stranger',
      password: 'password123',
    });

    expect(res.status).toBe(403);
  });

  it('registers an allowlisted email and starts a session', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'intern@example.com',
      name: 'Intern',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      email: 'intern@example.com',
      name: 'Intern',
      role: 'intern',
    });
    expect(res.headers['set-cookie'][0]).toMatch(/^session=/);
  });

  it('assigns the mentor role to the configured mentor email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'mentor@example.com',
      name: 'Mentor',
      password: 'password123',
    });

    expect(res.body.role).toBe('mentor');
  });

  it('rejects a second registration for the same email', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      email: 'intern@example.com',
      name: 'Intern',
      password: 'password123',
    });

    const res = await agent.post('/api/auth/register').send({
      email: 'intern@example.com',
      name: 'Intern Again',
      password: 'password123',
    });

    expect(res.status).toBe(409);
  });

  it('rejects a password shorter than 8 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'intern@example.com',
      name: 'Intern',
      password: 'short',
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login and GET /api/auth/me', () => {
  it('logs in with the correct password and resolves /me', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      email: 'intern@example.com',
      name: 'Intern',
      password: 'password123',
    });
    await agent.post('/api/auth/logout');

    const loginRes = await agent.post('/api/auth/login').send({
      email: 'intern@example.com',
      password: 'password123',
    });
    expect(loginRes.status).toBe(200);

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe('intern@example.com');
  });

  it('rejects an incorrect password', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'intern@example.com',
      name: 'Intern',
      password: 'password123',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'intern@example.com',
      password: 'wrong-password',
    });

    expect(res.status).toBe(401);
  });

  it('returns 401 from /me with no session', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the session so /me is no longer authenticated', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      email: 'intern@example.com',
      name: 'Intern',
      password: 'password123',
    });

    await agent.post('/api/auth/logout');
    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(401);
  });
});
