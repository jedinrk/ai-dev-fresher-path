import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Dashboard from './Dashboard'
import { api } from './api'

vi.mock('./api', () => ({
  api: { listCheckpoints: vi.fn(), signOffCheckpoint: vi.fn(), flagPrediction: vi.fn() },
}))

afterEach(() => {
  vi.clearAllMocks()
})

function sampleIntern(overrides = {}) {
  return {
    email: 'intern@example.com',
    name: 'Intern',
    weeks: [
      { week: 1, gatePassed: false, signedOffAt: null, mentorNotes: '', predictions: [] },
      { week: 2, gatePassed: false, signedOffAt: null, mentorNotes: '', predictions: [] },
      { week: 3, gatePassed: false, signedOffAt: null, mentorNotes: '', predictions: [] },
      { week: 4, gatePassed: false, signedOffAt: null, mentorNotes: '', predictions: [] },
    ],
    ...overrides,
  }
}

describe('Dashboard', () => {
  it('disables sign-off until the gate is passed', async () => {
    api.listCheckpoints.mockResolvedValue([sampleIntern()])

    render(<Dashboard />)

    await waitFor(() => expect(screen.getByText('Intern')).toBeInTheDocument())
    const signOffButtons = screen.getAllByRole('button', { name: /sign off/i })
    expect(signOffButtons[0]).toBeDisabled()
  })

  it('signs off a passed gate with notes', async () => {
    const intern = sampleIntern({
      weeks: [
        { week: 1, gatePassed: true, signedOffAt: null, mentorNotes: '', predictions: [] },
        ...sampleIntern().weeks.slice(1),
      ],
    })
    api.listCheckpoints.mockResolvedValueOnce([intern]).mockResolvedValueOnce([
      {
        ...intern,
        weeks: [
          {
            week: 1,
            gatePassed: true,
            signedOffAt: '2026-01-01',
            mentorNotes: 'Great work',
            predictions: [],
          },
          ...intern.weeks.slice(1),
        ],
      },
    ])
    api.signOffCheckpoint.mockResolvedValue()

    render(<Dashboard />)

    await waitFor(() => expect(screen.getByText('Intern')).toBeInTheDocument())
    const notesInput = screen.getByLabelText(/notes for intern@example.com week 1/i)
    await userEvent.type(notesInput, 'Great work')

    const signOffButtons = screen.getAllByRole('button', { name: /sign off/i })
    expect(signOffButtons[0]).toBeEnabled()
    await userEvent.click(signOffButtons[0])

    await waitFor(() =>
      expect(api.signOffCheckpoint).toHaveBeenCalledWith('intern@example.com', 1, 'Great work'),
    )
    await waitFor(() => expect(screen.getByText('2026-01-01')).toBeInTheDocument())
  })

  it('lists submitted predictions and toggles the wrong flag', async () => {
    const intern = sampleIntern({
      weeks: [
        {
          week: 1,
          gatePassed: false,
          signedOffAt: null,
          mentorNotes: '',
          predictions: [
            {
              conceptId: 'F1',
              concept: 'What software is',
              text: 'A terminal runs commands.',
              wrongFlag: false,
            },
          ],
        },
        ...sampleIntern().weeks.slice(1),
      ],
    })
    api.listCheckpoints.mockResolvedValue([intern])
    api.flagPrediction.mockResolvedValue()

    render(<Dashboard />)

    await waitFor(() =>
      expect(screen.getByText('A terminal runs commands.')).toBeInTheDocument(),
    )

    const checkbox = screen.getByRole('checkbox', {
      name: /what software is prediction was wrong/i,
    })
    expect(checkbox).not.toBeChecked()

    await userEvent.click(checkbox)

    await waitFor(() =>
      expect(api.flagPrediction).toHaveBeenCalledWith('intern@example.com', 'F1', true),
    )
  })
})
