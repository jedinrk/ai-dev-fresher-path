import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Questions from './Questions'
import { api } from './api'

vi.mock('./api', () => ({
  api: { getMyQuestions: vi.fn(), askQuestion: vi.fn() },
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('Questions', () => {
  it('shows past questions, with answers when present', async () => {
    api.getMyQuestions.mockResolvedValue([
      { id: 1, questionText: 'What is a lockfile?', answer: 'It pins versions.' },
      { id: 2, questionText: 'What is CI?', answer: null },
    ])

    render(<Questions />)

    await waitFor(() => expect(screen.getByText('What is a lockfile?')).toBeInTheDocument())
    expect(screen.getByText('Answer: It pins versions.')).toBeInTheDocument()
    expect(screen.getByText('What is CI?')).toBeInTheDocument()
    expect(screen.getByText('Waiting for an answer.')).toBeInTheDocument()
  })

  it('submits a new question and reloads the list', async () => {
    api.getMyQuestions.mockResolvedValueOnce([]).mockResolvedValueOnce([
      { id: 1, questionText: 'What is a lockfile?', answer: null },
    ])
    api.askQuestion.mockResolvedValue()

    render(<Questions />)

    await waitFor(() => expect(api.getMyQuestions).toHaveBeenCalledTimes(1))

    await userEvent.type(screen.getByLabelText(/ask a question/i), 'What is a lockfile?')
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => expect(api.askQuestion).toHaveBeenCalledWith('What is a lockfile?'))
    await waitFor(() => expect(screen.getByText('What is a lockfile?')).toBeInTheDocument())
  })

  it('shows an error if asking fails', async () => {
    api.getMyQuestions.mockResolvedValue([])
    api.askQuestion.mockRejectedValue(new Error('question text is required'))

    render(<Questions />)

    await userEvent.type(screen.getByLabelText(/ask a question/i), 'x')
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('question text is required'),
    )
  })
})
