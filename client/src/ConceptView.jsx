import { useState } from "react"
import { api } from "./api"
import { Icon, PageHeading } from "./ui"
import { draftKey, readDraft, saveDraft, removeDraft } from "./drafts"

export default function ConceptView({
  concept,
  initialStep,
  initialPrediction,
  onProgressChange,
  userEmail,
  week,
  resources = [],
  nextId,
}) {
  const key = userEmail ? draftKey(userEmail, concept.id) : null
  const taskKey = key ? key + ":task" : null
  const [step, setStep] = useState(initialStep || "predict")
  const [prediction, setPrediction] = useState(
    initialPrediction || readDraft(key),
  )
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [checked, setChecked] = useState(() => {
    if (initialStep === "done") return concept.checklist?.map(() => true) || []
    try {
      const draft = JSON.parse(readDraft(taskKey) || "[]")
      return Array.isArray(draft) ? draft : []
    } catch {
      return []
    }
  })
  async function handlePredictSubmit(e) {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await api.submitPrediction(concept.id, prediction)
      setStep("learn")
      removeDraft(key)
      onProgressChange(concept.id, "learn", prediction)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }
  async function advance(nextStep) {
    setError("")
    setSubmitting(true)
    try {
      await api.advanceStep(concept.id, nextStep)
      setStep(nextStep)
      if (nextStep === "done") removeDraft(taskKey)
      onProgressChange(concept.id, nextStep)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }
  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(concept.prompt)
      setCopied(true)
    } catch {
      setError(
        "Copy is unavailable here. Select and copy the prompt text below.",
      )
    }
  }
  const stages = ["predict", "learn", "prove"]
  const activeIndex = step === "done" ? 3 : stages.indexOf(step)
  const ready =
    !concept.checklist || concept.checklist.every((_, i) => checked[i])
  return (
    <article className="lesson-page">
      <PageHeading
        eyebrow={
          week ? `WEEK ${week.number} · ${week.label}` : "YOUR LEARNING STUDIO"
        }
        title={concept.title || concept.concept}
        description={concept.summary}
      />
      <div className="lesson-top-meta">
        <span>
          <Icon name="clock" size={16} /> About {concept.time || 20} min,
          including practice
        </span>
        <span>
          <Icon name="spark" size={16} />
          {concept.ai || "AI encouraged · your thinking comes first"}
        </span>
      </div>
      <div className="lesson-layout">
        <div className="lesson-main">
          <ol className="stepper" aria-label="Lesson progress">
            {stages.map((stage, i) => (
              <li
                key={stage}
                className={activeIndex >= i ? "reached" : ""}
                aria-current={activeIndex === i ? "step" : undefined}
              >
                <span>
                  {activeIndex > i ? <Icon name="check" size={15} /> : i + 1}
                </span>
                {stage[0].toUpperCase() + stage.slice(1)}
                {activeIndex === i && <small>You are here</small>}
              </li>
            ))}
          </ol>
          {error && (
            <p className="error-banner" role="alert">
              {error}
            </p>
          )}
          <section
            className={`lesson-section ${step !== "predict" ? "past-prediction" : ""}`}
          >
            <p className="eyebrow">01 · PREDICT</p>
            <h2>
              {step === "predict"
                ? "Start with your best guess."
                : "Your starting thought."}
            </h2>
            {step === "predict" ? (
              <>
                <p className="muted">
                  You don’t have to get it right. Notice what changes as you
                  learn.
                </p>
                <form onSubmit={handlePredictSubmit}>
                  <label htmlFor="prediction">{concept.predictPrompt}</label>
                  <textarea
                    id="prediction"
                    value={prediction}
                    onChange={(e) => {
                      setPrediction(e.target.value)
                      setDraftSaved(saveDraft(key, e.target.value))
                    }}
                    required
                    maxLength={10000}
                    rows={5}
                    placeholder="I think…"
                    disabled={submitting}
                  />
                  <div className="form-footer">
                    <span className="small muted">
                      {draftSaved
                        ? "Draft saved on this device"
                        : "Your submitted prediction becomes part of your learning story."}
                    </span>
                    <button
                      className="button primary"
                      type="submit"
                      disabled={submitting || !prediction.trim()}
                    >
                      {submitting ? "Saving…" : "Submit prediction"}
                      <Icon name="arrow" size={16} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <blockquote>{prediction}</blockquote>
            )}
          </section>
          {step !== "predict" && (
            <section className="lesson-section">
              <p className="eyebrow">02 · LEARN</p>
              <h2>See how it works.</h2>
              <div className="lesson-prose">
                {concept.lesson.split("\n\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {concept.code && (
                <pre>
                  <code>{concept.code}</code>
                </pre>
              )}
              {concept.prompt && (
                <div className="prompt-card">
                  <div>
                    <strong>A starter prompt</strong>
                    <button className="text-button" onClick={copyPrompt}>
                      {copied ? "Copied!" : "Copy prompt"}
                    </button>
                  </div>
                  <p>{concept.prompt}</p>
                  <small>
                    Adapt it to your project. Review the plan before accepting
                    changes.
                  </small>
                </div>
              )}
              {step === "learn" && (
                <button
                  className="button primary"
                  disabled={submitting}
                  onClick={() => advance("prove")}
                >
                  {submitting ? "Saving…" : "Continue to the task"}
                  <Icon name="arrow" size={16} />
                </button>
              )}
            </section>
          )}
          {(step === "prove" || step === "done") && (
            <section className="lesson-section">
              <p className="eyebrow">03 · PROVE</p>
              <h2>Make it real.</h2>
              <p className="lesson-task">{concept.proveTask}</p>
              {concept.checklist && (
                <fieldset className="task-checklist">
                  <legend>Before you move on</legend>
                  {concept.checklist.map((item, i) => (
                    <label key={item}>
                      <input
                        type="checkbox"
                        checked={Boolean(checked[i])}
                        disabled={step === "done" || submitting}
                        onChange={(e) => {
                          const next = [...checked]
                          next[i] = e.target.checked
                          setChecked(next)
                          saveDraft(taskKey, JSON.stringify(next))
                        }}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </fieldset>
              )}
              {concept.hint && (
                <details className="hint">
                  <summary>
                    A small hint, if you need it <span>+</span>
                  </summary>
                  <p>{concept.hint}</p>
                </details>
              )}
              {concept.reflection && (
                <div className="reflection">
                  <Icon name="leaf" />
                  <div>
                    <h3>A moment to reflect</h3>
                    <p>{concept.reflection}</p>
                    <span className="small muted">
                      Think it through in your own words, or bring it to your
                      mentor.
                    </span>
                  </div>
                </div>
              )}
              {step === "prove" && (
                <div className="form-footer">
                  <span className="small muted">
                    Your mentor reviews your project at the weekly checkpoint.
                  </span>
                  <button
                    className="button primary"
                    disabled={!ready || submitting}
                    onClick={() => advance("done")}
                  >
                    {submitting ? "Saving…" : "Mark as done"}
                    <Icon name="check" size={16} />
                  </button>
                </div>
              )}
              {step === "done" && (
                <div className="lesson-success" role="status">
                  <div>
                    <span className="success-icon">
                      <Icon name="check" />
                    </span>
                    <div>
                      <h3>One more step forward.</h3>
                      <p>Done. Your progress is saved.</p>
                    </div>
                  </div>
                  <a
                    className="button primary"
                    href={
                      week && week.ids.at(-1) === concept.id
                        ? `#project/${week.number}`
                        : nextId
                          ? `#lesson/${nextId}`
                          : "#roadmap"
                    }
                  >
                    {week && week.ids.at(-1) === concept.id
                      ? "View your checkpoint"
                      : nextId
                        ? "Next lesson"
                        : "Back to roadmap"}
                    <Icon name="arrow" size={16} />
                  </a>
                </div>
              )}
            </section>
          )}
        </div>
        <aside className="lesson-aside">
          <div className="aside-card">
            <span className="small-icon">
              <Icon name="flag" />
            </span>
            <p className="eyebrow">YOU’RE BUILDING TOWARD</p>
            <h3>{week?.outcome || "Your first real contribution"}</h3>
            <p>
              Do the task in your editor. Use this space to think, learn, and
              keep your place.
            </p>
            {week && (
              <a className="text-link" href={`#project/${week.number}`}>
                See the project brief <Icon name="arrow" size={15} />
              </a>
            )}
          </div>
          {resources.length > 0 && (
            <div className="aside-card reference-links">
              <p className="eyebrow">A LITTLE EXTRA GUIDANCE</p>
              {resources.map((r) => (
                <a href={r.url} key={r.id} target="_blank" rel="noreferrer">
                  <span>
                    {r.title}
                    <small>{r.source} · opens in a new tab</small>
                  </span>
                  <Icon name="external" size={15} />
                </a>
              ))}
            </div>
          )}
          <div className="aside-help">
            <Icon name="questions" />
            <h3>Stuck is a starting point.</h3>
            <p>
              After 20 minutes, ask for a hand. Include what you tried and what
              happened.
            </p>
            <a href={`#questions/${concept.id}`} className="text-link">
              Ask about this lesson <Icon name="arrow" size={15} />
            </a>
          </div>
        </aside>
      </div>
    </article>
  )
}
