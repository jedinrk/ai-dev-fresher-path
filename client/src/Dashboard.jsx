import { useEffect, useState } from 'react'
import { api } from './api'

function Dashboard() {
  const [interns, setInterns] = useState([])
  const [notes, setNotes] = useState({})
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState(null)

  function load() {
    api
      .listCheckpoints()
      .then(setInterns)
      .catch((err) => setError(err.message))
    api
      .listFlaggedQuestions()
      .then(setQuestions)
      .catch((err) => setError(err.message))
  }

  useEffect(load, [])

  async function handleAnswer(id) {
    try {
      await api.answerQuestion(id, answers[id] || '')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDismiss(id) {
    try {
      await api.dismissQuestion(id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSignOff(email, week) {
    try {
      await api.signOffCheckpoint(email, week, notes[`${email}-${week}`] || '')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleFlagToggle(email, conceptId, wrongFlag) {
    try {
      await api.flagPrediction(email, conceptId, wrongFlag)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section>
      <h2>Dashboard</h2>
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

          <h4>Predictions</h4>
          <table>
            <thead>
              <tr>
                <th>Week</th>
                <th>Concept</th>
                <th>Prediction</th>
                <th>Wrong?</th>
              </tr>
            </thead>
            <tbody>
              {intern.weeks.flatMap((week) =>
                week.predictions.map((prediction) => (
                  <tr key={prediction.conceptId}>
                    <td>{week.week}</td>
                    <td>{prediction.concept}</td>
                    <td>{prediction.text}</td>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`${prediction.concept} prediction was wrong`}
                        checked={prediction.wrongFlag}
                        onChange={(e) =>
                          handleFlagToggle(intern.email, prediction.conceptId, e.target.checked)
                        }
                      />
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      ))}

      <h3>Flagged questions</h3>
      <table>
        <thead>
          <tr>
            <th>From</th>
            <th>Question</th>
            <th>Answer</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id}>
              <td>{q.userEmail}</td>
              <td>{q.questionText}</td>
              <td>
                <input
                  type="text"
                  aria-label={`answer for question ${q.id}`}
                  value={answers[q.id] || ''}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                />
              </td>
              <td>
                <button type="button" onClick={() => handleAnswer(q.id)}>
                  Answer
                </button>
                <button type="button" onClick={() => handleDismiss(q.id)}>
                  Dismiss
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default Dashboard
