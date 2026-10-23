import { useEffect, useState } from 'react'
import { api } from './api'
import ConceptView from './ConceptView'

function Concepts() {
  const [concepts, setConcepts] = useState([])
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    api
      .listConcepts()
      .then(setConcepts)
      .catch((err) => setError(err.message))
  }, [])

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
                {concept.id}: {concept.concept}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {selected && <ConceptView key={selected.id} concept={selected} />}
    </section>
  )
}

export default Concepts
