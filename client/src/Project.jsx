import { useState } from "react"
import { api } from "./api"
import { Icon, PageHeading, ProgressBar, ReviewBadge } from "./ui"
import { draftKey, readDraft, saveDraft, removeDraft } from "./drafts"

export default function Project({
  program,
  progress,
  journey,
  weekNumber,
  user,
  onRefresh,
}) {
  const week = program.weeks.find((w) => w.number === weekNumber)
  const state = journey.weeks.find((w) => w.week === weekNumber)
  const key = draftKey(user.email, `checkpoint-${weekNumber}`)
  const [draft] = useState(() => {
    try {
      return JSON.parse(readDraft(key) || "{}")
    } catch {
      return {}
    }
  })
  const [url, setUrl] = useState(
    draft.evidenceUrl || state?.review?.evidenceUrl || "",
  )
  const [summary, setSummary] = useState(
    draft.summary || state?.review?.summary || "",
  )
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [saved, setSaved] = useState(false)
  if (!week || !state)
    return (
      <div className="empty-state">
        <h1>Choose a chapter to explore.</h1>
        <a href="#roadmap">Back to your roadmap</a>
      </div>
    )
  const count = week.ids.filter((id) => progress.steps[id] === "done").length
  const editable =
    !sent && (!state.review || state.review.status === "changes_requested")
  const ready = count === week.ids.length && user.role === "intern"
  async function refresh() {
    setBusy(true)
    setError("")
    try {
      await onRefresh()
      setSent(false)
    } catch {
      setError("Couldn’t refresh your checkpoint. Please try again.")
    } finally {
      setBusy(false)
    }
  }
  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError("")
    try {
      await api.submitCheckpoint(weekNumber, { evidenceUrl: url, summary })
      setSent(true)
      removeDraft(key)
      try {
        await onRefresh()
      } catch {
        setError(
          "Your submission is saved. Refresh to see the latest review status.",
        )
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="YOUR WORK, TAKING SHAPE"
        title="Make something you can explain."
        description={`Your project is ${program.project.name}: ${program.project.summary} Each week adds one layer to it.`}
      />
      <nav className="week-tabs" aria-label="Project week">
        {program.weeks.map((w) => (
          <a
            className={weekNumber === w.number ? "selected" : ""}
            aria-current={weekNumber === w.number ? "page" : undefined}
            href={`#project/${w.number}`}
            key={w.number}
          >
            <span>0{w.number}</span>Week {w.number}
            <small>{w.label}</small>
          </a>
        ))}
      </nav>
      <div className="project-layout">
        <div>
          <section className="project-brief panel">
            <div className="section-eyebrow">
              <Icon name="project" />
              <span>WEEK {week.number} · THE BRIEF</span>
            </div>
            <h2>{week.projectTitle}</h2>
            <p>{week.brief}</p>
            <h3>What you’ll bring to your mentor</h3>
            <ul className="deliverables">
              {week.deliverables.map((d, i) => (
                <li key={d}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {d}
                </li>
              ))}
            </ul>
            {week.ids.some((id) => progress.explanations?.[id]) && (
              <>
                <h3>What you explained back this week</h3>
                {week.ids
                  .filter((id) => progress.explanations?.[id])
                  .map((id) => (
                    <div className="review-explanation" key={id}>
                      <strong>
                        {program.lessons.find((l) => l.id === id)?.title}
                      </strong>
                      <p>{progress.explanations[id]}</p>
                    </div>
                  ))}
                <p className="small muted">
                  Your mentor reads these at the review. Bring one up if you
                  want to talk it through.
                </p>
              </>
            )}
            {week.number === program.weeks.length && (
              <div className="gentle-note">
                <Icon name="questions" />
                <p>
                  Your last feature is one of three options in the first
                  lesson of this week, each with a numbered list of
                  requirements. Agree your choice with your mentor before you
                  start building. Report its review status exactly as it is.
                </p>
              </div>
            )}
          </section>
          <section className="panel submission-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR WEEKLY CHECK-IN</p>
                <h2>Show your work.</h2>
              </div>
              <ReviewBadge
                state={
                  sent && !state.review
                    ? { review: { status: "submitted" } }
                    : state
                }
              />
            </div>
            <p className="muted">
              Share a repository, pull request, or handover link your mentor can
              access. Explain what changed and how you checked it.
            </p>
            {error && (
              <p role="alert" className="error-banner">
                {error}
              </p>
            )}
            {state.review?.mentorNotes && (
              <div className="mentor-feedback">
                <p className="eyebrow">FROM YOUR MENTOR</p>
                <p>{state.review.mentorNotes}</p>
              </div>
            )}
            {editable ? (
              <form onSubmit={submit}>
                <label htmlFor="evidence-url">Link to your work</label>
                <input
                  id="evidence-url"
                  type="url"
                  required
                  maxLength={2000}
                  placeholder="https://github.com/your-project/…"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value)
                    setSaved(
                      saveDraft(
                        key,
                        JSON.stringify({
                          evidenceUrl: e.target.value,
                          summary,
                        }),
                      ),
                    )
                  }}
                  disabled={busy}
                />
                <label htmlFor="evidence-summary">
                  What did you build, and how did you verify it?
                </label>
                <textarea
                  id="evidence-summary"
                  rows={6}
                  required
                  minLength={20}
                  maxLength={10000}
                  value={summary}
                  placeholder="I changed… I checked… AI helped with… I can explain…"
                  onChange={(e) => {
                    setSummary(e.target.value)
                    setSaved(
                      saveDraft(
                        key,
                        JSON.stringify({
                          evidenceUrl: url,
                          summary: e.target.value,
                        }),
                      ),
                    )
                  }}
                  disabled={busy}
                />
                {count < week.ids.length && (
                  <p className="small muted">
                    Complete the {week.ids.length - count} remaining{" "}
                    {week.ids.length - count === 1 ? "lesson" : "lessons"} to
                    request review. You can draft your submission now.
                  </p>
                )}
                <div className="form-footer">
                  <span className="small muted">
                    {user.role === "mentor"
                      ? "Mentor preview: submissions are made from learner accounts."
                      : saved
                        ? "Draft saved on this device"
                        : "Share work links, never passwords or API keys."}
                  </span>
                  <button
                    className="button primary"
                    disabled={!ready || busy || summary.trim().length < 20}
                  >
                    {busy
                      ? "Submitting…"
                      : state.review
                        ? "Resubmit for review"
                        : "Request mentor review"}
                    <Icon name="arrow" size={16} />
                  </button>
                </div>
              </form>
            ) : (
              <div className="submitted-work">
                <div className="success-line">
                  <Icon name="check" />
                  <strong>
                    {state.review?.status === "approved"
                      ? week.milestone
                      : "Your work is with your mentor."}
                  </strong>
                </div>
                <a
                  href={state.review?.evidenceUrl || url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-link"
                >
                  Open submitted work <Icon name="external" size={15} />
                </a>
                <p>{state.review?.summary || summary}</p>
                <p className="small muted">
                  {state.review?.status === "approved"
                    ? "Your mentor has signed off this checkpoint. Take a moment to notice your progress."
                    : "You can continue learning while you wait. If revisions are needed, you’ll see the feedback here."}
                </p>
              </div>
            )}
            <button
              className="text-button refresh-button"
              onClick={refresh}
              disabled={busy}
            >
              Refresh review status
            </button>
          </section>
        </div>
        <aside>
          <section className="aside-card">
            <p className="eyebrow">LESSONS THAT GET YOU THERE</p>
            <h3>
              {count} of {week.ids.length} complete
            </h3>
            <ProgressBar
              value={count}
              total={week.ids.length}
              label={`Week ${week.number} lessons`}
            />
            <div className="project-lesson-links">
              {week.ids.map((id) => (
                <a key={id} href={`#lesson/${id}`}>
                  <span
                    className={`mini-check ${progress.steps[id] === "done" ? "done" : ""}`}
                  >
                    {progress.steps[id] === "done" && (
                      <Icon name="check" size={12} />
                    )}
                  </span>
                  <span>{program.lessons.find((l) => l.id === id).title}</span>
                  <Icon name="chevron" size={14} />
                </a>
              ))}
            </div>
          </section>
          <div className="aside-help">
            <Icon name="mentor" />
            <h3>Progress is a conversation.</h3>
            <p>
              Finishing a lesson records your practice. Your mentor reviews the
              project and your understanding at this checkpoint.
            </p>
            <a href="#questions" className="text-link">
              Ask your mentor <Icon name="arrow" size={15} />
            </a>
          </div>
        </aside>
      </div>
      {journey.legacy?.length > 0 && (
        <details className="legacy-records">
          <summary>Your original foundation approvals</summary>
          <p>
            These approvals belong to the earlier eight-concept syllabus. They
            are preserved separately from the expanded project checkpoints.
          </p>
          {journey.legacy.map((item) => (
            <p key={item.week}>
              Original week {item.week} · Signed off {item.signedOffAt}
              {item.mentorNotes && ` · ${item.mentorNotes}`}
            </p>
          ))}
        </details>
      )}
    </>
  )
}
