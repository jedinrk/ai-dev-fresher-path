import { useState } from "react"
import { api } from "./api"

function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const user =
        mode === "login"
          ? await api.login({ email, password })
          : await api.register({ email, name, password })
      onAuthenticated(user)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <p className="eyebrow">YOUR LEARNING STUDIO</p>
      <h1>{mode === "login" ? "Log in" : "Create your account"}</h1>
      <p className="muted">
        {mode === "login"
          ? "Welcome back. Pick up where you left off."
          : "Use the email address your mentor invited."}
      </p>

      <label>
        Email
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      {mode === "register" && (
        <label>
          Name
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
      )}

      <label>
        Password
        <input
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </label>

      {error && <p role="alert">{error}</p>}

      <button className="button primary" type="submit" disabled={submitting}>
        {submitting ? "One moment…" : mode === "login" ? "Log in" : "Register"}
      </button>

      <p>
        {mode === "login" ? (
          <>
            First time here?{" "}
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setMode("register")
                setError(null)
              }}
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already registered?{" "}
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setMode("login")
                setError(null)
              }}
            >
              Log in
            </button>
          </>
        )}
      </p>
    </form>
  )
}

export default AuthForm
