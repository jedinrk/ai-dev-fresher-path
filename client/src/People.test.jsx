import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, expect, it, vi } from "vitest"
import People from "./People"
import { api } from "./api"
vi.mock("./api", () => ({
  api: {
    listPeople: vi.fn(),
    listCohorts: vi.fn(),
    loginActivity: vi.fn(),
    addAllowlistEntry: vi.fn(),
    removeAllowlistEntry: vi.fn(),
    createCohort: vi.fn(),
  },
}))
const user = { email: "mentor@example.com", role: "mentor" }
beforeEach(() => {
  vi.resetAllMocks()
  api.listPeople.mockResolvedValue([
    {
      email: user.email,
      name: "Mentor",
      role: "mentor",
      registeredAt: "2026-10-01",
      lastLogin: null,
    },
    {
      email: "new@example.com",
      role: "intern",
      cohortId: 1,
      registeredAt: null,
    },
  ])
  api.listCohorts.mockResolvedValue([{ id: 1, name: "Current cohort" }])
  api.loginActivity.mockResolvedValue([])
})
it("separates pending registrations and never claims an email was sent", async () => {
  render(<People user={user} tab="invitations" />)
  expect(await screen.findByText("new@example.com")).toBeInTheDocument()
  expect(screen.getByText(/No email is sent automatically/)).toBeInTheDocument()
  expect(
    screen.queryByRole("button", { name: "Manage mentor@example.com" }),
  ).not.toBeInTheDocument()
})
it("grants registration access with the selected cohort", async () => {
  api.addAllowlistEntry.mockResolvedValue(null)
  render(<People user={user} />)
  await screen.findByText("Mentor", { selector: "strong" })
  await userEvent.click(screen.getByRole("button", { name: "Invite people +" }))
  await userEvent.type(screen.getByLabelText("Email"), "another@example.com")
  await userEvent.click(
    screen.getByRole("button", { name: "Grant registration access" }),
  )
  await waitFor(() =>
    expect(api.addAllowlistEntry).toHaveBeenCalledWith(
      "another@example.com",
      "intern",
      1,
    ),
  )
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Share the registration link",
  )
})
it("does not offer self-revocation or self role changes", async () => {
  render(<People user={user} />)
  await userEvent.click(
    await screen.findByRole("button", { name: "Manage mentor@example.com" }),
  )
  expect(screen.getByLabelText("Role")).toBeDisabled()
  expect(
    screen.queryByRole("button", { name: "Revoke access" }),
  ).not.toBeInTheDocument()
})
it("shows honest empty login history rather than invented activity", async () => {
  render(<People user={user} tab="activity" />)
  expect(
    await screen.findByText("No recorded login events for this selection."),
  ).toBeInTheDocument()
  expect(
    screen.getByText(/Tracking begins with this update/),
  ).toBeInTheDocument()
})
