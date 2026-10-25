import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminPanel from './AdminPanel'
import { api } from './api'

vi.mock('./api', () => ({
  api: {
    listUsers: vi.fn(),
    resetUser: vi.fn(),
    listCheckpoints: vi.fn(),
    signOffCheckpoint: vi.fn(),
    flagPrediction: vi.fn(),
    listFlaggedQuestions: vi.fn(),
    answerQuestion: vi.fn(),
    dismissQuestion: vi.fn(),
    listAllowlist: vi.fn(),
    addAllowlistEntry: vi.fn(),
    removeAllowlistEntry: vi.fn(),
  },
}))

beforeEach(() => {
  api.listCheckpoints.mockResolvedValue([])
  api.listFlaggedQuestions.mockResolvedValue([])
  api.listAllowlist.mockResolvedValue([])
  api.listUsers.mockResolvedValue([])
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('AdminPanel', () => {
  it('lists users and hides the reset button for the current user', async () => {
    api.listUsers.mockResolvedValue([
      { email: 'mentor@example.com', name: 'Mentor', role: 'mentor', created_at: 'now' },
      { email: 'intern@example.com', name: 'Intern', role: 'intern', created_at: 'now' },
    ])

    render(<AdminPanel currentUserEmail="mentor@example.com" />)

    await waitFor(() => expect(screen.getByText('intern@example.com')).toBeInTheDocument())
    expect(screen.getAllByRole('button', { name: /reset/i })).toHaveLength(1)
  })

  it('resets a user after confirmation and reloads the list', async () => {
    api.listUsers
      .mockResolvedValueOnce([
        { email: 'intern@example.com', name: 'Intern', role: 'intern', created_at: 'now' },
      ])
      .mockResolvedValueOnce([])
    api.resetUser.mockResolvedValue()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<AdminPanel currentUserEmail="mentor@example.com" />)

    await waitFor(() => expect(screen.getByText('intern@example.com')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /reset/i }))

    await waitFor(() => expect(api.resetUser).toHaveBeenCalledWith('intern@example.com'))
    await waitFor(() => expect(screen.queryByText('intern@example.com')).not.toBeInTheDocument())
  })

  it('lists the allowlist and hides the remove button for the current user', async () => {
    api.listAllowlist.mockResolvedValue([
      { email: 'mentor@example.com', role: 'mentor', created_at: 'now' },
      { email: 'intern@example.com', role: 'intern', created_at: 'now' },
    ])

    render(<AdminPanel currentUserEmail="mentor@example.com" />)

    await waitFor(() => expect(screen.getByText('intern@example.com')).toBeInTheDocument())
    expect(screen.getAllByRole('button', { name: /remove/i })).toHaveLength(1)
  })

  it('adds a new allowlist entry and reloads the list', async () => {
    api.listAllowlist
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { email: 'newbie@example.com', role: 'intern', created_at: 'now' },
      ])
    api.addAllowlistEntry.mockResolvedValue()

    render(<AdminPanel currentUserEmail="mentor@example.com" />)

    await userEvent.type(screen.getByLabelText('Email'), 'newbie@example.com')
    await userEvent.click(screen.getByRole('button', { name: /add or update/i }))

    await waitFor(() =>
      expect(api.addAllowlistEntry).toHaveBeenCalledWith('newbie@example.com', 'intern'),
    )
    await waitFor(() => expect(screen.getByText('newbie@example.com')).toBeInTheDocument())
  })

  it('removes an allowlist entry after confirmation', async () => {
    api.listAllowlist
      .mockResolvedValueOnce([
        { email: 'intern@example.com', role: 'intern', created_at: 'now' },
      ])
      .mockResolvedValueOnce([])
    api.removeAllowlistEntry.mockResolvedValue()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<AdminPanel currentUserEmail="mentor@example.com" />)

    await waitFor(() => expect(screen.getByText('intern@example.com')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /remove/i }))

    await waitFor(() =>
      expect(api.removeAllowlistEntry).toHaveBeenCalledWith('intern@example.com'),
    )
    await waitFor(() => expect(screen.queryByText('intern@example.com')).not.toBeInTheDocument())
  })
})
