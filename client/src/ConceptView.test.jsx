import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import ConceptView from './ConceptView'

const concept = {
  id: 'F1',
  concept: 'What software is',
  predictPrompt: 'What do you think a terminal is for?',
  lesson: 'A terminal is a text interface.',
  proveTask: 'Run a command.',
}

describe('ConceptView', () => {
  it('walks through predict, learn, and prove in order', async () => {
    render(<ConceptView concept={concept} />)

    expect(screen.getByText(/what do you think a terminal is for/i)).toBeInTheDocument()
    expect(screen.queryByText(concept.lesson)).not.toBeInTheDocument()
    expect(screen.queryByText(concept.proveTask)).not.toBeInTheDocument()

    await userEvent.type(screen.getByRole('textbox'), 'My guess.')
    await userEvent.click(screen.getByRole('button', { name: /submit prediction/i }))

    expect(screen.getByText('My guess.')).toBeInTheDocument()
    expect(screen.getByText(concept.lesson)).toBeInTheDocument()
    expect(screen.queryByText(concept.proveTask)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /continue to the task/i }))

    expect(screen.getByText(concept.proveTask)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /mark as done/i }))

    expect(screen.getByText(/done for this session/i)).toBeInTheDocument()
  })
})
