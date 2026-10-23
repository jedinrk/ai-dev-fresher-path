import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AdminPanel from './AdminPanel'
import { api } from './api'

vi.mock('./api', () => ({
  api: { listUsers: vi.fn(), resetUser: vi.fn() },
}))

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
})
