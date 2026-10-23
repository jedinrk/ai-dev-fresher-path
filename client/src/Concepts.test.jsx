import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Concepts from './Concepts'
import { api } from './api'

vi.mock('./api', () => ({
  api: {
    listConcepts: vi.fn(),
    getProgress: vi.fn(),
    submitPrediction: vi.fn(),
    advanceStep: vi.fn(),
  },
}))

afterEach(() => {
  vi.clearAllMocks()
})

const sampleConcepts = [
  {
    id: 'F1',
    concept: 'What software is',
    predictPrompt: 'Guess?',
    lesson: 'Lesson text.',
    proveTask: 'Do the task.',
  },
  {
    id: 'F2',
    concept: 'Frontend, backend, database',
    predictPrompt: 'Guess again?',
    lesson: 'Another lesson.',
    proveTask: 'Another task.',
  },
]

describe('Concepts', () => {
  it('lists concepts and opens one on click', async () => {
    api.listConcepts.mockResolvedValue(sampleConcepts)
    api.getProgress.mockResolvedValue({ predictions: {}, steps: {} })

    render(<Concepts />)

    await waitFor(() => expect(screen.getByText(/F1: What software is/i)).toBeInTheDocument())
    expect(screen.queryByText('Guess?')).not.toBeInTheDocument()

    await userEvent.click(screen.getByText(/F1: What software is/i))
    expect(screen.getByText('Guess?')).toBeInTheDocument()
  })

  it('shows a checkmark for a concept already marked done', async () => {
    api.listConcepts.mockResolvedValue(sampleConcepts)
    api.getProgress.mockResolvedValue({ predictions: { F1: 'Guess.' }, steps: { F1: 'done' } })

    render(<Concepts />)

    await waitFor(() => expect(screen.getByText(/✓ F1: What software is/i)).toBeInTheDocument())
    expect(screen.getByText(/F2: Frontend, backend, database/i)).toBeInTheDocument()
  })

  it('shows an error if concepts fail to load', async () => {
    api.listConcepts.mockRejectedValue(new Error('not authenticated'))
    api.getProgress.mockResolvedValue({ predictions: {}, steps: {} })

    render(<Concepts />)

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('not authenticated'))
  })
})
