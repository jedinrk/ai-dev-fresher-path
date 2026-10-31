async function request(path, options) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
  })

  const body = res.status === 204 ? null : await res.json().catch(() => null)

  if (!res.ok) {
    const error = new Error(body?.error || "request failed")
    error.status = res.status
    throw error
  }

  return body
}

export const api = {
  getProgram: () => request("/api/content/program"),
  getJourney: () => request("/api/journey"),
  submitCheckpoint: (week, data) =>
    request(`/api/journey/weeks/${week}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  listCohorts: () => request("/api/admin/cohorts"),
  createCohort: (name) =>
    request("/api/admin/cohorts", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  getLearner: (email) =>
    request(`/api/journey/learners/${encodeURIComponent(email)}`),
  listPeople: () => request("/api/admin/people"),
  loginActivity: (email = "") =>
    request(`/api/admin/login-activity?email=${encodeURIComponent(email)}`),
  listReviews: () => request("/api/journey/reviews"),
  reviewCheckpoint: (email, week, data) =>
    request(`/api/journey/reviews/${encodeURIComponent(email)}/${week}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  me: () => request("/api/auth/me"),
  register: (data) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  listUsers: () => request("/api/admin/users"),
  resetUser: (email) =>
    request(`/api/admin/users/${encodeURIComponent(email)}`, {
      method: "DELETE",
    }),
  listAllowlist: () => request("/api/admin/allowlist"),
  addAllowlistEntry: (email, role, cohortId) =>
    request("/api/admin/allowlist", {
      method: "POST",
      body: JSON.stringify({ email, role, cohortId }),
    }),
  removeAllowlistEntry: (email) =>
    request(`/api/admin/allowlist/${encodeURIComponent(email)}`, {
      method: "DELETE",
    }),
  listConcepts: () => request("/api/content/concepts"),
  getProgress: () => request("/api/progress"),
  submitPrediction: (conceptId, text) =>
    request(`/api/progress/${encodeURIComponent(conceptId)}/prediction`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  advanceStep: (conceptId, step) =>
    request(`/api/progress/${encodeURIComponent(conceptId)}/step`, {
      method: "POST",
      body: JSON.stringify({ step }),
    }),
  saveExplanation: (conceptId, text) =>
    request(`/api/progress/${encodeURIComponent(conceptId)}/explanation`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  listCheckpoints: () => request("/api/admin/checkpoints"),
  signOffCheckpoint: (email, week, notes) =>
    request(`/api/admin/checkpoints/${encodeURIComponent(email)}/${week}`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    }),
  flagPrediction: (email, conceptId, wrongFlag) =>
    request(
      `/api/admin/predictions/${encodeURIComponent(email)}/${encodeURIComponent(conceptId)}`,
      { method: "PATCH", body: JSON.stringify({ wrongFlag }) },
    ),
  getMyQuestions: () => request("/api/questions"),
  askQuestion: (text, conceptId) =>
    request("/api/questions", {
      method: "POST",
      body: JSON.stringify({ text, conceptId }),
    }),
  listFlaggedQuestions: () => request("/api/admin/questions"),
  answerQuestion: (id, answer) =>
    request(`/api/admin/questions/${id}/answer`, {
      method: "POST",
      body: JSON.stringify({ answer }),
    }),
  dismissQuestion: (id) =>
    request(`/api/admin/questions/${id}/flag`, {
      method: "PATCH",
      body: JSON.stringify({ flagged: false }),
    }),
}
