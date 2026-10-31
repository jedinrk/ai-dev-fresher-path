import { getDb } from "./db.js";

export function listCohorts() {
  return getDb()
    .prepare("SELECT id, name, created_at FROM cohorts ORDER BY id")
    .all();
}

export function cohortFor(email) {
  return (
    getDb()
      .prepare(
        "SELECT c.id, c.name FROM cohorts c JOIN cohort_members m ON m.cohort_id = c.id WHERE m.user_email = ?",
      )
      .get(email) || null
  );
}

export function assignCohort(email, cohortId) {
  getDb()
    .prepare(
      `INSERT INTO cohort_members (user_email, cohort_id) VALUES (?, ?)
    ON CONFLICT(user_email) DO UPDATE SET cohort_id = excluded.cohort_id`,
    )
    .run(email, cohortId);
}

export function recordLogin(email, outcome) {
  getDb()
    .prepare("INSERT INTO login_events (user_email, outcome) VALUES (?, ?)")
    .run(email, outcome);
}

export function learningActivity(email) {
  return getDb()
    .prepare(
      `SELECT MAX(at) AS at FROM (
    SELECT updated_at AS at FROM progress WHERE user_email = ?
    UNION ALL SELECT created_at FROM predictions WHERE user_email = ?
    UNION ALL SELECT updated_at FROM explanations WHERE user_email = ?
    UNION ALL SELECT created_at FROM questions WHERE user_email = ?
    UNION ALL SELECT submitted_at FROM journey_reviews WHERE user_email = ?
  )`,
    )
    .get(email, email, email, email, email).at;
}

export function recordReview(
  email,
  version,
  week,
  event,
  evidenceUrl,
  summary,
  notes,
) {
  getDb()
    .prepare(
      `INSERT INTO review_history
    (user_email, version, week, event, evidence_url, summary, mentor_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(email, version, week, event, evidenceUrl, summary, notes);
}
