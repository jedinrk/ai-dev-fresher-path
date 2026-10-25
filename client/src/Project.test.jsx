import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import Project from "./Project"
import program from "../../content/program.json"
import { api } from "./api"

vi.mock("./api", () => ({ api: { submitCheckpoint: vi.fn() } }))
afterEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})
const user = { email: "learner@example.test", role: "intern" }
const props = {
  program,
  user,
  weekNumber: 1,
  onRefresh: vi.fn().mockResolvedValue(),
  progress: {
    steps: Object.fromEntries(program.weeks[0].ids.map((id) => [id, "done"])),
  },
  journey: { weeks: [{ week: 1, ready: true, review: null }], legacy: [] },
}

describe("project checkpoint", () => {
  it("keeps an unfinished week closed to submission", () => {
    render(<Project {...props} progress={{ steps: {} }} />)
    expect(
      screen.getByRole("button", { name: "Request mentor review" }),
    ).toBeDisabled()
    expect(
      screen.getByText(
        new RegExp(`${program.weeks[0].ids.length} remaining lessons`),
      ),
    ).toBeInTheDocument()
  })
  it("retains evidence after a failed save and submits successfully on retry", async () => {
    api.submitCheckpoint
      .mockRejectedValueOnce(new Error("Please try again."))
      .mockResolvedValueOnce({})
    render(<Project {...props} />)
    await userEvent.type(
      screen.getByLabelText("Link to your work"),
      "https://github.com/example/work",
    )
    await userEvent.type(
      screen.getByLabelText(/what did you build/i),
      "I built and tested a task list with blank input checks.",
    )
    await userEvent.click(
      screen.getByRole("button", { name: "Request mentor review" }),
    )
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please try again.",
    )
    expect(screen.getByLabelText("Link to your work")).toHaveValue(
      "https://github.com/example/work",
    )
    await userEvent.click(
      screen.getByRole("button", { name: "Request mentor review" }),
    )
    expect(
      await screen.findByText("Your work is with your mentor."),
    ).toBeInTheDocument()
    expect(api.submitCheckpoint).toHaveBeenLastCalledWith(1, {
      evidenceUrl: "https://github.com/example/work",
      summary: "I built and tested a task list with blank input checks.",
    })
  })
  it("shows feedback and reopens a requested revision after refreshing", async () => {
    const submitted = {
      status: "submitted",
      evidenceUrl: "https://example.com/work",
      summary: "Work with enough detail to review.",
    }
    const view = render(
      <Project
        {...props}
        journey={{ weeks: [{ week: 1, ready: true, review: submitted }] }}
      />,
    )
    expect(screen.queryByLabelText("Link to your work")).not.toBeInTheDocument()
    view.rerender(
      <Project
        {...props}
        journey={{
          weeks: [
            {
              week: 1,
              ready: true,
              review: {
                ...submitted,
                status: "changes_requested",
                mentorNotes: "Please explain the test.",
              },
            },
          ],
        }}
      />,
    )
    await userEvent.click(
      screen.getByRole("button", { name: "Refresh review status" }),
    )
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Resubmit for review" }),
      ).toBeEnabled(),
    )
    expect(screen.getByText("Please explain the test.")).toBeInTheDocument()
  })
})
