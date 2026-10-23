import { useState } from 'react'
import { api } from './api'

function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const user =
        mode === 'login'
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
    <form onSubmit={handleSubmit}>
      <h1>{mode === 'login' ? 'Log in' : 'Create your account'}</h1>

      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      {mode === 'register' && (
        <label>
          Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
      )}

      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </label>

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={submitting}>
        {mode === 'login' ? 'Log in' : 'Register'}
      </button>

      <p>
        {mode === 'login' ? (
          <>
            First time here?{' '}
            <button type="button" onClick={() => setMode('register')}>
              Create an account
            </button>
          </>
        ) : (
          <>
            Already registered?{' '}
            <button type="button" onClick={() => setMode('login')}>
              Log in
            </button>
          </>
        )}
      </p>
    </form>
  )
}

export default AuthForm
