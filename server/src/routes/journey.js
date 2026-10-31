import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth/middleware.js";
import { findUserByEmail, listUsers } from "../auth/users.js";
import { getProgram } from "../content.js";
import { getDb } from "../db.js";
import {
  getExplanationsForUser,
  getPredictionsForUser,
  getProgressForUser,
} from "../progress.js";

import { cohortFor, learningActivity, recordReview } from "../mentorship.js";
import { getQuestionsForUser } from "../questions.js";

export const journeyRouter = Router();
journeyRouter.use(requireAuth);

function reviewFor(email, week) {
  return getDb()
    .prepare(
      "SELECT * FROM journey_reviews WHERE user_email = ? AND version = ? AND week = ?",
    )
    .get(email, getProgram().version, week);
}

function weeksFor(email) {
  const done = new Set(
    getProgressForUser(email)
      .filter((p) => p.step === "done")
      .map((p) => p.concept_id),
  );
  return getProgram().weeks.map((week) => {
    const review = reviewFor(email, week.number);
    return {
      week: week.number,
      completed: week.ids.filter((id) => done.has(id)).length,
      total: week.ids.length,
      ready: week.ids.every((id) => done.has(id)),
      review: review
        ? {
            status: review.status,
            evidenceUrl: review.evidence_url,
            summary: review.summary,
            mentorNotes: review.mentor_notes,
            submittedAt: review.submitted_at,
            reviewedAt: review.reviewed_at,
          }
        : null,
    };
  });
}

journeyRouter.get("/", (req, res) => {
  // Legacy approvals remain attached to their original foundation mapping.
  const legacy = getDb()
    .prepare(
      "SELECT week, mentor_notes AS mentorNotes, signed_off_at AS signedOffAt FROM checkpoints WHERE user_email = ? AND signed_off_at IS NOT NULL",
    )
    .all(req.user.email);
  res.json({
    version: getProgram().version,
    weeks: weeksFor(req.user.email),
    legacy,
  });
});

journeyRouter.post("/weeks/:week", (req, res) => {
  if (req.user.role !== "intern")
    return res
      .status(403)
      .json({ error: "Project submissions are for learner accounts." });
  const week = Number(req.params.week);
  const state = weeksFor(req.user.email).find((w) => w.week === week);
  if (!state) return res.status(404).json({ error: "No such week." });
  if (!state.ready)
    return res.status(400).json({
      error: "Complete this week’s lessons before requesting review.",
    });
  if (state.review && state.review.status !== "changes_requested") {
    return res
      .status(409)
      .json({ error: "This checkpoint is already submitted or signed off." });
  }
  const { evidenceUrl, summary } = req.body;
  if (
    typeof summary !== "string" ||
    summary.trim().length < 20 ||
    summary.length > 10000
  ) {
    return res.status(400).json({
      error: "Describe your work and verification in 20–10,000 characters.",
    });
  }
  try {
    if (typeof evidenceUrl !== "string" || evidenceUrl.length > 2000)
      throw new Error();
    const url = new URL(evidenceUrl);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error();
  } catch {
    return res.status(400).json({
      error:
        "Add a valid http or https link to your repository, PR, or handover.",
    });
  }
  getDb().transaction(() => {
    getDb()
      .prepare(
        `INSERT INTO journey_reviews (user_email, version, week, evidence_url, summary, status)
    VALUES (?, ?, ?, ?, ?, 'submitted')
    ON CONFLICT(user_email, version, week) DO UPDATE SET evidence_url = excluded.evidence_url,
    summary = excluded.summary, status = 'submitted', submitted_at = datetime('now'), reviewed_at = NULL`,
      )
      .run(
        req.user.email,
        getProgram().version,
        week,
        evidenceUrl.trim(),
        summary.trim(),
      );
    recordReview(
      req.user.email,
      getProgram().version,
      week,
      "submitted",
      evidenceUrl.trim(),
      summary.trim(),
      "",
    );
  })();
  res.status(201).json({ weeks: weeksFor(req.user.email) });
});

journeyRouter.get("/reviews", requireAdmin, (req, res) => {
  res.json(
    listUsers()
      .filter((u) => u.role === "intern")
      .map((user) => ({
        email: user.email,
        name: user.name,
        cohort: cohortFor(user.email),
        lastLearningActivity: learningActivity(user.email),
        questionCount: getQuestionsForUser(user.email).filter(
          (q) => !q.answer && q.flagged,
        ).length,
        weeks: weeksFor(user.email),
        predictions: getPredictionsForUser(user.email),
        explanations: getExplanationsForUser(user.email),
      })),
  );
});

journeyRouter.get("/learners/:email", requireAdmin, (req, res) => {
  const user = findUserByEmail(req.params.email);
  if (!user || user.role !== "intern")
    return res.status(404).json({ error: "Learner not found." });
  const email = user.email;
  res.json({
    email,
    name: user.name,
    joinedAt: user.created_at,
    cohort: cohortFor(email),
    lastLearningActivity: learningActivity(email),
    weeks: weeksFor(email),
    progress: getDb()
      .prepare(
        "SELECT concept_id, step, updated_at FROM progress WHERE user_email = ?",
      )
      .all(email),
    predictions: getDb()
      .prepare(
        "SELECT concept_id, text, created_at FROM predictions WHERE user_email = ?",
      )
      .all(email),
    explanations: getExplanationsForUser(email),
    questions: getQuestionsForUser(email).map((q) => ({
      id: q.id,
      conceptId: q.concept_id,
      questionText: q.question_text,
      answer: q.answer,
      createdAt: q.created_at,
      answeredAt: q.answered_at,
      flagged: Boolean(q.flagged),
    })),
    history: getDb()
      .prepare(
        "SELECT * FROM review_history WHERE user_email = ? AND version = ? ORDER BY id DESC",
      )
      .all(email, getProgram().version),
    legacy: getDb()
      .prepare(
        "SELECT week, mentor_notes AS mentorNotes, signed_off_at AS signedOffAt FROM checkpoints WHERE user_email = ? AND signed_off_at IS NOT NULL",
      )
      .all(email),
  });
});

journeyRouter.post("/reviews/:email/:week", requireAdmin, (req, res) => {
  const { email } = req.params;
  const week = Number(req.params.week);
  if (findUserByEmail(email)?.role !== "intern")
    return res.status(404).json({ error: "No such learner." });
  const current = reviewFor(email, week);
  if (!current || current.status !== "submitted")
    return res
      .status(409)
      .json({ error: "This checkpoint is not awaiting review." });
  const { status, notes } = req.body;
  if (
    !["approved", "changes_requested"].includes(status) ||
    typeof notes !== "string" ||
    notes.length > 10000
  ) {
    return res
      .status(400)
      .json({ error: "Choose a review outcome and valid feedback." });
  }
  if (status === "changes_requested" && !notes.trim())
    return res
      .status(400)
      .json({ error: "Explain what the learner should improve." });
  getDb().transaction(() => {
    getDb()
      .prepare(
        `UPDATE journey_reviews SET status = ?, mentor_notes = ?, reviewed_at = datetime('now')
    WHERE user_email = ? AND version = ? AND week = ?`,
      )
      .run(status, notes.trim(), email, getProgram().version, week);
    recordReview(
      email,
      getProgram().version,
      week,
      status,
      current.evidence_url,
      current.summary,
      notes.trim(),
    );
  })();
  res.status(204).end();
});
