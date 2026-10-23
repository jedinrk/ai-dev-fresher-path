import { useEffect, useState } from "react"
import { api } from "./api"
import { Icon, PageHeading } from "./ui"
import { draftKey, readDraft, saveDraft, removeDraft } from "./drafts"

export default function Questions({ context, userEmail }) {
  const key = userEmail
    ? draftKey(userEmail, `question-${context || "general"}`)
    : null
  const [questions, setQuestions] = useState(null)
  const [text, setText] = useState(
    () =>
      readDraft(key) ||
      (context
        ? `About: ${context}\n\nI am trying to…\nI expected…\nInstead…\nI already tried…`
        : ""),
  )
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [saved, setSaved] = useState(false)
  function load() {
    return api.getMyQuestions().then(setQuestions)
  }
  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])
  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setSubmitting(true)
    try {
      await api.askQuestion(text)
      setText("")
      removeDraft(key)
      setSaved(false)
      setSuccess(true)
      try {
        await load()
      } catch {
        setError(
          "Your question was sent. Refresh the conversation to see it here.",
        )
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="THERE’S ROOM FOR EVERY QUESTION"
        title="Getting stuck is part of building."
        description="You’re not expected to figure everything out alone. Bring your questions here."
      />
      <div className="questions-layout">
        <section className="panel question-compose">
          <div className="section-eyebrow">
            <Icon name="questions" />
            <span>START A CONVERSATION</span>
          </div>
          <h2>A good question is a step forward.</h2>
          <p className="muted">
            Share what you expected, what happened, and what you’ve tried. Leave
            out passwords, API keys, and private data.
          </p>
          {context && (
            <span className="badge badge-green">From: {context}</span>
          )}
          {error && (
            <p role="alert" className="error-banner">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="success-line">
              <Icon name="check" size={17} />
              Your question is with your mentor.
            </p>
          )}
          <form onSubmit={handleSubmit}>
            <label htmlFor="question">Ask a question</label>
            <textarea
              id="question"
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setSaved(saveDraft(key, e.target.value))
                setSuccess(false)
              }}
              required
              maxLength={10000}
              rows={7}
              placeholder="I’m trying to… I expected… Here’s what happened instead…"
              disabled={submitting}
            />
            <div className="form-footer">
              <span className="muted small">
                {saved
                  ? "Draft saved on this device"
                  : "Clear context helps your mentor help you."}
              </span>
              <button
                className="button primary"
                type="submit"
                disabled={submitting || !text.trim()}
              >
                {submitting ? "Sending…" : "Submit question"}
                <Icon name="arrow" size={16} />
              </button>
            </div>
          </form>
        </section>
        <aside className="question-aside">
          <span className="big-number">
            20<span>min</span>
          </span>
          <h3>A useful rule of thumb.</h3>
          <p>
            If you’ve been stuck for about 20 minutes, ask for help. Learning to
            get unstuck is a skill, too.
          </p>
          <div className="aside-divider" />
          <p className="eyebrow">TRY INCLUDING</p>
          <ol>
            <li>What you’re working on</li>
            <li>What you expected to happen</li>
            <li>What actually happened</li>
            <li>What you’ve already tried</li>
          </ol>
        </aside>
      </div>
      <section className="question-history">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR QUESTION LOG</p>
            <h2>The conversation so far.</h2>
          </div>
          <button
            className="text-button"
            onClick={() => {
              setError("")
              load().catch((err) => setError(err.message))
            }}
          >
            Refresh conversation
          </button>
        </div>
        {questions === null && !error && (
          <p role="status">Loading your conversation…</p>
        )}
        {questions?.length === 0 && (
          <div className="empty-state">
            <Icon name="questions" size={32} />
            <h3>Your first question belongs here.</h3>
            <p>
              Small questions, big questions, and “I’m not sure yet.” All
              welcome.
            </p>
          </div>
        )}
        <div className="question-list">
          {questions?.map((q) => (
            <article className="panel question-entry" key={q.id}>
              <div className="question-entry-heading">
                <span className="eyebrow">YOU ASKED</span>
                <span
                  className={`badge ${q.answer ? "badge-green" : "badge-neutral"}`}
                >
                  {q.answer ? "Answered" : "Waiting for a reply"}
                </span>
              </div>
              <p className="preserve-lines">{q.questionText}</p>
              {q.answer ? (
                <div className="mentor-answer">
                  <Icon name="mentor" size={19} />
                  <div>
                    <p className="eyebrow">YOUR MENTOR</p>
                    <p className="preserve-lines">Answer: {q.answer}</p>
                  </div>
                </div>
              ) : (
                <p className="muted small">Waiting for an answer.</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
