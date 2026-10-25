import { useState } from "react"
import { api } from "./api"
import { Icon, PageHeading } from "./ui"
import { draftKey, readDraft, saveDraft, removeDraft } from "./drafts"
import { lessonParts } from "./lesson"
import { LessonWidget } from "./widgets"
import { InlineText, RichText } from "./richtext"

function readJsonDraft(key, fallback) {
  try {
    const draft = JSON.parse(readDraft(key) || "null")
    return draft === null ? fallback : draft
  } catch {
    return fallback
  }
}

export default function ConceptView({
  concept,
  initialStep,
  initialPrediction,
  initialExplanation,
  onExplanationChange,
  onProgressChange,
  userEmail,
  week,
  resources = [],
  nextId,
  mentor,
}) {
  const { byHand, withAI, hints, examples, checks, aiLabel } =
    lessonParts(concept)
  const widgets = concept.widgets || []
  const prepare = concept.prepare || []
  const setupWidgets = widgets.filter((w) => w.type === "setup-checklist")
  const learnWidgets = widgets.filter((w) => w.type !== "setup-checklist")
  const sections = [
    ...(prepare.length ? ["prepare"] : []),
    ...(setupWidgets.length ? ["setup"] : []),
    "predict",
    "learn",
    "prove",
  ]
  const num = (name) => String(sections.indexOf(name) + 1).padStart(2, "0")
  const key = userEmail ? draftKey(userEmail, concept.id) : null
  const prepareKey = key ? key + ":prepare" : null
  const [prepared, setPrepared] = useState(() => {
    const draft = readJsonDraft(prepareKey, [])
    return Array.isArray(draft) ? draft : []
  })
  const prepareDone = prepare.every((_, i) => prepared[i])
  const resourceById = (id) => resources.find((r) => r.id === id)
  const keyReading = concept.keyReading
    ? { ...concept.keyReading, resource: resourceById(concept.keyReading.resource) }
    : null
  const readingKey = key ? key + ":reading" : null
  const [readIt, setReadIt] = useState(
    () => readJsonDraft(readingKey, false) === true,
  )
  const readingDone = !keyReading?.resource || readIt
  const explainBack = withAI && concept.explainBack ? concept.explainBack : null
  const [explanation, setExplanation] = useState(initialExplanation || "")
  const [explanationSaved, setExplanationSaved] = useState(
    Boolean(initialExplanation),
  )
  const taskKey = key ? key + ":task" : null
  const checksKey = key ? key + ":checks" : null
  const [step, setStep] = useState(initialStep || "predict")
  const [prediction, setPrediction] = useState(
    initialPrediction || readDraft(key),
  )
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [answers, setAnswers] = useState(() =>
    Array.isArray(readJsonDraft(checksKey, null))
      ? readJsonDraft(checksKey, [])
      : [],
  )
  const [hintsShown, setHintsShown] = useState(0)
  const handItems = byHand.checklist
  const aiItems = withAI?.checklist || []
  const [checked, setChecked] = useState(() => {
    if (initialStep === "done")
      return [...handItems, ...aiItems].map(() => true)
    const draft = readJsonDraft(taskKey, [])
    return Array.isArray(draft) ? draft : []
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
      if (nextStep === "done") {
        removeDraft(taskKey)
        removeDraft(checksKey)
      }
      onProgressChange(concept.id, nextStep)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }
  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(withAI.prompt)
      setCopied(true)
    } catch {
      setError(
        "Copy is unavailable here. Select and copy the prompt text below.",
      )
    }
  }
  function answer(checkIndex, optionIndex) {
    if (answers[checkIndex] !== undefined) return
    const next = [...answers]
    next[checkIndex] = optionIndex
    setAnswers(next)
    saveDraft(checksKey, JSON.stringify(next))
  }
  function toggle(index, value) {
    const next = [...checked]
    next[index] = value
    setChecked(next)
    saveDraft(taskKey, JSON.stringify(next))
  }
  const checksAnswered = checks.every((_, i) => answers[i] !== undefined)
  const handDone = handItems.every((_, i) => checked[i])
  const aiDone = aiItems.every((_, i) => checked[handItems.length + i])
  const ready = handDone && aiDone && (!explainBack || explanationSaved)
  const locked = step !== "done" && !handDone
  async function saveExplanation() {
    setError("")
    setSubmitting(true)
    try {
      await api.saveExplanation(concept.id, explanation)
      setExplanationSaved(true)
      onExplanationChange?.(concept.id, explanation)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }
  const rail = [
    ...(prepare.length ? [{ id: "prepare", label: "Prepare" }] : []),
    { id: "predict", label: "Predict" },
    { id: "learn", label: "Learn" },
    ...(checks.length ? [{ id: "check", label: "Check" }] : []),
    { id: "hand", label: "By hand" },
    ...(withAI ? [{ id: "ai", label: "With Claude Code" }] : []),
    ...(explainBack ? [{ id: "explain", label: "Explain it back" }] : []),
    { id: "done", label: "Done" },
  ]
  const current =
    step === "predict"
      ? prepare.length && !prepareDone
        ? "prepare"
        : "predict"
      : step === "learn"
        ? checks.length && answers.some((a) => a !== undefined)
          ? "check"
          : "learn"
        : step === "prove"
          ? handDone && withAI
            ? explainBack && aiDone
              ? "explain"
              : "ai"
            : "hand"
          : "done"
  const activeIndex = rail.findIndex((item) => item.id === current)
  function renderChecklist(items, offset, legend) {
    if (!items.length) return null
    return (
      <fieldset className="task-checklist">
        <legend>{legend}</legend>
        {items.map((item, i) => (
          <label key={item}>
            <input
              type="checkbox"
              checked={Boolean(checked[offset + i])}
              disabled={step === "done" || submitting}
              onChange={(e) => toggle(offset + i, e.target.checked)}
            />
            <span>{item}</span>
          </label>
        ))}
      </fieldset>
    )
  }
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
          {aiLabel}
        </span>
      </div>
      <div className="lesson-layout">
        <div className="lesson-main">
          <ol className="stepper fine" aria-label="Lesson progress">
            {rail.map((item, i) => (
              <li
                key={item.id}
                className={activeIndex >= i ? "reached" : ""}
                aria-current={activeIndex === i ? "step" : undefined}
              >
                <span>
                  {activeIndex > i ? <Icon name="check" size={13} /> : i + 1}
                </span>
                {item.label}
                {activeIndex === i && <small>You are here</small>}
              </li>
            ))}
          </ol>
          {error && (
            <p className="error-banner" role="alert">
              {error}
            </p>
          )}
          {prepare.length > 0 && (
            <section className="lesson-section">
              <p className="eyebrow">{num("prepare")} · BEFORE YOU START</p>
              <h2>Learn these first.</h2>
              <p className="muted">
                This lesson is a short introduction, not the whole story. Read
                or watch each topic, then tick it. The prediction opens when
                every topic is ticked.
              </p>
              <ol className="prepare-list">
                {prepare.map((item, i) => (
                  <li key={item.topic} className={prepared[i] ? "covered" : ""}>
                    <label>
                      <input
                        type="checkbox"
                        checked={Boolean(prepared[i])}
                        onChange={(e) => {
                          const next = [...prepared]
                          next[i] = e.target.checked
                          setPrepared(next)
                          saveDraft(prepareKey, JSON.stringify(next))
                        }}
                      />
                      <span>
                        <strong>{item.topic}</strong>
                        <small>{item.meaning}</small>
                      </span>
                    </label>
                    <div className="prepare-links">
                      {item.resources.map((id) => {
                        const r = resourceById(id)
                        return r ? (
                          <a href={r.url} key={id} target="_blank" rel="noreferrer">
                            {r.title}
                            <small>{r.source}{r.format ? ` · ${r.format}` : ""}</small>
                            <Icon name="external" size={13} />
                          </a>
                        ) : null
                      })}
                    </div>
                  </li>
                ))}
              </ol>
              <p className="small muted prepare-count">
                {prepare.filter((_, i) => prepared[i]).length} of{" "}
                {prepare.length} topics covered
              </p>
            </section>
          )}
          {setupWidgets.length > 0 && (
            <section className="lesson-section">
              <p className="eyebrow">{num("setup")} · SET UP</p>
              <h2>Get the tools in place.</h2>
              <p className="muted">
                Install each one, run its check, and tick the row. Then make
                your prediction below.
              </p>
              {setupWidgets.map((widget, i) => (
                <LessonWidget
                  key={i}
                  widget={widget}
                  storageKey={key ? `${key}:widget:setup:${i}` : null}
                />
              ))}
            </section>
          )}
          <section
            className={`lesson-section ${step !== "predict" ? "past-prediction" : ""}`}
          >
            <p className="eyebrow">{num("predict")} · PREDICT</p>
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
                      {!prepareDone
                        ? "Tick every topic in Before you start to unlock the prediction."
                        : draftSaved
                          ? "Draft saved on this device"
                          : "Your submitted prediction becomes part of your learning story."}
                    </span>
                    <button
                      className="button primary"
                      type="submit"
                      disabled={submitting || !prediction.trim() || !prepareDone}
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
              <p className="eyebrow">{num("learn")} · LEARN</p>
              <h2>See how it works.</h2>
              <RichText className="lesson-prose" text={concept.lesson} />
              {learnWidgets.map((widget, i) => (
                <LessonWidget
                  key={i}
                  widget={widget}
                  storageKey={key ? `${key}:widget:${i}` : null}
                />
              ))}
              {examples.map((example, i) => (
                <figure className="lesson-example" key={i}>
                  {example.caption && (
                    <figcaption>{example.caption}</figcaption>
                  )}
                  <pre>
                    <code>{example.code}</code>
                  </pre>
                </figure>
              ))}
              {keyReading?.resource && (
                <aside className="key-reading" aria-label="Read this now">
                  <div className="key-reading-head">
                    <p className="eyebrow">READ THIS NOW</p>
                    <span className={`badge ${readIt ? "badge-green" : "badge-gold"}`}>
                      {readIt ? "Read" : "Required before the checks"}
                    </span>
                  </div>
                  <h3>{keyReading.resource.title}</h3>
                  <p>{keyReading.why}</p>
                  <div className="key-reading-actions">
                    <a
                      className="button primary"
                      href={keyReading.resource.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open it: {keyReading.resource.source}
                      <Icon name="external" size={15} />
                    </a>
                    <label>
                      <input
                        type="checkbox"
                        checked={readIt}
                        onChange={(e) => {
                          setReadIt(e.target.checked)
                          saveDraft(readingKey, JSON.stringify(e.target.checked))
                        }}
                      />
                      I read it
                    </label>
                  </div>
                </aside>
              )}
              {checks.length > 0 && (
                <div className="lesson-checks">
                  <h3>Check yourself</h3>
                  <p className="small muted">
                    Pick an answer to see why it is right or wrong. A wrong
                    pick is fine; the reason is the lesson.
                  </p>
                  {checks.map((check, ci) => {
                    const chosen = answers[ci]
                    return (
                      <fieldset className="check" key={check.question}>
                        <legend>{check.question}</legend>
                        {check.options.map((option, oi) => {
                          const picked = chosen === oi
                          const state =
                            chosen === undefined
                              ? ""
                              : option.correct
                                ? "correct"
                                : picked
                                  ? "incorrect"
                                  : "dim"
                          return (
                            <div
                              className={`check-option ${state}`}
                              key={option.text}
                            >
                              <label>
                                <input
                                  type="radio"
                                  name={`check-${concept.id}-${ci}`}
                                  checked={picked}
                                  disabled={chosen !== undefined}
                                  onChange={() => answer(ci, oi)}
                                />
                                <span>{option.text}</span>
                              </label>
                              {(picked ||
                                (chosen !== undefined && option.correct)) && (
                                <p
                                  className="check-feedback"
                                  role={picked ? "status" : undefined}
                                >
                                  {option.feedback}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </fieldset>
                    )
                  })}
                </div>
              )}
              {step === "learn" && (
                <div className="form-footer">
                  <span className="small muted">
                    {!readingDone
                      ? "Open the reading above and tick it to continue."
                      : checksAnswered
                        ? "Next: a short task by hand, before any AI."
                        : "Answer each check to continue."}
                  </span>
                  <button
                    className="button primary"
                    disabled={submitting || !checksAnswered || !readingDone}
                    onClick={() => advance("prove")}
                  >
                    {submitting ? "Saving…" : "Continue to the task"}
                    <Icon name="arrow" size={16} />
                  </button>
                </div>
              )}
            </section>
          )}
          {(step === "prove" || step === "done") && (
            <section className="lesson-section">
              <p className="eyebrow">{num("prove")} · PROVE</p>
              <h2>Make it real.</h2>
              <div className="prove-part">
                <h3>
                  <Icon name="flag" size={16} /> By hand, no AI
                </h3>
                <RichText className="lesson-task" text={byHand.task} />
                {renderChecklist(handItems, 0, "Before Claude Code opens")}
              </div>
              {withAI && (
                <div
                  className={`prove-part ${locked ? "locked" : ""}`}
                  aria-live="polite"
                >
                  <h3>
                    <Icon name="spark" size={16} /> With Claude Code
                  </h3>
                  {locked ? (
                    <p className="lesson-task muted">
                      Unlocks when the by-hand checklist is complete. The idea
                      comes first; the tool comes second.
                    </p>
                  ) : (
                    <>
                      {withAI.task && (
                        <RichText className="lesson-task" text={withAI.task} />
                      )}
                      {withAI.prompt && (
                        <div className="prompt-card">
                          <div>
                            <strong>A starter prompt</strong>
                            <button
                              className="text-button"
                              onClick={copyPrompt}
                            >
                              {copied ? "Copied!" : "Copy prompt"}
                            </button>
                          </div>
                          <p>{withAI.prompt}</p>
                          <small>
                            Adapt it to your project. Review the plan before
                            accepting changes.
                          </small>
                        </div>
                      )}
                      {renderChecklist(
                        aiItems,
                        handItems.length,
                        "Before you mark this done",
                      )}
                    </>
                  )}
                </div>
              )}
              {explainBack && !locked && (
                <div className={`prove-part explain-back ${aiDone ? "" : "locked"}`}>
                  <h3>
                    <Icon name="leaf" size={16} /> Explain it back
                  </h3>
                  {!aiDone ? (
                    <p className="lesson-task muted">
                      Opens when the Claude Code checklist is complete. Nothing
                      Claude wrote stays a black box.
                    </p>
                  ) : (
                    <>
                      <RichText className="lesson-task" text={explainBack.prompt} />
                      <textarea
                        aria-label="Your explanation"
                        value={explanation}
                        onChange={(e) => {
                          setExplanation(e.target.value)
                          setExplanationSaved(false)
                        }}
                        rows={7}
                        maxLength={10000}
                        disabled={submitting || step === "done"}
                        placeholder="File by file: what changed, why it was needed, and what would break if one line were removed…"
                      />
                      <div className="form-footer">
                        <span className="small muted">
                          {explanationSaved
                            ? "Saved. You and your mentor both see this at the week’s review."
                            : "In your own words. You can update it until the lesson is marked done."}
                        </span>
                        {step !== "done" && (
                          <button
                            type="button"
                            className="button primary"
                            disabled={submitting || explanation.trim().length < 20 || explanationSaved}
                            onClick={saveExplanation}
                          >
                            {submitting ? "Saving…" : explanationSaved ? "Saved" : "Save explanation"}
                            <Icon name="check" size={16} />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
              {hints.length > 0 && (
                <div className="hint-ladder">
                  {hints.slice(0, hintsShown).map((hint, i) => (
                    <p className="hint" key={i}>
                      <strong>Hint {i + 1}.</strong> <InlineText text={hint} />
                    </p>
                  ))}
                  {hintsShown < hints.length && (
                    <button
                      className="text-button"
                      onClick={() => setHintsShown(hintsShown + 1)}
                    >
                      {hintsShown === 0
                        ? `Show a hint (1 of ${hints.length})`
                        : `Show the next hint (${hintsShown + 1} of ${hints.length})`}
                    </button>
                  )}
                </div>
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
                    {mentor?.reviewSlot
                      ? `Your mentor reviews your project every ${mentor.reviewSlot}.`
                      : "Your mentor reviews your project at the weekly checkpoint."}
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
          {resources.length > 0 && prepare.length === 0 && (
            <div className="aside-card reference-links">
              <p className="eyebrow">REFERENCES FOR THIS LESSON</p>
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
              {mentor?.questionResponseTime && (
                <>
                  <br />
                  <span className="small">
                    Replies: {mentor.questionResponseTime}
                  </span>
                </>
              )}
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
