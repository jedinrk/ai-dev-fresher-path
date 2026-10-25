import { useEffect, useState } from "react"
import { api } from "./api"
import { Icon, PageHeading, ReviewBadge } from "./ui"
import AdminPanel from "./AdminPanel"

export default function Mentor({ program, user }) {
  const [learners, setLearners] = useState(null)
  const [questions, setQuestions] = useState([])
  const [notes, setNotes] = useState({})
  const [error, setError] = useState("")
  const [busy, setBusy] = useState("")
  const [admin, setAdmin] = useState(false)
  async function load() {
    const [people, inbox] = await Promise.all([
      api.listReviews(),
      api.listFlaggedQuestions(),
    ])
    setLearners(people)
    setQuestions(inbox)
  }
  useEffect(() => {
    Promise.all([api.listReviews(), api.listFlaggedQuestions()])
      .then(([people, inbox]) => {
        setLearners(people)
        setQuestions(inbox)
      })
      .catch((err) => setError(err.message))
  }, [])
  async function action(key, fn) {
    setBusy(key)
    setError("")
    try {
      await fn()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy("")
    }
  }
  const pending =
    learners?.flatMap((person) =>
      person.weeks
        .filter((w) => w.review?.status === "submitted")
        .map((w) => ({ person, ...w })),
    ) || []
  return (
    <>
      <PageHeading
        eyebrow="THE MENTOR WORKSPACE"
        title="A little guidance. A lasting difference."
        description="Help learners get unstuck, review their work, and make their progress visible."
      >
        <a href="#curriculum" className="button">
          View full curriculum
        </a>
        <button
          disabled={Boolean(busy)}
          onClick={() => action("refresh", async () => {})}
        >
          Refresh
        </button>
      </PageHeading>
      {error && (
        <p role="alert" className="error-banner">
          {error}
        </p>
      )}
      {!learners && !error && <p role="status">Loading your cohort…</p>}
      <div className="mentor-stats">
        <div>
          <span>{learners?.length ?? "—"}</span>
          <p>Learners in your cohort</p>
        </div>
        <div>
          <span>{pending.length}</span>
          <p>Checkpoints awaiting review</p>
        </div>
        <div>
          <span>{questions.length}</span>
          <p>Questions to explore</p>
        </div>
      </div>
      <div className="section-heading">
        <div>
          <p className="eyebrow">WORK READY FOR YOUR EYES</p>
          <h2>Checkpoint reviews</h2>
        </div>
      </div>
      {learners && !pending.length && (
        <div className="empty-state compact">
          <Icon name="flag" />
          <h3>You’re all caught up.</h3>
          <p>
            Submissions appear here when a learner finishes a week and shares
            their work.
          </p>
        </div>
      )}
      {pending.map(({ person, week, review }) => {
        const key = `${person.email}-${week}`
        const chapter = program.weeks.find((w) => w.number === week)
        return (
          <section className="panel review-card" key={key}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  WEEK {week} · {person.name}
                </p>
                <h2>{chapter.outcome}</h2>
              </div>
              <span className="badge badge-gold">Awaiting review</span>
            </div>
            <a
              href={review.evidenceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              Open submitted work <Icon name="external" size={15} />
            </a>
            <p className="preserve-lines">{review.summary}</p>
            <details className="hint">
              <summary>
                Review criteria and learner thinking <span>+</span>
              </summary>
              <ul>
                {chapter.deliverables.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              {person.predictions
                .filter((p) => chapter.ids.includes(p.concept_id))
                .map((p) => (
                  <div className="review-prediction" key={p.concept_id}>
                    <strong>
                      {
                        program.lessons.find((l) => l.id === p.concept_id)
                          ?.title
                      }
                    </strong>
                    <p>{p.text}</p>
                  </div>
                ))}
              {(person.explanations || [])
                .filter((e) => chapter.ids.includes(e.concept_id))
                .map((e) => (
                  <div className="review-explanation" key={e.concept_id}>
                    <strong>
                      Explained back ·{" "}
                      {
                        program.lessons.find((l) => l.id === e.concept_id)
                          ?.title
                      }
                    </strong>
                    <p>{e.text}</p>
                  </div>
                ))}
            </details>
            <label htmlFor={`notes-${key}`}>
              Feedback for {person.name}, week {week}
            </label>
            <textarea
              id={`notes-${key}`}
              value={notes[key] || ""}
              onChange={(e) =>
                setNotes((prev) => ({ ...prev, [key]: e.target.value }))
              }
              rows={3}
              maxLength={10000}
              placeholder="Be specific about what worked and the next useful improvement."
            />
            <div className="review-actions">
              <button
                disabled={Boolean(busy) || !notes[key]?.trim()}
                onClick={() =>
                  action(key, () =>
                    api.reviewCheckpoint(person.email, week, {
                      status: "changes_requested",
                      notes: notes[key] || "",
                    }),
                  )
                }
              >
                Request changes
              </button>
              <button
                className="button primary"
                disabled={Boolean(busy)}
                onClick={() =>
                  action(key, () =>
                    api.reviewCheckpoint(person.email, week, {
                      status: "approved",
                      notes: notes[key] || "",
                    }),
                  )
                }
              >
                Sign off checkpoint <Icon name="check" size={16} />
              </button>
            </div>
          </section>
        )
      })}
      <section className="mentor-questions">
        <div className="section-heading">
          <div>
            <p className="eyebrow">KEEP THE CONVERSATION GOING</p>
            <h2>Learner questions</h2>
          </div>
        </div>
        {learners && !questions.length && (
          <p className="muted">No questions waiting for a reply.</p>
        )}
        {questions.map((q) => (
          <form
            className="panel"
            key={q.id}
            onSubmit={(e) => {
              e.preventDefault()
              action(`q-${q.id}`, () =>
                api.answerQuestion(q.id, notes[`q-${q.id}`] || ""),
              )
            }}
          >
            <p className="eyebrow">
              {learners?.find((l) => l.email === q.userEmail)?.name ||
                "Learner"}
            </p>
            <p className="preserve-lines">{q.questionText}</p>
            <label htmlFor={`answer-${q.id}`}>Your reply</label>
            <textarea
              id={`answer-${q.id}`}
              required
              value={notes[`q-${q.id}`] || ""}
              onChange={(e) =>
                setNotes((prev) => ({ ...prev, [`q-${q.id}`]: e.target.value }))
              }
              rows={3}
            />
            <button
              className="button primary"
              disabled={Boolean(busy) || !notes[`q-${q.id}`]?.trim()}
            >
              Send reply <Icon name="arrow" size={16} />
            </button>
          </form>
        ))}
      </section>
      <section className="cohort">
        <div className="section-heading">
          <div>
            <p className="eyebrow">EVERY LEARNER, THEIR OWN PACE</p>
            <h2>Your cohort</h2>
          </div>
        </div>
        {learners?.length === 0 && (
          <p className="muted">
            Learners appear here after registering with an invited email.
          </p>
        )}
        {learners?.map((person) => (
          <div className="panel cohort-person" key={person.email}>
            <h3>{person.name}</h3>
            <div className="cohort-weeks">
              {person.weeks.map((week) => (
                <div key={week.week}>
                  <span>Week {week.week}</span>
                  <strong>
                    {week.completed} / {week.total} lessons
                  </strong>
                  <ReviewBadge state={week} />
                  {week.review?.mentorNotes && (
                    <p className="small">{week.review.mentorNotes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
      <div className="legacy-admin">
        <button
          className="text-button"
          onClick={() => setAdmin(!admin)}
          aria-expanded={admin}
        >
          {admin ? "Hide" : "Show"} account administration & original foundation
          records
        </button>
        {admin && (
          <>
            <p className="muted">
              Original foundation checkpoints retain their previous
              eight-concept mapping. New project reviews are managed above.
            </p>
            <AdminPanel currentUserEmail={user.email} />
          </>
        )}
      </div>
    </>
  )
}
