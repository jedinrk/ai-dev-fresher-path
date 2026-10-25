import { useState } from "react"
import { Icon, PageHeading } from "./ui"
import { lessonParts } from "./lesson"
import { RichText } from "./richtext"

// An inspection surface, not a learner session: never writes progress or drafts.
export default function Curriculum({ program, selectedId }) {
  const [expanded, setExpanded] = useState(
    () => new Set(selectedId ? [selectedId] : []),
  )
  const selectedWeek = program.weeks.find((week) =>
    week.ids.includes(selectedId),
  )
  const weeks = selectedWeek ? [selectedWeek] : program.weeks
  function toggle(id) {
    setExpanded((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  return (
    <div className="curriculum-page">
      <PageHeading
        eyebrow="MENTOR CURRICULUM · READ-ONLY PREVIEW"
        title="See the whole learning journey."
        description={`${program.weeks.length} weeks. ${program.lessons.length} lessons. Every prompt, check, task, and expectation, without completing learner steps.`}
      />
      <div className="panel curriculum-guide">
        <div>
          <p className="eyebrow">CONTENT SOURCE · {program.version}</p>
          <h2>One curriculum, shared expectations.</h2>
          <p>
            Every lesson runs predict, check, learn, a by-hand task with no AI,
            then the same idea with {program.tools?.primary || "the AI tool"}.
            Lesson checklists are self-reported practice; checkpoint sign-off
            is your review of their evidence and explanation
            {program.mentor?.reviewSlot
              ? `, every ${program.mentor.reviewSlot}`
              : ""}
            .
          </p>
          <p>
            To update content, edit <code>content/program.json</code> in the
            repository and follow{" "}
            <code>docs/how-to-maintain-curriculum.md</code>. This preview does
            not publish changes or save learner progress. An in-app editor is
            not available yet.
          </p>
        </div>
        <a href="#mentor" className="text-link">
          Open review workspace <Icon name="arrow" size={16} />
        </a>
      </div>
      <nav className="curriculum-controls" aria-label="Curriculum navigation">
        {selectedWeek && (
          <a href="#curriculum" className="text-link">
            ← All weeks
          </a>
        )}
        <button
          onClick={() =>
            setExpanded(new Set(weeks.flatMap((week) => week.ids)))
          }
        >
          Expand all lessons
        </button>
        <button onClick={() => setExpanded(new Set())}>
          Collapse all lessons
        </button>
      </nav>
      {selectedId && !selectedWeek && (
        <p role="status">Lesson not found. Showing the complete curriculum.</p>
      )}
      {weeks.map((week) => (
        <section
          className="curriculum-week"
          key={week.number}
          aria-labelledby={`curriculum-week-${week.number}`}
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                WEEK {week.number} · {week.label}
              </p>
              <h2 id={`curriculum-week-${week.number}`}>{week.title}</h2>
              <p className="muted">{week.description}</p>
            </div>
            <span className="badge">{week.ids.length} lessons</span>
          </div>
          <div className="panel curriculum-brief">
            <p className="eyebrow">PROJECT · {week.outcome}</p>
            <h3>{week.projectTitle}</h3>
            <p>{week.brief}</p>
            <h4>Expected checkpoint evidence</h4>
            <ul>
              {week.deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="small muted">
              Milestone: {week.milestone}. Review the actual work before signing
              off.
            </p>
          </div>
          <div className="curriculum-lessons">
            {week.ids.map((id, index) => {
              const lesson = program.lessons.find((item) => item.id === id)
              const parts = lessonParts(lesson)
              const open = expanded.has(id)
              const resources = program.resources.filter((resource) =>
                lesson.resources?.includes(resource.id),
              )
              return (
                <section className="panel curriculum-lesson" key={id}>
                  <h3>
                    <button
                      className="curriculum-toggle"
                      aria-expanded={open}
                      aria-controls={`curriculum-${id}`}
                      onClick={() => toggle(id)}
                    >
                      <span className="curriculum-number">{index + 1}</span>
                      <span>
                        {lesson.title}
                        <small>
                          {id} · About {lesson.time} min including practice
                        </small>
                      </span>
                      <span aria-hidden="true">{open ? "−" : "+"}</span>
                    </button>
                  </h3>
                  {open && (
                    <div className="curriculum-content" id={`curriculum-${id}`}>
                      <p className="muted">{lesson.summary}</p>
                      <p className="badge">{parts.aiLabel}</p>
                      {lesson.prepare?.length > 0 && (
                        <>
                          <h4>Before you start</h4>
                          <ul>
                            {lesson.prepare.map((item) => (
                              <li key={item.topic}>
                                <strong>{item.topic}.</strong> {item.meaning}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      <h4>Predict</h4>
                      <p>{lesson.predictPrompt}</p>
                      {parts.checks.length > 0 && (
                        <>
                          <h4>Checks</h4>
                          <ol className="curriculum-checks">
                            {parts.checks.map((check) => (
                              <li key={check.question}>
                                <p>{check.question}</p>
                                <ul>
                                  {check.options.map((option) => (
                                    <li
                                      key={option.text}
                                      className={
                                        option.correct ? "correct" : undefined
                                      }
                                    >
                                      <strong>
                                        {option.correct ? "Correct: " : ""}
                                        {option.text}
                                      </strong>{" "}
                                      <span className="muted">
                                        {option.feedback}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </li>
                            ))}
                          </ol>
                        </>
                      )}
                      <h4>Learn</h4>
                      <RichText className="lesson-prose" text={lesson.lesson} />
                      {parts.examples.map((example, i) => (
                        <figure className="lesson-example" key={i}>
                          {example.caption && (
                            <figcaption>{example.caption}</figcaption>
                          )}
                          <pre>
                            <code>{example.code}</code>
                          </pre>
                        </figure>
                      ))}
                      {lesson.keyReading && (
                        <p className="small muted">
                          Read this now:{" "}
                          {
                            program.resources.find(
                              (r) => r.id === lesson.keyReading.resource,
                            )?.title
                          }
                        </p>
                      )}
                      {lesson.widgets?.length > 0 && (
                        <p className="small muted">
                          Interactive:{" "}
                          {lesson.widgets.map((w) => w.title).join(" · ")}
                        </p>
                      )}
                      <h4>By hand, no AI</h4>
                      <RichText text={parts.byHand.task} />
                      <ul>
                        {parts.byHand.checklist.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      {parts.withAI && (
                        <>
                          <h4>With {program.tools?.primary || "AI"}</h4>
                          {parts.withAI.task && (
                            <RichText text={parts.withAI.task} />
                          )}
                          {parts.withAI.prompt && (
                            <>
                              <h5>Starter prompt</h5>
                              <p className="preserve-lines">
                                {parts.withAI.prompt}
                              </p>
                            </>
                          )}
                          <ul>
                            {parts.withAI.checklist.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                          {lesson.explainBack && (
                            <>
                              <h5>Explain it back</h5>
                              <RichText text={lesson.explainBack.prompt} />
                            </>
                          )}
                        </>
                      )}
                      {parts.hints.length > 0 && (
                        <>
                          <h4>Staged hints</h4>
                          <ol>
                            {parts.hints.map((hint) => (
                              <li key={hint}>{hint}</li>
                            ))}
                          </ol>
                        </>
                      )}
                      {lesson.reflection && (
                        <>
                          <h4>Reflection prompt</h4>
                          <p>{lesson.reflection}</p>
                        </>
                      )}
                      {resources.length > 0 && (
                        <>
                          <h4>Related references</h4>
                          <ul>
                            {resources.map((resource) => (
                              <li key={resource.id}>
                                <a
                                  className="text-link"
                                  href={resource.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {resource.title} ↗
                                </a>
                                <p className="small muted">
                                  {resource.source} ·{" "}
                                  {resource.required ? "Required" : "Optional"}.{" "}
                                  {resource.takeaway}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      <a className="text-link" href={`#curriculum/${id}`}>
                        Lesson permalink · {id} <Icon name="arrow" size={14} />
                      </a>
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
