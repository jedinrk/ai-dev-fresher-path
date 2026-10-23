import { useEffect, useState } from 'react'
import { api } from './api'
import ConceptView from './ConceptView'

function Concepts() {
  const [concepts, setConcepts] = useState([])
  const [progress, setProgress] = useState({ predictions: {}, steps: {} })
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    Promise.all([api.listConcepts(), api.getProgress()])
      .then(([conceptList, progressData]) => {
        setConcepts(conceptList)
        setProgress(progressData)
      })
      .catch((err) => setError(err.message))
  }, [])

  function handleProgressChange(conceptId, step, prediction) {
    setProgress((prev) => ({
      steps: { ...prev.steps, [conceptId]: step },
      predictions:
        prediction !== undefined
          ? { ...prev.predictions, [conceptId]: prediction }
          : prev.predictions,
    }))
  }

  if (error) {
    return <p role="alert">{error}</p>
  }

  const selected = concepts.find((c) => c.id === selectedId)

  return (
    <section>
      <h2>Foundations</h2>
      <nav>
        <ul>
          {concepts.map((concept) => (
            <li key={concept.id}>
              <button type="button" onClick={() => setSelectedId(concept.id)}>
                {progress.steps[concept.id] === 'done' ? '✓ ' : ''}
                {concept.id}: {concept.concept}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {selected && (
        <ConceptView
          key={selected.id}
          concept={selected}
          initialStep={progress.steps[selected.id]}
          initialPrediction={progress.predictions[selected.id]}
          onProgressChange={handleProgressChange}
        />
      )}
    </section>
  )
}

export default Concepts
