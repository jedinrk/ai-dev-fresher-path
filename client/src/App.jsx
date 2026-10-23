import { useEffect, useState } from 'react'
import AdminPanel from './AdminPanel'
import { api } from './api'
import AuthForm from './AuthForm'
import Concepts from './Concepts'

function App() {
  const [user, setUser] = useState(undefined)
  const [status, setStatus] = useState('checking...')
  const [showAdmin, setShowAdmin] = useState(false)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('unreachable'))
  }, [])

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => setUser(null))
  }, [])

  async function handleLogout() {
    await api.logout()
    setUser(null)
    setShowAdmin(false)
  }

  if (user === undefined) {
    return (
      <main>
        <p>Loading...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main>
        <AuthForm onAuthenticated={setUser} />
      </main>
    )
  }

  return (
    <main>
      <h1>Learning App</h1>
      <p>
        Signed in as {user.name} ({user.email}, {user.role}){' '}
        <button type="button" onClick={handleLogout}>
          Log out
        </button>
      </p>

      {user.role === 'mentor' && (
        <p>
          <button type="button" onClick={() => setShowAdmin((v) => !v)}>
            {showAdmin ? 'Hide admin panel' : 'Show admin panel'}
          </button>
        </p>
      )}

      {user.role === 'mentor' && showAdmin && <AdminPanel currentUserEmail={user.email} />}

      <Concepts />

      <p>Server status: {status}</p>
    </main>
  )
}

export default App
