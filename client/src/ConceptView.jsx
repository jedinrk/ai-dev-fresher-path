import { useState } from 'react'
import { api } from './api'

function ConceptView({ concept, initialStep, initialPrediction, onProgressChange }) {
  const [step, setStep] = useState(initialStep || 'predict')
  const [prediction, setPrediction] = useState(initialPrediction || '')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handlePredictSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await api.submitPrediction(concept.id, prediction)
      setStep('learn')
      onProgressChange(concept.id, 'learn', prediction)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function advance(nextStep) {
    setError(null)
    try {
      await api.advanceStep(concept.id, nextStep)
      setStep(nextStep)
      onProgressChange(concept.id, nextStep)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <article>
      <h3>
        {concept.id}: {concept.concept}
      </h3>

      {error && <p role="alert">{error}</p>}

      <section>
        <h4>Predict</h4>
        {step === 'predict' ? (
          <form onSubmit={handlePredictSubmit}>
            <label>
              {concept.predictPrompt}
              <textarea
                value={prediction}
                onChange={(e) => setPrediction(e.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={submitting}>
              Submit prediction
            </button>
          </form>
        ) : (
          <p>{prediction}</p>
        )}
      </section>

      {step !== 'predict' && (
        <section>
          <h4>Learn</h4>
          <p>{concept.lesson}</p>
          {step === 'learn' && (
            <button type="button" onClick={() => advance('prove')}>
              Continue to the task
            </button>
          )}
        </section>
      )}

      {(step === 'prove' || step === 'done') && (
        <section>
          <h4>Prove</h4>
          <p>{concept.proveTask}</p>
          {step === 'prove' && (
            <button type="button" onClick={() => advance('done')}>
              Mark as done
            </button>
          )}
          {step === 'done' && <p>Done.</p>}
        </section>
      )}
    </article>
  )
}

export default ConceptView
