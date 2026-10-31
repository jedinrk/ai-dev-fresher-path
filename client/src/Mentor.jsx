import { useEffect, useState } from "react"
import { api } from "./api"
import { PageHeading, ProgressBar, ReviewBadge } from "./ui"
import { formatDate, focusWeek } from "./mentorUtils"
import { Stats } from "./MentorStats"
import { plainText } from "./plaintext"

export default function Mentor({ program, route = "mentor" }) {
  const [path, query = ""] = route.split("?")
  const [, encodedEmail, selectedTab = "progress", weekParam, lessonParam] =
    path.split("/")
  let email = ""
  try {
    email = decodeURIComponent(encodedEmail || "")
  } catch {
    email = "invalid"
  }
  const params = new URLSearchParams(query)
  const cohortId = params.get("cohort") || "all"
  const filter = params.get("filter") || "all"
  const search = params.get("q") || ""
  const suffix = query ? `?${query}` : ""
  const [learners, setLearners] = useState(null)
  const [cohorts, setCohorts] = useState([])
  const [person, setPerson] = useState(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [reload, setReload] = useState(0)
  const [refreshRequired, setRefreshRequired] = useState(false)
  useEffect(() => {
    let active = true
    const promise = email
      ? api.getLearner(email)
      : Promise.all([api.listReviews(), api.listCohorts()])
    promise
      .then((data) => {
        if (!active) return
        setError("")
        if (email) {
          setPerson(data)
          setRefreshRequired(false)
        } else {
          setLearners(data[0])
          setCohorts(data[1])
        }
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
    return () => {
      active = false
    }
  }, [email, reload])
  function overviewParam(key, value) {
    const next = new URLSearchParams(query)
    next.set(key, value)
    window.location.assign(`#mentor?${next}`)
  }
  const profileLink = (who, tab = "progress", week = "", lesson = "") =>
    `#mentor/${encodeURIComponent(who)}/${tab}${week ? `/${week}` : ""}${lesson ? `/${lesson}` : ""}${suffix}`
  async function act(fn) {
    setBusy(true)
    setError("")
    setMessage("")
    try {
      await fn()
      setMessage("Saved.")
      try {
        setPerson(await api.getLearner(email))
      } catch {
        setRefreshRequired(true)
        setError(
          "Your changes were saved, but this view could not refresh. Refresh before taking another action.",
        )
        return true
      }
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setBusy(false)
    }
  }
  const alerts = (
    <>
      {error && (
        <p role="alert" className="error-banner">
          {error}{" "}
          <button onClick={() => setReload((v) => v + 1)} disabled={busy}>
            Retry / refresh
          </button>
        </p>
      )}
      {message && (
        <p role="status" className="success-line">
          {message}
        </p>
      )}
    </>
  )
  if (email) {
    if (!person)
      return (
        <>
          <a className="back-link" href={`#mentor${suffix}`}>
            ← Back to cohort overview
          </a>
          {alerts}
          {!error && <p role="status">Loading learner profile…</p>}
        </>
      )
    const week =
      person.weeks.find((w) => w.week === Number(weekParam)) ||
      focusWeek(person)
    const chapter = program.weeks.find((w) => w.number === week?.week)
    const lessons = program.lessons.filter((l) => chapter?.ids.includes(l.id))
    const selectedLesson =
      lessons.find((l) => l.id === lessonParam) || lessons[0]
    const tab = ["progress", "responses", "questions", "reviews"].includes(
      selectedTab,
    )
      ? selectedTab
      : "progress"
    const completed = person.weeks.reduce((n, w) => n + w.completed, 0)
    const unanswered = person.questions.filter(
      (q) => !q.answer && q.flagged,
    ).length
    return (
      <>
        <a className="back-link" href={`#mentor${suffix}`}>
          ← Back to cohort overview
        </a>
        <PageHeading
          eyebrow="LEARNER PROFILE"
          title={person.name}
          description={`${person.cohort?.name || "Unassigned"} · Joined ${formatDate(person.joinedAt)}`}
        >
          <a className="button" href="#curriculum">
            View curriculum
          </a>
        </PageHeading>
        {alerts}
        <Stats
          items={[
            [`${completed} / ${program.lessons.length}`, "Lessons completed"],
            [
              `${person.weeks.filter((w) => w.review?.status === "approved").length} / ${person.weeks.length}`,
              "Checkpoints signed off",
            ],
            [`Week ${focusWeek(person)?.week}`, "Current focus"],
            [
              formatDate(person.lastLearningActivity),
              "Last saved learning activity",
            ],
          ]}
        />
        <nav className="mentor-tabs" aria-label="Learner profile">
          {[
            ["progress", "Progress"],
            ["responses", "Responses"],
            ["reviews", "Checkpoints & feedback"],
            [
              "questions",
              `Questions${unanswered ? ` · ${unanswered} waiting` : ""}`,
            ],
          ].map(([key, label]) => (
            <a
              key={key}
              aria-current={tab === key ? "page" : undefined}
              className={tab === key ? "active" : ""}
              href={profileLink(email, key, week?.week)}
            >
              {label}
            </a>
          ))}
        </nav>
        {tab !== "questions" && (
          <nav className="mentor-weeks" aria-label="Learning week">
            {person.weeks.map((w) => (
              <a
                key={w.week}
                href={profileLink(email, tab, w.week)}
                aria-current={week?.week === w.week ? "page" : undefined}
                className={week?.week === w.week ? "active" : ""}
              >
                <strong>Week {w.week}</strong>
                <span>
                  {w.completed} / {w.total} lessons
                </span>
                <ReviewBadge state={w} />
              </a>
            ))}
          </nav>
        )}
        {tab === "progress" && chapter && (
          <div className="mentor-detail-grid">
            <section className="panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">WEEK {week.week}</p>
                  <h2>{chapter.title}</h2>
                  <p>
                    {week.completed} of {week.total} lessons completed
                  </p>
                </div>
                <ReviewBadge state={week} />
              </div>
              <p className="muted small">
                Lesson completion records practice. Mentor sign-off verifies
                checkpoint evidence.
              </p>
              {lessons.map((l) => {
                const step = person.progress.find(
                  (p) => p.concept_id === l.id,
                )?.step
                return (
                  <div className="mentor-lesson-row" key={l.id}>
                    <div>
                      <strong>{l.title}</strong>
                      <span className="muted small">
                        {{
                          learn: "Learning",
                          prove: "Practising",
                          done: "Completed",
                          predict: "Predicting",
                        }[step] || "Not started"}
                      </span>
                    </div>
                    <a
                      className="text-link"
                      href={profileLink(email, "responses", week.week, l.id)}
                    >
                      View responses →
                    </a>
                  </div>
                )
              })}
            </section>
            <aside>
              <section className="panel">
                <p className="eyebrow">CHECKPOINT</p>
                <h2>
                  {week.review?.status === "submitted"
                    ? "Ready for your review"
                    : "Work and feedback"}
                </h2>
                <p>{chapter.outcome}</p>
                <ReviewBadge state={week} />
                <p>
                  {week.review
                    ? `Submitted ${formatDate(week.review.submittedAt)}`
                    : "No submission yet."}
                </p>
                <a
                  className="button primary"
                  href={profileLink(email, "reviews", week.week)}
                >
                  {week.review?.status === "submitted"
                    ? "Review checkpoint"
                    : "View checkpoint"}
                </a>
              </section>
              {week.review?.mentorNotes && (
                <section className="panel">
                  <h3>Latest feedback</h3>
                  <p className="preserve-lines">{week.review.mentorNotes}</p>
                  <p className="small muted">
                    {formatDate(week.review.reviewedAt)}
                  </p>
                </section>
              )}
            </aside>
          </div>
        )}
        {tab === "responses" && selectedLesson && (
          <div className="mentor-detail-grid">
            <section className="panel">
              <label htmlFor="response-lesson">Lesson</label>
              <select
                id="response-lesson"
                value={selectedLesson.id}
                onChange={(e) => {
                  window.location.hash = profileLink(
                    email,
                    "responses",
                    week.week,
                    e.target.value,
                  )
                }}
              >
                {lessons.map((l) => (
                  <option value={l.id} key={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
              <h2>{selectedLesson.title}</h2>
              <p className="eyebrow">THE PREDICTION QUESTION</p>
              <p>{plainText(selectedLesson.predictPrompt)}</p>
              <SavedResponse
                title="Initial prediction"
                record={person.predictions.find(
                  (p) => p.concept_id === selectedLesson.id,
                )}
              />
              {selectedLesson.reflection && (
                <>
                  <p className="eyebrow">THE REFLECTION QUESTION</p>
                  <p>{plainText(selectedLesson.reflection)}</p>
                </>
              )}
              <SavedResponse
                title="Explained back"
                record={person.explanations.find(
                  (p) => p.concept_id === selectedLesson.id,
                )}
              />
              <p className="muted small">
                Saved responses are shown as written. Self-check attempts and
                unsaved drafts are not recorded.
              </p>
            </section>
            <aside>
              <section className="panel">
                <h2>Review in context</h2>
                <p>
                  Compare the learner’s thinking with their submitted evidence.
                </p>
                <a
                  className="button primary"
                  href={profileLink(email, "reviews", week.week)}
                >
                  Open Week {week.week} checkpoint
                </a>
              </section>
              <section className="panel">
                <h3>Questions for this lesson</h3>
                {person.questions
                  .filter((q) => q.conceptId === selectedLesson.id)
                  .map((q) => (
                    <p key={q.id} className="preserve-lines">
                      {q.questionText}
                    </p>
                  ))}
                {!person.questions.some(
                  (q) => q.conceptId === selectedLesson.id,
                ) && <p>No questions linked to this lesson.</p>}
                <a
                  className="text-link"
                  href={profileLink(email, "questions", week.week)}
                >
                  Read all questions & replies →
                </a>
              </section>
            </aside>
          </div>
        )}
        {tab === "reviews" && chapter && (
          <Checkpoint
            key={`${email}-${week.week}`}
            person={person}
            week={week}
            chapter={chapter}
            busy={busy || refreshRequired}
            saving={busy}
            act={act}
            responseLink={profileLink(email, "responses", week.week)}
          />
        )}
        {tab === "questions" && (
          <section className="mentor-question-log">
            <div className="section-heading">
              <h2>Questions & replies</h2>
              <span className="muted small">Including answered questions</span>
            </div>
            {!person.questions.length && (
              <div className="empty-state">
                <h3>No questions yet.</h3>
                <p>
                  Questions will appear here when this learner asks for help.
                </p>
              </div>
            )}
            {person.questions.map((q) => (
              <Question
                key={`${email}-${q.id}`}
                question={q}
                program={program}
                busy={busy || refreshRequired}
                saving={busy}
                act={act}
              />
            ))}
          </section>
        )}
        {person.legacy.length > 0 && (
          <details className="panel">
            <summary>
              Original foundation records · {person.legacy.length} signed off
            </summary>
            <p className="muted">
              These use the original foundation mapping and do not count toward
              the current program.
            </p>
            {person.legacy.map((w) => (
              <div key={w.week}>
                <h3>Original week {w.week}</h3>
                <p>{formatDate(w.signedOffAt)}</p>
                <p className="preserve-lines">{w.mentorNotes}</p>
              </div>
            ))}
          </details>
        )}
      </>
    )
  }
  const cohortLearners = (learners || []).filter(
    (p) => cohortId === "all" || String(p.cohort?.id) === cohortId,
  )
  const matches = (p) =>
    filter === "review"
      ? p.weeks.some((w) => w.review?.status === "submitted")
      : filter === "questions"
        ? p.questionCount > 0
        : filter === "revision"
          ? p.weeks.some((w) => w.review?.status === "changes_requested")
          : true
  const visible = cohortLearners.filter(
    (p) =>
      matches(p) &&
      `${p.name} ${p.email}`.toLowerCase().includes(search.toLowerCase()),
  )
  const pending = cohortLearners.reduce(
    (n, p) =>
      n + p.weeks.filter((w) => w.review?.status === "submitted").length,
    0,
  )
  return (
    <>
      <PageHeading
        eyebrow="YOUR COHORT, AT A GLANCE"
        title="See where guidance can help."
        description="Open a learner’s profile to understand their work and next step."
      >
        <a className="button" href="#curriculum">
          View full curriculum
        </a>
      </PageHeading>
      {alerts}
      <div className="mentor-toolbar">
        <div>
          <label htmlFor="mentor-cohort">Cohort</label>
          <select
            id="mentor-cohort"
            value={cohortId}
            onChange={(e) => overviewParam("cohort", e.target.value)}
          >
            <option value="all">All cohorts</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button onClick={() => setReload((v) => v + 1)}>Refresh</button>
      </div>
      <Stats
        items={[
          [learners ? cohortLearners.length : "—", "Learners"],
          [learners ? pending : "—", "Checkpoints awaiting review"],
          [
            learners
              ? cohortLearners.reduce((n, p) => n + p.questionCount, 0)
              : "—",
            "Questions waiting for a reply",
          ],
          [
            learners
              ? cohortLearners.filter((p) =>
                  p.weeks.some((w) => w.review?.status === "changes_requested"),
                ).length
              : "—",
            "Learners revising work",
          ],
        ]}
      />
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Learners</h2>
            <p className="muted">Progress and review status stay separate.</p>
          </div>
          <span className="small muted">
            {program.weeks.length} weeks · {program.lessons.length} lessons
          </span>
        </div>
        <div className="mentor-toolbar">
          <div className="mentor-filter-buttons" aria-label="Filter learners">
            {[
              ["all", "All learners"],
              ["review", "Awaiting review"],
              ["questions", "Has a question"],
              ["revision", "Revising"],
            ].map(([key, label]) => (
              <button
                key={key}
                aria-pressed={filter === key}
                onClick={() => overviewParam("filter", key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="mentor-search">Search learners</label>
            <input
              id="mentor-search"
              type="search"
              value={search}
              onChange={(e) => overviewParam("q", e.target.value)}
              placeholder="Name or email"
            />
          </div>
        </div>
        {!learners && !error && <p role="status">Loading your cohorts…</p>}
        {learners && !visible.length && (
          <div className="empty-state">
            <h3>
              {cohortLearners.length
                ? "No learners match these filters."
                : "No learners in this cohort yet."}
            </h3>
            <p>
              {cohortLearners.length
                ? "Try a different search or clear the filters."
                : "Learners appear after registering with an invited email."}
            </p>
            {cohortLearners.length ? (
              <a className="button" href={`#mentor?cohort=${cohortId}`}>
                Clear filters
              </a>
            ) : (
              <a className="button" href="#people/invitations">
                Invite learners
              </a>
            )}
          </div>
        )}
        {!!visible.length && (
          <div
            className="mentor-table-wrap"
            role="region"
            aria-label="Learner progress table"
            tabIndex={0}
          >
            <table className="mentor-table">
              <thead>
                <tr>
                  <th>Learner</th>
                  <th>Current focus</th>
                  <th>Lessons completed</th>
                  <th>Mentor next step</th>
                  <th>
                    <span className="sr-only">Profile</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => {
                  const w = focusWeek(p)
                  const done = p.weeks.reduce((n, x) => n + x.completed, 0)
                  return (
                    <tr key={p.email}>
                      <td>
                        <strong>{p.name}</strong>
                        <small>{p.cohort?.name || "Unassigned"}</small>
                        <small>{p.email}</small>
                      </td>
                      <td>
                        Week {w?.week}
                        <small>
                          {
                            program.weeks.find((c) => c.number === w?.week)
                              ?.title
                          }
                        </small>
                      </td>
                      <td>
                        {done} / {program.lessons.length}
                        <ProgressBar
                          value={done}
                          total={program.lessons.length}
                          label={`${p.name}: lessons completed`}
                        />
                      </td>
                      <td>
                        {p.weeks.some(
                          (x) => x.review?.status === "submitted",
                        ) && (
                          <span className="badge badge-gold">
                            Review checkpoint
                          </span>
                        )}
                        {p.questionCount > 0 && (
                          <span className="badge badge-gold">
                            Reply to {p.questionCount} question
                            {p.questionCount === 1 ? "" : "s"}
                          </span>
                        )}
                        {!p.questionCount &&
                          !p.weeks.some(
                            (x) => x.review?.status === "submitted",
                          ) && <ReviewBadge state={w} />}
                      </td>
                      <td>
                        <a
                          className="text-link"
                          aria-label={`View ${p.name}'s profile`}
                          href={profileLink(p.email)}
                        >
                          View profile →
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="muted small">
        Invitations, roles, cohort membership and sign-in history live in{" "}
        <a className="text-link" href="#people">
          People & access
        </a>
        .
      </p>
    </>
  )
}

function SavedResponse({ title, record }) {
  return (
    <section className="mentor-saved-response">
      <h3>{title}</h3>
      {record ? (
        <>
          <p className="muted small">
            Saved {formatDate(record.updated_at || record.created_at)}
          </p>
          <blockquote className="preserve-lines">{record.text}</blockquote>
        </>
      ) : (
        <p className="muted">No saved response yet.</p>
      )}
    </section>
  )
}

function Question({ question: q, program, busy, saving, act }) {
  const [answer, setAnswer] = useState("")
  const lesson = program.lessons.find((l) => l.id === q.conceptId)
  return (
    <article className="panel">
      <div className="section-heading">
        <p className="eyebrow">
          {lesson?.title || "No lesson context recorded"}
        </p>
        <span className={`badge ${q.answer ? "badge-green" : "badge-gold"}`}>
          {q.answer
            ? "Answered"
            : q.flagged
              ? "Waiting for a reply"
              : "Closed without reply"}
        </span>
      </div>
      <p className="muted small">Asked {formatDate(q.createdAt)}</p>
      <p className="preserve-lines">{q.questionText}</p>
      {q.answer ? (
        <div className="mentor-saved-response">
          <h3>Mentor reply</h3>
          <p className="preserve-lines">{q.answer}</p>
          <p className="small muted">{formatDate(q.answeredAt)}</p>
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (await act(() => api.answerQuestion(q.id, answer))) setAnswer("")
          }}
        >
          <label htmlFor={`reply-${q.id}`}>Your reply</label>
          <textarea
            id={`reply-${q.id}`}
            rows={4}
            value={answer}
            maxLength={10000}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={busy}
          />
          <button className="button primary" disabled={busy || !answer.trim()}>
            {saving ? "Saving…" : "Send reply"}
          </button>
        </form>
      )}
    </article>
  )
}

function Checkpoint({
  person,
  week,
  chapter,
  busy,
  saving,
  act,
  responseLink,
}) {
  const [notes, setNotes] = useState("")
  const review = week.review
  const history = person.history.filter((h) => h.week === week.week)
  return (
    <div className="mentor-detail-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">WEEK {week.week}</p>
            <h2>{chapter.outcome}</h2>
          </div>
          <ReviewBadge state={week} />
        </div>
        <h3>Review criteria</h3>
        <ul>
          {chapter.deliverables.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        {review ? (
          <>
            <p className="small muted">
              Submitted {formatDate(review.submittedAt)}
            </p>
            <a
              className="text-link"
              href={review.evidenceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open submitted work ↗
            </a>
            <p className="preserve-lines">{review.summary}</p>
            {review.mentorNotes && (
              <div className="mentor-saved-response">
                <h3>Latest mentor feedback</h3>
                <p className="preserve-lines">{review.mentorNotes}</p>
              </div>
            )}
            {review.status === "submitted" && (
              <form onSubmit={(e) => e.preventDefault()}>
                <label htmlFor="checkpoint-feedback">
                  Feedback for {person.name}
                </label>
                <textarea
                  id="checkpoint-feedback"
                  rows={5}
                  maxLength={10000}
                  value={notes}
                  disabled={busy}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What worked? What is the next useful improvement?"
                />
                <div className="review-actions">
                  <button
                    disabled={busy || !notes.trim()}
                    onClick={async () => {
                      if (
                        await act(() =>
                          api.reviewCheckpoint(person.email, week.week, {
                            status: "changes_requested",
                            notes,
                          }),
                        )
                      )
                        setNotes("")
                    }}
                  >
                    Request changes
                  </button>
                  <button
                    className="button primary"
                    disabled={busy}
                    onClick={async () => {
                      if (
                        await act(() =>
                          api.reviewCheckpoint(person.email, week.week, {
                            status: "approved",
                            notes,
                          }),
                        )
                      )
                        setNotes("")
                    }}
                  >
                    {saving ? "Saving…" : "Sign off checkpoint"}
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div className="empty-state compact">
            <h3>No submission yet.</h3>
            <p>
              {week.ready
                ? "Lessons are complete. The learner can now submit their evidence."
                : "The learner can submit this checkpoint after completing its lessons."}
            </p>
          </div>
        )}
      </section>
      <aside>
        <section className="panel">
          <h3>The thinking behind the work</h3>
          <p>
            Read the initial predictions and explained-back responses alongside
            the evidence.
          </p>
          <a className="button" href={responseLink}>
            Read lesson responses →
          </a>
        </section>
        <section className="panel">
          <h3>Review history</h3>
          {!history.length && (
            <p>
              No recorded review history. Older checkpoints show their latest
              feedback only.
            </p>
          )}
          {history.map((h) => (
            <article className="mentor-history-entry" key={h.id}>
              <strong>
                {
                  {
                    submitted: "Work submitted",
                    approved: "Signed off",
                    changes_requested: "Changes requested",
                  }[h.event]
                }
              </strong>
              <p className="small muted">{formatDate(h.created_at)}</p>
              {h.mentor_notes && (
                <p className="preserve-lines">{h.mentor_notes}</p>
              )}
              {h.event === "submitted" && (
                <details>
                  <summary>Submission details</summary>
                  <a
                    className="text-link"
                    href={h.evidence_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open evidence ↗
                  </a>
                  <p className="preserve-lines">{h.summary}</p>
                </details>
              )}
            </article>
          ))}
        </section>
      </aside>
    </div>
  )
}
