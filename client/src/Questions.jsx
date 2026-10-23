import { useEffect, useState } from 'react'
import { api } from './api'

function Questions() {
  const [questions, setQuestions] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function load() {
    api
      .getMyQuestions()
      .then(setQuestions)
      .catch((err) => setError(err.message))
  }

  useEffect(load, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await api.askQuestion(text)
      setText('')
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <h2>Questions</h2>
      {error && <p role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>
          Ask a question
          <textarea value={text} onChange={(e) => setText(e.target.value)} required />
        </label>
        <button type="submit" disabled={submitting}>
          Submit
        </button>
      </form>

      <ul>
        {questions.map((q) => (
          <li key={q.id}>
            <p>{q.questionText}</p>
            {q.answer ? <p>Answer: {q.answer}</p> : <p>Waiting for an answer.</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Questions
