import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import { getConcepts } from "../content.js";
import {
  createPrediction,
  getExplanationsForUser,
  getPrediction,
  getPredictionsForUser,
  saveExplanation,
  getProgressForUser,
  getProgressStep,
  setProgressStep,
} from "../progress.js";

export const progressRouter = Router();

const VALID_STEPS = new Set(["prove", "done"]);

progressRouter.use(requireAuth);

progressRouter.get("/", (req, res) => {
  const predictions = getPredictionsForUser(req.user.email);
  const progress = getProgressForUser(req.user.email);

  const predictionByConcept = Object.fromEntries(
    predictions.map((p) => [p.concept_id, p.text]),
  );
  const stepByConcept = Object.fromEntries(
    progress.map((p) => [p.concept_id, p.step]),
  );

  const explanationByConcept = Object.fromEntries(
    getExplanationsForUser(req.user.email).map((e) => [e.concept_id, e.text]),
  );

  res.json({
    predictions: predictionByConcept,
    steps: stepByConcept,
    explanations: explanationByConcept,
  });
});

// "Explain it back": the learner's own account of what Claude Code changed.
// Editable until the lesson is done; stored as written, like predictions.
progressRouter.post("/:conceptId/explanation", (req, res) => {
  const { conceptId } = req.params;
  const { text } = req.body;

  if (!getConcepts().some((c) => c.id === conceptId)) {
    return res.status(404).json({ error: "no such concept" });
  }
  if (typeof text !== "string" || text.trim().length < 20 || text.length > 10000) {
    return res
      .status(400)
      .json({ error: "Write at least a few sentences, in your own words." });
  }
  const current = getProgressStep(req.user.email, conceptId);
  if (current !== "prove" && current !== "done") {
    return res
      .status(400)
      .json({ error: "Finish the by-hand and Claude Code tasks first." });
  }
  saveExplanation(req.user.email, conceptId, text);
  res.status(204).end();
});

progressRouter.post("/:conceptId/prediction", (req, res) => {
  const { conceptId } = req.params;
  const { text } = req.body;

  if (!getConcepts().some((c) => c.id === conceptId)) {
    return res.status(404).json({ error: "no such concept" });
  }

  if (typeof text !== "string" || !text.trim() || text.length > 10000) {
    return res.status(400).json({ error: "prediction text is required" });
  }

  if (getPrediction(req.user.email, conceptId)) {
    return res
      .status(409)
      .json({ error: "a prediction has already been submitted" });
  }

  createPrediction(req.user.email, conceptId, text);
  setProgressStep(req.user.email, conceptId, "learn");
  res.status(201).end();
});

progressRouter.post("/:conceptId/step", (req, res) => {
  const { conceptId } = req.params;
  const { step } = req.body;

  if (!VALID_STEPS.has(step)) {
    return res
      .status(400)
      .json({ error: `step must be one of: ${[...VALID_STEPS].join(", ")}` });
  }

  if (!getConcepts().some((c) => c.id === conceptId)) {
    return res.status(404).json({ error: "no such concept" });
  }

  const current = getProgressStep(req.user.email, conceptId);
  if (!getPrediction(req.user.email, conceptId)) {
    return res
      .status(400)
      .json({ error: "Submit your prediction before continuing." });
  }
  if (step === "done" && current !== "prove" && current !== "done") {
    return res
      .status(400)
      .json({ error: "Read the lesson and continue to the task first." });
  }
  setProgressStep(req.user.email, conceptId, step);
  res.status(204).end();
});
