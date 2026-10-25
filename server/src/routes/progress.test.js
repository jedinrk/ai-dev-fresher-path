import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { resetTestEnv } from "../testUtils.js";

let app;
let agent;

beforeEach(async () => {
  resetTestEnv();
  app = createApp();
  agent = request.agent(app);
  await agent
    .post("/api/auth/register")
    .send({
      email: "intern@example.com",
      name: "Intern",
      password: "password123",
    });
});

describe("GET /api/progress", () => {
  it("rejects a request with no session", async () => {
    const res = await request(app).get("/api/progress");
    expect(res.status).toBe(401);
  });

  it("returns empty predictions/steps for a fresh user", async () => {
    const res = await agent.get("/api/progress");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ predictions: {}, steps: {}, explanations: {} });
  });
});

describe("POST /api/progress/:conceptId/prediction", () => {
  it("saves a prediction and advances the step to learn", async () => {
    const res = await agent
      .post("/api/progress/L01/prediction")
      .send({ text: "My guess about terminals." });
    expect(res.status).toBe(201);

    const progress = await agent.get("/api/progress");
    expect(progress.body.predictions.L01).toBe("My guess about terminals.");
    expect(progress.body.steps.L01).toBe("learn");
  });

  it("rejects a second prediction for the same concept", async () => {
    await agent
      .post("/api/progress/L01/prediction")
      .send({ text: "First guess." });
    const res = await agent
      .post("/api/progress/L01/prediction")
      .send({ text: "Changed my mind." });

    expect(res.status).toBe(409);

    const progress = await agent.get("/api/progress");
    expect(progress.body.predictions.L01).toBe("First guess.");
  });

  it("rejects an empty prediction", async () => {
    const res = await agent
      .post("/api/progress/L01/prediction")
      .send({ text: "   " });
    expect(res.status).toBe(400);
  });

  it("rejects an unknown concept id", async () => {
    const res = await agent
      .post("/api/progress/F99/prediction")
      .send({ text: "Guess." });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/progress/:conceptId/explanation", () => {
  it("stores the learner's explanation once the task stage is reached, and returns it with progress", async () => {
    const text = "server.js gained a PATCH route; db.js holds the prepared statements.";
    expect((await agent.post("/api/progress/NOPE/explanation").send({ text })).status).toBe(404);
    expect((await agent.post("/api/progress/L12/explanation").send({ text })).status).toBe(400);
    await agent.post("/api/progress/L12/prediction").send({ text: "Guess." });
    expect((await agent.post("/api/progress/L12/explanation").send({ text })).status).toBe(400);
    await agent.post("/api/progress/L12/step").send({ step: "prove" });
    expect((await agent.post("/api/progress/L12/explanation").send({ text: "short" })).status).toBe(400);
    expect((await agent.post("/api/progress/L12/explanation").send({ text })).status).toBe(204);
    expect((await agent.post("/api/progress/L12/explanation").send({ text: text + " Updated." })).status).toBe(204);
    const progress = await agent.get("/api/progress");
    expect(progress.body.explanations.L12).toBe(text + " Updated.");
  });
});

describe("POST /api/progress/:conceptId/step", () => {
  it("advances the step and does not regress it", async () => {
    await agent.post("/api/progress/L01/prediction").send({ text: "Guess." });
    await agent.post("/api/progress/L01/step").send({ step: "prove" });
    await agent.post("/api/progress/L01/step").send({ step: "done" });

    let progress = await agent.get("/api/progress");
    expect(progress.body.steps.L01).toBe("done");

    await agent.post("/api/progress/L01/step").send({ step: "prove" });
    progress = await agent.get("/api/progress");
    expect(progress.body.steps.L01).toBe("done");
  });

  it("rejects an invalid step value", async () => {
    const res = await agent
      .post("/api/progress/L01/step")
      .send({ step: "predict" });
    expect(res.status).toBe(400);
  });
});
