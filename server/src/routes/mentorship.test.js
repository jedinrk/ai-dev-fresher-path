import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { resetTestEnv } from "../testUtils.js";
import { getDb } from "../db.js";
import { getProgram } from "../content.js";

let app, mentor, learner;
beforeEach(async () => {
  resetTestEnv();
  app = createApp();
  mentor = request.agent(app);
  learner = request.agent(app);
  await mentor
    .post("/api/auth/register")
    .send({
      email: "mentor@example.com",
      name: "Mentor",
      password: "password123",
    });
  await learner
    .post("/api/auth/register")
    .send({
      email: "intern@example.com",
      name: "Learner",
      password: "password123",
    });
});

describe("mentor profiles and people administration", () => {
  it("protects all new data and mutations from unauthenticated and learner sessions", async () => {
    for (const url of [
      "/api/admin/cohorts",
      "/api/admin/people",
      "/api/admin/login-activity",
      "/api/journey/learners/intern@example.com",
    ]) {
      expect((await request(app).get(url)).status).toBe(401);
      expect((await learner.get(url)).status).toBe(403);
    }
    expect(
      (await learner.post("/api/admin/cohorts").send({ name: "Secret" }))
        .status,
    ).toBe(403);
    expect(
      (await mentor.get("/api/journey/learners/mentor@example.com")).status,
    ).toBe(404);
    expect(
      (await mentor.get("/api/journey/learners/missing@example.com")).status,
    ).toBe(404);
  });

  it("creates cohorts, assigns existing and invited learners, and preserves membership on role-only updates", async () => {
    expect((await mentor.get("/api/admin/cohorts")).body[0].name).toBe(
      "Current cohort",
    );
    const created = await mentor
      .post("/api/admin/cohorts")
      .send({ name: "November 2026" });
    expect(created.status).toBe(201);
    const cohortId = created.body.id;
    expect(
      (await mentor.post("/api/admin/cohorts").send({ name: "november 2026" }))
        .status,
    ).toBe(409);
    expect(
      (await mentor.post("/api/admin/cohorts").send({ name: " " })).status,
    ).toBe(400);
    expect(
      (
        await mentor
          .post("/api/admin/allowlist")
          .send({ email: "intern@example.com", role: "intern", cohortId: 999 })
      ).status,
    ).toBe(400);
    expect(
      (
        await mentor
          .post("/api/admin/allowlist")
          .send({ email: "intern@example.com", role: "intern", cohortId })
      ).status,
    ).toBe(200);
    await mentor
      .post("/api/admin/allowlist")
      .send({ email: "intern@example.com", role: "intern" });
    expect(
      (await mentor.get("/api/journey/learners/intern@example.com")).body.cohort
        .id,
    ).toBe(cohortId);
    await mentor
      .post("/api/admin/allowlist")
      .send({ email: "new@example.com", role: "intern", cohortId });
    let invited = (await mentor.get("/api/admin/people")).body.find(
      (p) => p.email === "new@example.com",
    );
    expect(invited).toMatchObject({
      cohortId,
      registeredAt: null,
      lastLogin: null,
    });
    await request(app)
      .post("/api/auth/register")
      .send({ email: "new@example.com", name: "New", password: "password123" });
    invited = (await mentor.get("/api/admin/people")).body.find(
      (p) => p.email === "new@example.com",
    );
    expect(invited.registeredAt).toBeTruthy();
    expect(invited.cohortId).toBe(cohortId);
  });

  it("returns exact saved responses, lesson stages and answered question context in a learner profile", async () => {
    const text = "  My initial guess.\nKeep this exact.  ";
    await learner.post("/api/progress/L01/prediction").send({ text });
    await learner
      .post("/api/questions")
      .send({ text: "Which tool runs this?", conceptId: "L01" });
    const q = (await learner.get("/api/questions")).body[0];
    await mentor
      .post(`/api/admin/questions/${q.id}/answer`)
      .send({ answer: "Node runs it." });
    expect(
      (
        await learner
          .post("/api/questions")
          .send({ text: "Hi", conceptId: "unknown" })
      ).status,
    ).toBe(400);
    const profile = (
      await mentor.get("/api/journey/learners/intern@example.com")
    ).body;
    expect(profile.predictions[0].text).toBe(text);
    expect(profile.progress[0]).toMatchObject({
      concept_id: "L01",
      step: "learn",
    });
    expect(profile.questions[0]).toMatchObject({
      conceptId: "L01",
      answer: "Node runs it.",
      flagged: false,
    });
    expect(profile.lastLearningActivity).toBeTruthy();
    expect(JSON.stringify(profile)).not.toMatch(
      /password_hash|wrong_flag|session/,
    );
    expect(
      (await mentor.get("/api/journey/reviews")).body[0].questionCount,
    ).toBe(0);
  });

  it("records sign-in outcomes, filters the audit, and preserves last-mentor and revoked-access protection", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({ email: "intern@example.com", password: "wrong" });
    await request(app)
      .post("/api/auth/login")
      .send({ email: "intern@example.com", password: "password123" });
    expect(
      (await mentor.delete("/api/admin/allowlist/mentor@example.com")).status,
    ).toBe(400);
    expect(
      (
        await mentor
          .post("/api/admin/allowlist")
          .send({ email: "mentor@example.com", role: "intern" })
      ).status,
    ).toBe(400);
    await mentor.delete("/api/admin/allowlist/intern@example.com");
    expect((await learner.get("/api/journey")).status).toBe(401);
    await request(app)
      .post("/api/auth/login")
      .send({ email: "intern@example.com", password: "password123" });
    const events = (
      await mentor.get("/api/admin/login-activity?email=intern%40example.com")
    ).body;
    expect(events.map((e) => e.outcome)).toEqual([
      "denied",
      "success",
      "failed",
      "registered",
    ]);
    expect(events.every((e) => e.email === "intern@example.com")).toBe(true);
    expect(JSON.stringify(events)).not.toMatch(/password|cookie|token/);
    expect(
      (await mentor.get("/api/journey/learners/intern@example.com")).status,
    ).toBe(200);
  });

  it("retains the evidence and feedback for each revision cycle", async () => {
    for (const id of getProgram().weeks[0].ids)
      getDb()
        .prepare(
          "INSERT INTO progress (user_email, concept_id, step) VALUES ('intern@example.com', ?, 'done')",
        )
        .run(id);
    const submission = {
      evidenceUrl: "https://example.com/first",
      summary: "First submission with evidence and verification.",
    };
    await learner.post("/api/journey/weeks/1").send(submission);
    await mentor
      .post("/api/journey/reviews/intern@example.com/1")
      .send({ status: "changes_requested", notes: "Add a restart test." });
    await learner
      .post("/api/journey/weeks/1")
      .send({ ...submission, evidenceUrl: "https://example.com/revised" });
    await mentor
      .post("/api/journey/reviews/intern@example.com/1")
      .send({ status: "approved", notes: "Verified." });
    const { history, weeks } = (
      await mentor.get("/api/journey/learners/intern@example.com")
    ).body;
    expect(history.map((h) => h.event)).toEqual([
      "approved",
      "submitted",
      "changes_requested",
      "submitted",
    ]);
    expect(history[2]).toMatchObject({
      evidence_url: submission.evidenceUrl,
      mentor_notes: "Add a restart test.",
    });
    expect(weeks[0].review.status).toBe("approved");
  });
});
