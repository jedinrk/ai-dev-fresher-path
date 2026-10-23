import { useEffect, useState } from 'react'
import { api } from './api'

function CheckpointPanel() {
  const [interns, setInterns] = useState([])
  const [notes, setNotes] = useState({})
  const [error, setError] = useState(null)

  function load() {
    api
      .listCheckpoints()
      .then(setInterns)
      .catch((err) => setError(err.message))
  }

  useEffect(load, [])

  async function handleSignOff(email, week) {
    try {
      await api.signOffCheckpoint(email, week, notes[`${email}-${week}`] || '')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section>
      <h2>Checkpoints</h2>
      {error && <p role="alert">{error}</p>}
      {interns.map((intern) => (
        <div key={intern.email}>
          <h3>{intern.name}</h3>
          <table>
            <thead>
              <tr>
                <th>Week</th>
                <th>Gate</th>
                <th>Signed off</th>
                <th>Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {intern.weeks.map((week) => (
                <tr key={week.week}>
                  <td>{week.week}</td>
                  <td>{week.gatePassed ? 'passed' : 'not yet'}</td>
                  <td>{week.signedOffAt ? week.signedOffAt : '-'}</td>
                  <td>
                    {week.signedOffAt ? (
                      week.mentorNotes
                    ) : (
                      <input
                        type="text"
                        aria-label={`notes for ${intern.email} week ${week.week}`}
                        value={notes[`${intern.email}-${week.week}`] || ''}
                        onChange={(e) =>
                          setNotes((prev) => ({
                            ...prev,
                            [`${intern.email}-${week.week}`]: e.target.value,
                          }))
                        }
                      />
                    )}
                  </td>
                  <td>
                    {!week.signedOffAt && (
                      <button
                        type="button"
                        disabled={!week.gatePassed}
                        onClick={() => handleSignOff(intern.email, week.week)}
                      >
                        Sign off
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  )
}

export default CheckpointPanel
