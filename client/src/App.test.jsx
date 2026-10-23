import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('App', () => {
  it('shows the server health status once the request resolves', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ status: 'ok' }),
    })

    render(<App />)

    expect(screen.getByText(/server status: checking/i)).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText(/server status: ok/i)).toBeInTheDocument(),
    )
  })

  it('shows unreachable when the request fails', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network error'))

    render(<App />)

    await waitFor(() =>
      expect(screen.getByText(/server status: unreachable/i)).toBeInTheDocument(),
    )
  })
})
