import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { resetTestEnv } from "../testUtils.js";

let app;

beforeEach(() => {
  resetTestEnv();
  app = createApp();
});

describe("GET /api/content/concepts", () => {
  it("rejects a request with no session", async () => {
    const res = await request(app).get("/api/content/concepts");
    expect(res.status).toBe(401);
  });

  it("returns all concepts for a logged-in user", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({
        email: "intern@example.com",
        name: "Intern",
        password: "password123",
      });

    const res = await agent.get("/api/content/concepts");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(20);
  });
});
