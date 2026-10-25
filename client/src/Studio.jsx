import { useEffect, useRef, useState } from "react"
import { api } from "./api"
import { Brand, Icon, ProgressBar } from "./ui"
import { Today, Roadmap, Resources } from "./LearningPages"
import ConceptView from "./ConceptView"
import Project from "./Project"
import Questions from "./Questions"
import Mentor from "./Mentor"
import Curriculum from "./Curriculum"

const navigation = [
  ["today", "Today"],
  ["roadmap", "My roadmap"],
  ["project", "My project"],
  ["resources", "Resources"],
  ["questions", "Questions"],
]

export default function Studio({ user, onLogout, loggingOut }) {
  const [route, setRoute] = useState(window.location.hash.slice(1) || "today")
  const [data, setData] = useState(null)
  const [error, setError] = useState("")
  const main = useRef(null)
  const previousRoute = useRef(route)
  const [page, detail] = route.split("/")
  const pageLabel =
    page === "curriculum" || (page === "lesson" && user.role === "mentor")
      ? "Mentor curriculum"
      : page === "lesson"
        ? "Learning studio"
        : navigation.find(([key]) => key === page)?.[1] || "Mentor workspace"
  function load() {
    Promise.all([api.getProgram(), api.getProgress(), api.getJourney()])
      .then(([program, progress, journey]) => {
        setData({ program, progress, journey })
        setError("")
      })
      .catch((err) =>
        setError(err.message || "Your learning path could not be loaded."),
      )
  }
  useEffect(load, [])
  useEffect(() => {
    const change = () => setRoute(window.location.hash.slice(1) || "today")
    window.addEventListener("hashchange", change)
    return () => window.removeEventListener("hashchange", change)
  }, [])
  useEffect(() => {
    if (previousRoute.current !== route) {
      main.current?.focus()
      window.scrollTo({ top: 0, behavior: "instant" })
      previousRoute.current = route
    }
  }, [route])
  useEffect(() => {
    document.title = `Syntree · ${pageLabel}`
  }, [pageLabel])
  async function refreshJourney() {
    const journey = await api.getJourney()
    setData((prev) => ({ ...prev, journey }))
  }
  function updateProgress(id, step, prediction) {
    setData((prev) => ({
      ...prev,
      progress: {
        steps: { ...prev.progress.steps, [id]: step },
        predictions:
          prediction !== undefined
            ? { ...prev.progress.predictions, [id]: prediction }
            : prev.progress.predictions,
      },
    }))
    if (step === "done")
      refreshJourney().catch(() =>
        setError(
          "Your lesson is saved. Refresh to update checkpoint availability.",
        ),
      )
  }
  function updateExplanation(id, text) {
    setData((prev) => ({
      ...prev,
      progress: {
        ...prev.progress,
        explanations: { ...prev.progress.explanations, [id]: text },
      },
    }))
  }
  const completed =
    data?.program.lessons.filter((l) => data.progress.steps[l.id] === "done")
      .length || 0
  const total = data?.program.lessons.length || 0
  const currentWeek =
    data?.program.weeks.find((w) =>
      w.ids.some((id) => data.progress.steps[id] !== "done"),
    ) || data?.program.weeks.at(-1)
  const lesson = data?.program.lessons.find((l) => l.id === detail)
  const lessonWeek = data?.program.weeks.find((w) => w.ids.includes(detail))
  const active = page === "lesson" || page === "curriculum" ? "roadmap" : page
  const props = data ? { ...data, currentWeek, user } : {}
  return (
    <div className="app-layout">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault()
          main.current?.focus()
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar">
        <Brand />
        <div className="program-label">
          THE SYNTREE PROGRAM <span>01</span>
        </div>
        <nav
          aria-label="Main navigation"
          className={user.role === "mentor" ? "mentor-navigation" : undefined}
        >
          {navigation.map(([key, label]) => (
            <a
              key={key}
              href={`#${key === "roadmap" && user.role === "mentor" ? "curriculum" : key}`}
              className={`nav-item ${active === key ? "active" : ""}`}
              aria-current={active === key ? "page" : undefined}
            >
              <Icon name={key} />
              <span>
                {key === "roadmap" && user.role === "mentor"
                  ? "Curriculum"
                  : label}
              </span>
              {key === "roadmap" && data && (
                <span className="nav-count">{data.program.weeks.length}</span>
              )}
            </a>
          ))}
          {user.role === "mentor" && (
            <a
              href="#mentor"
              aria-label="Mentor workspace"
              className={`nav-item mentor-nav ${page === "mentor" ? "active" : ""}`}
              aria-current={page === "mentor" ? "page" : undefined}
            >
              <Icon name="mentor" />
              <span className="nav-full-label">Mentor workspace</span>
              <span className="nav-short-label">Mentor</span>
            </a>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-progress">
            {user.role === "mentor" ? (
              <>
                <div>
                  <span>Program at a glance</span>
                </div>
                <p>
                  {data?.program.weeks.length || 0} weeks · {total} lessons
                </p>
              </>
            ) : (
              <>
                <div>
                  <span>Your journey</span>
                  <span>{total ? Math.round((completed / total) * 100) : 0}%</span>
                </div>
                <ProgressBar
                  value={completed}
                  total={total}
                  label="Overall lesson progress"
                />
                <p>
                  {completed} of {total} lessons completed
                </p>
              </>
            )}
          </div>
          <div className="sidebar-help">
            <Icon name="leaf" size={26} />
            <h3>Learning takes practice.</h3>
            <p>
              A little curiosity. A little courage.
              <br />
              One step at a time.
            </p>
          </div>
          <div className="profile">
            <span className="avatar">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{user.name}</strong>
              <span>
                {user.role === "mentor"
                  ? "Program mentor"
                  : "Builder in the making"}
              </span>
            </div>
            <button
              className="icon-button"
              aria-label="Log out"
              onClick={onLogout}
              disabled={loggingOut}
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <span className="muted">Your workspace</span>
            <span className="breadcrumb-slash">/</span>
            <span>{pageLabel}</span>
          </div>
          <span className="topbar-note">
            <span className="status-dot" /> LEARN BY BUILDING
          </span>
        </header>
        <main
          className="main-content"
          id="main-content"
          tabIndex={-1}
          ref={main}
        >
          {error && (
            <div className="error-banner" role="alert">
              {error}
              <button className="text-button" onClick={load}>
                Try again
              </button>
            </div>
          )}
          {!data && !error && (
            <p role="status" className="loading-state">
              Getting your next chapter ready…
            </p>
          )}
          {data && (
            <>
              {page === "curriculum" &&
                (user.role === "mentor" ? (
                  <Curriculum
                    key={detail || "all"}
                    program={data.program}
                    selectedId={detail}
                  />
                ) : (
                  <div className="empty-state">
                    <h1>This preview is for mentors.</h1>
                    <a href="#roadmap">Open your roadmap</a>
                  </div>
                ))}
              {page === "today" && <Today {...props} />}
              {page === "roadmap" && <Roadmap {...props} />}
              {page === "resources" && <Resources program={data.program} />}
              {page === "project" && (
                <Project
                  key={detail || currentWeek.number}
                  {...props}
                  weekNumber={Number(detail) || currentWeek.number}
                  onRefresh={refreshJourney}
                />
              )}
              {page === "questions" && (
                <Questions
                  key={detail || "all"}
                  context={
                    data.program.lessons.find((l) => l.id === detail)?.title
                  }
                  userEmail={user.email}
                  mentor={data.program.mentor}
                />
              )}
              {page === "mentor" &&
                (user.role === "mentor" ? (
                  <Mentor program={data.program} user={user} />
                ) : (
                  <div className="empty-state">
                    <h1>This space is for mentors.</h1>
                    <a href="#today">Return to your learning studio</a>
                  </div>
                ))}
              {page === "lesson" &&
                (lesson ? (
                  user.role === "mentor" ? (
                    <Curriculum
                      key={detail}
                      program={data.program}
                      selectedId={detail}
                    />
                  ) : (
                    <>
                      <a className="back-link" href="#roadmap">
                        ← Back to your roadmap
                      </a>
                      <ConceptView
                        key={lesson.id}
                        concept={lesson}
                        userEmail={user.email}
                        week={lessonWeek}
                        resources={data.program.resources.filter((r) =>
                          lesson.resources?.includes(r.id),
                        )}
                        mentor={data.program.mentor}
                        initialStep={data.progress.steps[lesson.id]}
                        initialPrediction={data.progress.predictions[lesson.id]}
                        initialExplanation={
                          data.progress.explanations?.[lesson.id]
                        }
                        onExplanationChange={updateExplanation}
                        onProgressChange={updateProgress}
                        nextId={
                          data.program.lessons[
                            data.program.lessons.findIndex(
                              (l) => l.id === detail,
                            ) + 1
                          ]?.id
                        }
                      />
                    </>
                  )
                ) : (
                  <div className="empty-state">
                    <h1>Lesson not found.</h1>
                    <a href="#roadmap">Choose a lesson from the roadmap</a>
                  </div>
                ))}
              {![
                "today",
                "roadmap",
                "resources",
                "project",
                "questions",
                "mentor",
                "lesson",
                "curriculum",
              ].includes(page) && (
                <div className="empty-state">
                  <h1>Let’s get you back on track.</h1>
                  <a href="#today">Go to Today</a>
                </div>
              )}
            </>
          )}
        </main>
        <footer className="workspace-footer">
          <span>Built on curiosity. Grown through practice.</span>
          <span>
            SYNTREE <span className="footer-spark">✳</span>
          </span>
        </footer>
      </div>
    </div>
  )
}
