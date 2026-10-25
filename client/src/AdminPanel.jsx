import { useEffect, useState } from 'react'
import { api } from './api'
import Dashboard from './Dashboard'

function AllowlistManager({ currentUserEmail }) {
  const [entries, setEntries] = useState([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('intern')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  function loadEntries() {
    api
      .listAllowlist()
      .then(setEntries)
      .catch((err) => setError(err.message))
  }

  useEffect(loadEntries, [])

  async function handleAdd(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api.addAllowlistEntry(email.trim(), role)
      setEmail('')
      setRole('intern')
      loadEntries()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(entryEmail) {
    if (!window.confirm(`Remove ${entryEmail}? They will lose access immediately.`)) {
      return
    }
    try {
      await api.removeAllowlistEntry(entryEmail)
      loadEntries()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section>
      <h2>Admin: allowlist</h2>
      <p>Only emails listed here can register or sign in.</p>
      {error && <p role="alert">{error}</p>}
      <form onSubmit={handleAdd}>
        <label htmlFor="allowlist-email">Email</label>
        <input
          id="allowlist-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="allowlist-role">Role</label>
        <select
          id="allowlist-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="intern">Intern</option>
          <option value="mentor">Mentor</option>
        </select>
        <button type="submit" disabled={busy}>
          Add or update
        </button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Added</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.email}>
              <td>{entry.email}</td>
              <td>{entry.role}</td>
              <td>{entry.created_at}</td>
              <td>
                {entry.email !== currentUserEmail && (
                  <button type="button" onClick={() => handleRemove(entry.email)}>
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function AdminPanel({ currentUserEmail }) {
  const [users, setUsers] = useState([])
  const [error, setError] = useState(null)

  function loadUsers() {
    api
      .listUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
  }

  useEffect(loadUsers, [])

  async function handleReset(email) {
    if (!window.confirm(`Reset ${email}? They will need to register again.`)) {
      return
    }
    try {
      await api.resetUser(email)
      loadUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section>
      <AllowlistManager currentUserEmail={currentUserEmail} />

      <h2>Admin: users</h2>
      {error && <p role="alert">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Role</th>
            <th>Registered</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.email}>
              <td>{user.email}</td>
              <td>{user.name}</td>
              <td>{user.role}</td>
              <td>{user.created_at}</td>
              <td>
                {user.email !== currentUserEmail && (
                  <button type="button" onClick={() => handleReset(user.email)}>
                    Reset
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dashboard />
    </section>
  )
}

export default AdminPanel
