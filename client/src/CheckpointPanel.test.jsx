import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CheckpointPanel from './CheckpointPanel'
import { api } from './api'

vi.mock('./api', () => ({
  api: { listCheckpoints: vi.fn(), signOffCheckpoint: vi.fn() },
}))

afterEach(() => {
  vi.clearAllMocks()
})

function sampleIntern(overrides = {}) {
  return {
    email: 'intern@example.com',
    name: 'Intern',
    weeks: [
      { week: 1, gatePassed: false, signedOffAt: null, mentorNotes: '' },
      { week: 2, gatePassed: false, signedOffAt: null, mentorNotes: '' },
      { week: 3, gatePassed: false, signedOffAt: null, mentorNotes: '' },
      { week: 4, gatePassed: false, signedOffAt: null, mentorNotes: '' },
    ],
    ...overrides,
  }
}

describe('CheckpointPanel', () => {
  it('disables sign-off until the gate is passed', async () => {
    api.listCheckpoints.mockResolvedValue([sampleIntern()])

    render(<CheckpointPanel />)

    await waitFor(() => expect(screen.getByText('Intern')).toBeInTheDocument())
    const signOffButtons = screen.getAllByRole('button', { name: /sign off/i })
    expect(signOffButtons[0]).toBeDisabled()
  })

  it('signs off a passed gate with notes', async () => {
    const intern = sampleIntern({
      weeks: [
        { week: 1, gatePassed: true, signedOffAt: null, mentorNotes: '' },
        { week: 2, gatePassed: false, signedOffAt: null, mentorNotes: '' },
        { week: 3, gatePassed: false, signedOffAt: null, mentorNotes: '' },
        { week: 4, gatePassed: false, signedOffAt: null, mentorNotes: '' },
      ],
    })
    api.listCheckpoints.mockResolvedValueOnce([intern]).mockResolvedValueOnce([
      {
        ...intern,
        weeks: [
          { week: 1, gatePassed: true, signedOffAt: '2026-01-01', mentorNotes: 'Great work' },
          ...intern.weeks.slice(1),
        ],
      },
    ])
    api.signOffCheckpoint.mockResolvedValue()

    render(<CheckpointPanel />)

    await waitFor(() => expect(screen.getByText('Intern')).toBeInTheDocument())
    const notesInput = screen.getByLabelText(/notes for intern@example.com week 1/i)
    await userEvent.type(notesInput, 'Great work')

    const signOffButtons = screen.getAllByRole('button', { name: /sign off/i })
    expect(signOffButtons[0]).toBeEnabled()
    await userEvent.click(signOffButtons[0])

    await waitFor(() =>
      expect(api.signOffCheckpoint).toHaveBeenCalledWith(
        'intern@example.com',
        1,
        'Great work',
      ),
    )
    await waitFor(() => expect(screen.getByText('2026-01-01')).toBeInTheDocument())
  })
})
