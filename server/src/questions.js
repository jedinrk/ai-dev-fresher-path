import { getDb } from './db.js';

export function createQuestion(userEmail, text) {
  getDb()
    .prepare('INSERT INTO questions (user_email, question_text) VALUES (?, ?)')
    .run(userEmail, text);
}

export function getQuestionsForUser(userEmail) {
  return getDb()
    .prepare('SELECT * FROM questions WHERE user_email = ? ORDER BY created_at DESC')
    .all(userEmail);
}

export function getFlaggedQuestions() {
  return getDb()
    .prepare('SELECT * FROM questions WHERE flagged = 1 ORDER BY created_at ASC')
    .all();
}

export function findQuestionById(id) {
  return getDb().prepare('SELECT * FROM questions WHERE id = ?').get(id);
}

export function answerQuestion(id, answer) {
  getDb()
    .prepare(
      "UPDATE questions SET answer = ?, answered_at = datetime('now'), flagged = 0 WHERE id = ?",
    )
    .run(answer, id);
}

export function setQuestionFlag(id, flagged) {
  getDb()
    .prepare('UPDATE questions SET flagged = ? WHERE id = ?')
    .run(flagged ? 1 : 0, id);
}
