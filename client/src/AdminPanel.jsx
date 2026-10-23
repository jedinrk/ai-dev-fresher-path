import { useEffect, useState } from 'react'
import { api } from './api'
import Dashboard from './Dashboard'

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
