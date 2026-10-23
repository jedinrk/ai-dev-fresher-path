import { useEffect, useState } from "react"
import { api } from "./api"
import {
  BuildIllustration,
  Icon,
  PageHeading,
  ProgressBar,
  ReviewBadge,
} from "./ui"

export function Today({ program, progress, journey, currentWeek, user }) {
  const next = program.lessons.find(
    (lesson) => progress.steps[lesson.id] !== "done",
  )
  const completed = program.lessons.filter(
    (l) => progress.steps[l.id] === "done",
  ).length
  const [questions, setQuestions] = useState(null)
  const [questionError, setQuestionError] = useState(false)
  useEffect(() => {
    api
      .getMyQuestions()
      .then(setQuestions)
      .catch(() => setQuestionError(true))
  }, [])
  const answered = questions?.filter((q) => q.answer) || []
  const nextReview = journey.weeks.find((w) => w.review?.status !== "approved")
  return (
    <>
      <section className="welcome-hero">
        <div>
          <p className="eyebrow">
            <span className="sun-icon">✳</span> YOUR NEXT CHAPTER STARTS HERE
          </p>
          <h1>
            Small steps.
            <br />
            <em>Real things.</em>
          </h1>
          <p>
            Welcome{completed ? " back" : ""}, {user.name.split(" ")[0]}. You
            don’t need to know it all.
            <br className="desktop-break" /> Just bring your curiosity. Let’s
            build something.
          </p>
          <div className="hero-meta">
            <span>
              <Icon name="roadmap" size={16} /> 4 weeks
            </span>
            <i />
            <span>20 hands-on lessons</span>
            <i />
            <span>Your first contribution</span>
          </div>
        </div>
        <BuildIllustration />
      </section>
      <div className="today-grid">
        <section className="next-card">
          <div className="card-topline">
            <span className="eyebrow light">
              {next ? "YOUR NEXT SMALL STEP" : "LOOK HOW FAR YOU’VE COME"}
            </span>
            <span className="dark-badge">
              WEEK {next ? currentWeek.number : 4}
            </span>
          </div>
          <div className="next-card-body">
            <div className="next-icon">
              <Icon name={next ? "project" : "flag"} size={28} />
            </div>
            <div>
              <p className="muted-light">
                {next ? currentWeek.label : "Lessons complete"}
              </p>
              <h2>{next ? next.title : "You built a foundation."}</h2>
              <p>
                {next
                  ? next.summary
                  : "Finish your project review and celebrate the work you can now explain."}
              </p>
            </div>
          </div>
          <div className="next-card-footer">
            <span>
              <Icon name="clock" size={16} />{" "}
              {next
                ? `About ${next.time} min · including practice`
                : `${completed} lessons completed`}
            </span>
            <a
              className="button cream"
              href={
                next
                  ? `#lesson/${next.id}`
                  : `#project/${nextReview?.week || 4}`
              }
            >
              {next
                ? progress.steps[next.id]
                  ? "Continue learning"
                  : "Start learning"
                : "View your checkpoints"}
              <Icon name="arrow" size={17} />
            </a>
          </div>
        </section>
        <section className="outcome-card">
          <div className="section-eyebrow">
            <Icon name="flag" size={18} />
            <span>THIS WEEK’S DESTINATION</span>
          </div>
          <h2>{currentWeek.outcome}</h2>
          <p>{currentWeek.description}</p>
          <div className="outcome-bottom">
            <span className="small muted">
              Learning + making + a mentor check-in
            </span>
            <a href={`#project/${currentWeek.number}`} className="text-link">
              Explore the project <Icon name="arrow" size={16} />
            </a>
          </div>
        </section>
      </div>
      <section className="journey-overview">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE BIG PICTURE</p>
            <h2>Your path from here.</h2>
          </div>
          <a href="#roadmap" className="text-link">
            View full roadmap <Icon name="arrow" size={16} />
          </a>
        </div>
        <div className="week-cards">
          {program.weeks.map((week) => {
            const count = week.ids.filter(
              (id) => progress.steps[id] === "done",
            ).length
            const active = week.number === currentWeek.number
            const state = journey.weeks.find((w) => w.week === week.number)
            return (
              <a
                className={`week-card ${active ? "current" : ""}`}
                key={week.number}
                href={`#project/${week.number}`}
              >
                <div className="week-card-top">
                  <span className="week-number">0{week.number}</span>
                  {state?.review?.status === "approved" ? (
                    <span className="badge badge-green">Signed off</span>
                  ) : active ? (
                    <span className="badge badge-green">You are here</span>
                  ) : (
                    <Icon name="arrow" size={17} />
                  )}
                </div>
                <p className="eyebrow">
                  WEEK {week.number} · {week.label}
                </p>
                <h3>{week.title}</h3>
                <div className="week-card-progress">
                  <ProgressBar
                    value={count}
                    total={week.ids.length}
                    label={`Week ${week.number} progress`}
                  />
                  <span>
                    {count}/{week.ids.length} lessons
                  </span>
                </div>
              </a>
            )
          })}
        </div>
      </section>
      <div className="bottom-grid">
        <section className="mentor-note">
          <div className="note-icon">
            <Icon name="spark" size={23} />
          </div>
          <div>
            <p className="eyebrow">A LITTLE REMINDER</p>
            <h3>You’re allowed to be a beginner.</h3>
            <p>
              Read the code. Ask the question. Try the small thing.
              <br />
              If you’re stuck for 20 minutes, reach out.
            </p>
          </div>
          <a
            href="#questions"
            className="round-link"
            aria-label="Ask a question"
          >
            <Icon name="arrow" />
          </a>
        </section>
        <section className="inbox-preview">
          <p className="eyebrow">YOUR MENTOR CONNECTION</p>
          <h3>
            {questionError
              ? "Keep the conversation going."
              : answered.length
                ? `${answered.length} ${answered.length === 1 ? "answer" : "answers"} to learn from.`
                : questions?.length
                  ? "Your questions are on their way."
                  : "Good questions open doors."}
          </h3>
          <p>
            {questionError
              ? "Open Questions to try loading your conversation again."
              : answered.length
                ? "Your mentor has shared feedback in Questions."
                : "Bring your questions, experiments, and “I’m not sure yet.”"}
          </p>
          <a className="text-link" href="#questions">
            {answered.length ? "Read your answers" : "Open your question log"}
            <Icon name="arrow" size={16} />
          </a>
        </section>
      </div>
    </>
  )
}

export function Roadmap({ program, progress, journey, currentWeek }) {
  const [expanded, setExpanded] = useState(currentWeek.number)
  const completed = program.lessons.filter(
    (l) => progress.steps[l.id] === "done",
  ).length
  return (
    <>
      <PageHeading
        eyebrow="YOUR FOUR-WEEK JOURNEY"
        title="From first command to first contribution."
        description="Explore the whole path. Take it one useful step at a time."
      />
      <div className="roadmap-intro">
        <span>
          <Icon name="roadmap" /> 4 chapters{" "}
          <span className="separator">/</span> {program.lessons.length}{" "}
          practical lessons
        </span>
        <span>{completed} lessons completed</span>
      </div>
      <div className="roadmap-list">
        {program.weeks.map((week) => {
          const count = week.ids.filter(
            (id) => progress.steps[id] === "done",
          ).length
          const state = journey.weeks.find((w) => w.week === week.number)
          const open = expanded === week.number
          return (
            <section
              className={`chapter ${open ? "expanded" : ""}`}
              key={week.number}
            >
              <span className="chapter-marker">
                {count === week.ids.length ? (
                  <Icon name="check" />
                ) : (
                  `0${week.number}`
                )}
              </span>
              <div className="chapter-content">
                <button
                  className="chapter-toggle"
                  onClick={() => setExpanded(open ? null : week.number)}
                  aria-expanded={open}
                  aria-controls={`chapter-${week.number}`}
                >
                  <div>
                    <p className="eyebrow">
                      WEEK {week.number} · {week.label}
                    </p>
                    <h2>{week.title}</h2>
                    <p>{week.description}</p>
                  </div>
                  <div className="chapter-meta">
                    <span>
                      {count} / {week.ids.length} lessons
                    </span>
                    <Icon name="chevron" />
                  </div>
                </button>
                {open && (
                  <div
                    id={`chapter-${week.number}`}
                    className="chapter-lessons"
                  >
                    {week.ids.map((id, index) => {
                      const lesson = program.lessons.find((l) => l.id === id)
                      const step = progress.steps[id]
                      return (
                        <a
                          href={`#lesson/${id}`}
                          className="lesson-row"
                          key={id}
                        >
                          <span
                            className={`lesson-state ${step === "done" ? "complete" : step ? "started" : ""}`}
                          >
                            {step === "done" ? (
                              <Icon name="check" size={16} />
                            ) : (
                              String(index + 1).padStart(2, "0")
                            )}
                          </span>
                          <div>
                            <h3>{lesson.title}</h3>
                            <p>{lesson.summary}</p>
                          </div>
                          <div className="lesson-row-meta">
                            <span className="lesson-kind">
                              {step === "done"
                                ? "Complete"
                                : step
                                  ? "Continue"
                                  : lesson.kind}
                            </span>
                            <span>
                              <Icon name="clock" size={13} />
                              {lesson.time} min
                            </span>
                          </div>
                          <Icon name="chevron" size={16} />
                        </a>
                      )
                    })}
                    <div className="chapter-checkpoint">
                      <div>
                        <Icon name="flag" />
                        <div>
                          <strong>{week.outcome}</strong>
                          <span>Your weekly project & mentor checkpoint</span>
                        </div>
                      </div>
                      <ReviewBadge state={state} />
                      <a href={`#project/${week.number}`} className="text-link">
                        View checkpoint <Icon name="arrow" size={16} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </div>
      <div className="gentle-note">
        <Icon name="leaf" />
        <p>
          The weeks are a guide, not a race. Revisit lessons whenever you need
          to. Your mentor is here to help you find your pace.
        </p>
      </div>
    </>
  )
}

export function Resources({ program }) {
  const [query, setQuery] = useState("")
  const [track, setTrack] = useState("All resources")
  const [week, setWeek] = useState("all")
  const matches = program.resources.filter(
    (r) =>
      (track === "All resources" || track === r.track) &&
      (week === "all" || r.weeks.includes(Number(week))) &&
      `${r.title} ${r.description} ${r.source}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  )
  return (
    <>
      <PageHeading
        eyebrow="YOUR REFERENCE SHELF"
        title="A little guidance goes a long way."
        description="The right reference, at the right moment. Read a little, then try it in your project."
      />
      <div className="resource-toolbar">
        <label className="search-field">
          <Icon name="search" />
          <input
            type="search"
            aria-label="Search resources"
            placeholder="Find a topic, tool, or guide…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="week-filter">
          Week
          <select value={week} onChange={(e) => setWeek(e.target.value)}>
            <option value="all">All weeks</option>
            {program.weeks.map((w) => (
              <option key={w.number} value={w.number}>
                Week {w.number}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="filter-tabs" role="group" aria-label="Resource track">
        {["All resources", "Development", "Generative AI"].map((name) => (
          <button
            key={name}
            aria-pressed={track === name}
            className={track === name ? "selected" : ""}
            onClick={() => setTrack(name)}
          >
            {name}
          </button>
        ))}
        <span className="muted small" role="status">
          {matches.length} resources
        </span>
      </div>
      <div className="resource-grid">
        {matches.map((r) => (
          <article className="resource-card" key={r.id}>
            <div className="resource-card-top">
              <span
                className={`resource-icon ${r.track === "Generative AI" ? "ai-icon" : ""}`}
              >
                <Icon
                  name={r.track === "Generative AI" ? "spark" : "resources"}
                  size={24}
                />
              </span>
              <span className="badge badge-neutral">{r.format}</span>
            </div>
            <p className="eyebrow">{r.source}</p>
            <h2>{r.title}</h2>
            <p>{r.description}</p>
            <div className="takeaway">
              <span>TRY THIS AFTERWARD</span>
              <p>{r.takeaway}</p>
            </div>
            <div className="resource-card-bottom">
              <span className="small muted">
                {r.required ? "Core reference" : "Go deeper"}
              </span>
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="text-link"
                aria-label={`Open ${r.title} (new tab)`}
              >
                Open resource <Icon name="external" size={15} />
              </a>
            </div>
          </article>
        ))}
      </div>
      {!matches.length && (
        <div className="empty-state">
          <Icon name="search" size={30} />
          <h2>No references found.</h2>
          <p>Try another topic or widen your filters.</p>
          <button
            onClick={() => {
              setQuery("")
              setTrack("All resources")
              setWeek("all")
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      <section className="glossary">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PLAIN WORDS, PLEASE</p>
            <h2>A small developer’s dictionary.</h2>
          </div>
        </div>
        <div className="glossary-grid">
          {program.glossary.map(([word, definition]) => (
            <details key={word}>
              <summary>
                {word}
                <span>+</span>
              </summary>
              <p>{definition}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}
