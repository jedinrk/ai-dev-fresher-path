import { beforeEach, describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { resetTestEnv } from './testUtils.js';

beforeEach(() => {
  resetTestEnv();
});

describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
