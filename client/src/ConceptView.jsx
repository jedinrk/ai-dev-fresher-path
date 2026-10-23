import { useState } from 'react'

function ConceptView({ concept }) {
  const [step, setStep] = useState('predict')
  const [prediction, setPrediction] = useState('')

  return (
    <article>
      <h3>
        {concept.id}: {concept.concept}
      </h3>

      <section>
        <h4>Predict</h4>
        {step === 'predict' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setStep('learn')
            }}
          >
            <label>
              {concept.predictPrompt}
              <textarea
                value={prediction}
                onChange={(e) => setPrediction(e.target.value)}
                required
              />
            </label>
            <button type="submit">Submit prediction</button>
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
            <button type="button" onClick={() => setStep('prove')}>
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
            <button type="button" onClick={() => setStep('done')}>
              Mark as done
            </button>
          )}
          {step === 'done' && <p>Done for this session.</p>}
        </section>
      )}
    </article>
  )
}

export default ConceptView
