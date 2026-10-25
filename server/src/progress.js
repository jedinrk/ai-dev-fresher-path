import { getDb } from './db.js';
import { WEEK_CONCEPTS } from './weeks.js';

const STEP_ORDER = ['predict', 'learn', 'prove', 'done'];

export function getPrediction(userEmail, conceptId) {
  return getDb()
    .prepare('SELECT * FROM predictions WHERE user_email = ? AND concept_id = ?')
    .get(userEmail, conceptId);
}

export function createPrediction(userEmail, conceptId, text) {
  getDb()
    .prepare(
      'INSERT INTO predictions (user_email, concept_id, text) VALUES (?, ?, ?)',
    )
    .run(userEmail, conceptId, text);
}

export function getProgressForUser(userEmail) {
  return getDb()
    .prepare('SELECT concept_id, step FROM progress WHERE user_email = ?')
    .all(userEmail);
}

export function getProgressStep(userEmail, conceptId) {
  const row = getDb()
    .prepare('SELECT step FROM progress WHERE user_email = ? AND concept_id = ?')
    .get(userEmail, conceptId);
  return row?.step;
}

export function setProgressStep(userEmail, conceptId, step) {
  const current = getProgressStep(userEmail, conceptId);
  if (current && STEP_ORDER.indexOf(step) <= STEP_ORDER.indexOf(current)) {
    return;
  }

  getDb()
    .prepare(
      `INSERT INTO progress (user_email, concept_id, step, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT (user_email, concept_id)
       DO UPDATE SET step = excluded.step, updated_at = excluded.updated_at`,
    )
    .run(userEmail, conceptId, step);
}

export function setWrongFlag(userEmail, conceptId, wrongFlag) {
  getDb()
    .prepare(
      'UPDATE predictions SET wrong_flag = ? WHERE user_email = ? AND concept_id = ?',
    )
    .run(wrongFlag ? 1 : 0, userEmail, conceptId);
}

export function getPredictionsForUser(userEmail) {
  return getDb()
    .prepare('SELECT concept_id, text FROM predictions WHERE user_email = ?')
    .all(userEmail);
}

export function getExplanationsForUser(userEmail) {
  return getDb()
    .prepare('SELECT concept_id, text, updated_at FROM explanations WHERE user_email = ?')
    .all(userEmail);
}

export function saveExplanation(userEmail, conceptId, text) {
  getDb()
    .prepare(
      `INSERT INTO explanations (user_email, concept_id, text, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT (user_email, concept_id)
       DO UPDATE SET text = excluded.text, updated_at = excluded.updated_at`,
    )
    .run(userEmail, conceptId, text);
}

export function gateStatusForWeek(userEmail, week) {
  const conceptIds = WEEK_CONCEPTS[week] || [];
  const progress = getProgressForUser(userEmail);
  const doneIds = new Set(progress.filter((p) => p.step === 'done').map((p) => p.concept_id));
  return conceptIds.every((id) => doneIds.has(id));
}

export function getCheckpoint(userEmail, week) {
  return getDb()
    .prepare('SELECT * FROM checkpoints WHERE user_email = ? AND week = ?')
    .get(userEmail, week);
}

export function signOffCheckpoint(userEmail, week, notes) {
  getDb()
    .prepare(
      `INSERT INTO checkpoints (user_email, week, mentor_notes, signed_off_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT (user_email, week)
       DO UPDATE SET mentor_notes = excluded.mentor_notes, signed_off_at = excluded.signed_off_at`,
    )
    .run(userEmail, week, notes || null);
}
