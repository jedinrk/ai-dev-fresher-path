import { useEffect, useState } from "react"
import { api } from "./api"
import AuthForm from "./AuthForm"
import Studio from "./Studio"
import { Brand, BuildIllustration } from "./ui"
import { clearDrafts } from "./drafts"

export default function App() {
  const [user, setUser] = useState(undefined)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  function checkSession() {
    api
      .me()
      .then(setUser)
      .catch((err) => {
        if (err.status === 401 || err.status === 403) setUser(null)
        else
          setError("We couldn’t reach your learning studio. Please try again.")
      })
  }
  useEffect(checkSession, [])
  async function logout() {
    setBusy(true)
    try {
      await api.logout()
      clearDrafts(user.email)
      setUser(null)
      window.location.hash = "today"
      setError("")
    } catch {
      setError("We couldn’t log you out. Please try again.")
    } finally {
      setBusy(false)
    }
  }
  if (user === undefined)
    return (
      <main className="loading-screen">
        <Brand />
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button onClick={checkSession}>Try again</button>
          </>
        ) : (
          <p role="status">Opening your learning studio…</p>
        )}
      </main>
    )
  if (!user)
    return (
      <main className="auth-layout">
        <section className="auth-story">
          <Brand />
          <div>
            <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
            <h1>
              Small steps.
              <br />
              <em>Real things.</em>
            </h1>
            <p>
              Learn how software works. Build with AI.
              <br />
              Make your first real contribution.
            </p>
            <BuildIllustration />
          </div>
          <p className="auth-footer">
            Weekly mentor review <span>·</span> Hands-on learning{" "}
            <span>·</span> Made for your first build
          </p>
        </section>
        <section className="auth-panel">
          <AuthForm
            onAuthenticated={(next) => {
              setUser(next)
              setError("")
            }}
          />
          <p className="muted small">
            An invitation-only space for your internship journey.
          </p>
        </section>
      </main>
    )
  return (
    <>
      <Studio
        key={user.email}
        user={user}
        onLogout={logout}
        loggingOut={busy}
      />
      {error && (
        <div className="global-alert" role="alert">
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}
    </>
  )
}
