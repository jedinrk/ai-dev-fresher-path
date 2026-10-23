import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AuthForm from './AuthForm'
import { api } from './api'

vi.mock('./api', () => ({
  api: { login: vi.fn(), register: vi.fn() },
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('AuthForm', () => {
  it('logs in by default', async () => {
    const onAuthenticated = vi.fn()
    api.login.mockResolvedValue({ email: 'a@b.com', name: 'A', role: 'intern' })

    render(<AuthForm onAuthenticated={onAuthenticated} />)

    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() =>
      expect(api.login).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password123' }),
    )
    expect(onAuthenticated).toHaveBeenCalledWith({
      email: 'a@b.com',
      name: 'A',
      role: 'intern',
    })
  })

  it('switches to registration and shows a name field', async () => {
    const onAuthenticated = vi.fn()
    api.register.mockResolvedValue({ email: 'a@b.com', name: 'A', role: 'intern' })

    render(<AuthForm onAuthenticated={onAuthenticated} />)

    await userEvent.click(screen.getByText(/create an account/i))
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/name/i), 'A')
    await userEvent.type(screen.getByLabelText(/password/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => expect(api.register).toHaveBeenCalled())
  })

  it('shows the server error message on failure', async () => {
    api.login.mockRejectedValue(new Error('invalid email or password'))

    render(<AuthForm onAuthenticated={vi.fn()} />)

    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('invalid email or password'),
    )
  })
})
