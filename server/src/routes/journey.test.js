import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { resetTestEnv } from "../testUtils.js";
import { getProgram } from "../content.js";
import { getDb } from "../db.js";

let app, learner, mentor;
const evidence = {
  evidenceUrl: "https://github.com/example/practice",
  summary: "I built a task list and checked empty input and task completion.",
};

beforeEach(async () => {
  resetTestEnv();
  app = createApp();
  learner = request.agent(app);
  mentor = request.agent(app);
  await learner.post("/api/auth/register").send({
    email: "intern@example.com",
    name: "Learner",
    password: "password123",
  });
  await mentor.post("/api/auth/register").send({
    email: "mentor@example.com",
    name: "Mentor",
    password: "password123",
  });
});

async function completeWeek() {
  for (const id of getProgram().weeks[0].ids) {
    expect(
      (
        await learner
          .post(`/api/progress/${id}/prediction`)
          .send({ text: "My own starting thought." })
      ).status,
    ).toBe(201);
    expect(
      (await learner.post(`/api/progress/${id}/step`).send({ step: "prove" }))
        .status,
    ).toBe(204);
    expect(
      (await learner.post(`/api/progress/${id}/step`).send({ step: "done" }))
        .status,
    ).toBe(204);
  }
}

describe("expanded roadmap reviews", () => {
  it("requires a session and restricts review actions to mentors", async () => {
    expect(
      (await mentor.post("/api/journey/weeks/1").send(evidence)).status,
    ).toBe(403);
    expect((await request(app).get("/api/journey")).status).toBe(401);
    expect((await learner.get("/api/journey/reviews")).status).toBe(403);
    expect(
      (
        await learner
          .post("/api/journey/reviews/intern@example.com/1")
          .send({ status: "approved", notes: "" })
      ).status,
    ).toBe(403);
    expect((await request(app).get("/api/content/program")).status).toBe(401);
  });

  it("starts at zero and does not accept a forged identity or unfinished submission", async () => {
    const state = (await learner.get("/api/journey")).body;
    expect(state.weeks[0]).toMatchObject({
      completed: 0,
      total: getProgram().weeks[0].ids.length,
      ready: false,
      review: null,
    });
    expect(
      (
        await learner
          .post("/api/journey/weeks/1")
          .send({ ...evidence, userEmail: "mentor@example.com" })
      ).status,
    ).toBe(400);
    expect(
      (await learner.post("/api/journey/weeks/99").send(evidence)).status,
    ).toBe(404);
  });

  it("enforces prediction and lesson stages on the server", async () => {
    expect(
      (await learner.post("/api/progress/L01/step").send({ step: "done" }))
        .status,
    ).toBe(400);
    expect(
      (await learner.post("/api/progress/L01/step").send({ step: "prove" }))
        .status,
    ).toBe(400);
    const text = "  My thought, exactly as written.\n";
    await learner.post("/api/progress/L01/prediction").send({ text });
    expect(
      (await learner.post("/api/progress/L01/step").send({ step: "done" }))
        .status,
    ).toBe(400);
    expect((await learner.get("/api/progress")).body.predictions.L01).toBe(text);
    expect(
      (
        await learner
          .post("/api/progress/L01/prediction")
          .send({ text: "Replacement" })
      ).status,
    ).toBe(409);
    expect(
      (await learner.post("/api/progress/L02/prediction").send({ text: {} }))
        .status,
    ).toBe(400);
  });

  it("validates evidence and completes the revision and sign-off cycle", async () => {
    await completeWeek();
    for (const evidenceUrl of [
      "javascript:alert(1)",
      "file:///tmp/test",
      "https://name:secret@example.com",
      {},
    ]) {
      expect(
        (
          await learner
            .post("/api/journey/weeks/1")
            .send({ ...evidence, evidenceUrl })
        ).status,
      ).toBe(400);
    }
    expect(
      (
        await learner
          .post("/api/journey/weeks/1")
          .send({ ...evidence, summary: "short" })
      ).status,
    ).toBe(400);
    expect(
      (
        await learner
          .post("/api/journey/weeks/1")
          .send({ ...evidence, userEmail: "mentor@example.com" })
      ).status,
    ).toBe(201);
    expect((await mentor.get("/api/journey")).body.weeks[0].review).toBeNull();
    expect(
      (await learner.post("/api/journey/weeks/1").send(evidence)).status,
    ).toBe(409);
    const queue = (await mentor.get("/api/journey/reviews")).body;
    expect(queue[0].weeks[0].review.status).toBe("submitted");
    expect(queue[0].predictions).toHaveLength(getProgram().weeks[0].ids.length);
    expect(
      (
        await mentor
          .post("/api/journey/reviews/intern@example.com/1")
          .send({ status: "changes_requested", notes: "" })
      ).status,
    ).toBe(400);
    expect(
      (
        await mentor.post("/api/journey/reviews/intern@example.com/1").send({
          status: "changes_requested",
          notes: "Show the empty-input test.",
        })
      ).status,
    ).toBe(204);
    expect(
      (await learner.get("/api/journey")).body.weeks[0].review,
    ).toMatchObject({
      status: "changes_requested",
      mentorNotes: "Show the empty-input test.",
    });
    expect(
      (await learner.post("/api/journey/weeks/1").send(evidence)).status,
    ).toBe(201);
    expect(
      (
        await mentor.post("/api/journey/reviews/intern@example.com/1").send({
          status: "approved",
          notes: "Behavior and explanation checked.",
        })
      ).status,
    ).toBe(204);
    expect(
      (await learner.get("/api/journey")).body.weeks[0].review.status,
    ).toBe("approved");
    expect(
      (await learner.post("/api/journey/weeks/1").send(evidence)).status,
    ).toBe(409);
  });

  it("preserves old approvals without treating them as new project sign-offs", async () => {
    getDb()
      .prepare(
        "INSERT INTO checkpoints (user_email, week, mentor_notes, signed_off_at) VALUES (?, 1, 'Original approval', '2026-01-01')",
      )
      .run("intern@example.com");
    const state = (await learner.get("/api/journey")).body;
    expect(state.legacy[0].mentorNotes).toBe("Original approval");
    expect(state.weeks[0].review).toBeNull();
    expect(state.weeks[0].ready).toBe(false);
  });

  it("shows the learner's explanations to the mentor alongside predictions", async () => {
    await learner.post("/api/progress/L12/prediction").send({ text: "Guess." });
    await learner.post("/api/progress/L12/step").send({ step: "prove" });
    await learner
      .post("/api/progress/L12/explanation")
      .send({ text: "db.js now owns every SQL statement with ? placeholders." });
    const reviews = (await mentor.get("/api/journey/reviews")).body;
    const me = reviews.find((r) => r.email === "intern@example.com");
    expect(me.explanations).toEqual([
      expect.objectContaining({ concept_id: "L12", text: "db.js now owns every SQL statement with ? placeholders." }),
    ]);
    expect((await learner.get("/api/journey/reviews")).status).toBe(403);
  });

  it("keeps mentor-only flags private and rechecks the allowlist", async () => {
    await learner
      .post("/api/progress/L01/prediction")
      .send({ text: "My thought." });
    await mentor
      .patch("/api/admin/predictions/intern@example.com/L01")
      .send({ wrongFlag: true });
    const state = (await learner.get("/api/journey")).body;
    expect(JSON.stringify(state)).not.toMatch(
      /wrong_flag|wrongFlag|intern@example/,
    );
    process.env.ALLOWLIST_EMAILS = "mentor@example.com";
    expect((await learner.get("/api/journey")).status).toBe(401);
    expect(
      (await learner.post("/api/journey/weeks/1").send(evidence)).status,
    ).toBe(401);
  });
});
