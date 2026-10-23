import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { api } from './api'

vi.mock('./api', () => ({
  api: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    listUsers: vi.fn(),
    resetUser: vi.fn(),
    listConcepts: vi.fn(),
    getProgress: vi.fn(),
    listCheckpoints: vi.fn(),
    getMyQuestions: vi.fn(),
    askQuestion: vi.fn(),
  },
}))

beforeEach(() => {
  api.listConcepts.mockResolvedValue([])
  api.getProgress.mockResolvedValue({ predictions: {}, steps: {} })
  api.listCheckpoints.mockResolvedValue([])
  api.getMyQuestions.mockResolvedValue([])
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

function mockHealthFetch() {
  vi.spyOn(global, 'fetch').mockResolvedValue({ json: async () => ({ status: 'ok' }) })
}

describe('App', () => {
  it('shows the login form when there is no session', async () => {
    mockHealthFetch()
    api.me.mockRejectedValue({ status: 401 })

    render(<App />)

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument(),
    )
  })

  it('shows the signed-in view for an intern, with no admin panel toggle', async () => {
    mockHealthFetch()
    api.me.mockResolvedValue({ email: 'intern@example.com', name: 'Intern', role: 'intern' })

    render(<App />)

    await waitFor(() => expect(screen.getByText(/signed in as intern/i)).toBeInTheDocument())
    expect(screen.queryByText(/admin panel/i)).not.toBeInTheDocument()
  })

  it('shows the admin panel toggle for a mentor and logs out', async () => {
    mockHealthFetch()
    api.me.mockResolvedValue({ email: 'mentor@example.com', name: 'Mentor', role: 'mentor' })
    api.logout.mockResolvedValue()

    render(<App />)

    await waitFor(() => expect(screen.getByText(/signed in as mentor/i)).toBeInTheDocument())
    expect(screen.getByText(/show admin panel/i)).toBeInTheDocument()

    await userEvent.click(screen.getByText(/log out/i))
    expect(api.logout).toHaveBeenCalled()
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument(),
    )
  })
})
