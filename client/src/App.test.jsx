import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import App from "./App"
import { api } from "./api"
import program from "../../content/program.json"
import { plainText } from "./plaintext"

vi.mock("./api", () => ({
  api: {
    me: vi.fn(),
    getProgram: vi.fn(),
    getJourney: vi.fn(),
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
    saveExplanation: vi.fn(),
  },
}))

beforeEach(() => {
  window.location.hash = "today"
  api.getProgram.mockResolvedValue(program)
  api.getJourney.mockResolvedValue({
    weeks: program.weeks.map((w) => ({
      week: w.number,
      completed: 0,
      total: 5,
      ready: false,
      review: null,
    })),
    legacy: [],
  })
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
  vi.spyOn(global, "fetch").mockResolvedValue({
    json: async () => ({ status: "ok" }),
  })
}

describe("App", () => {
  it("opens the complete mentor lesson preview without a prediction gate", async () => {
    window.location.hash = "lesson/L35"
    api.me.mockResolvedValue({
      email: "mentor@example.com",
      name: "Mentor",
      role: "mentor",
    })
    render(<App />)
    expect(
      await screen.findByText(
        plainText(program.lessons.find((lesson) => lesson.id === "L35").byHand.task),
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /curriculum/i })).toHaveAttribute(
      "href",
      "#curriculum",
    )
    expect(
      screen.queryByRole("button", { name: /submit prediction/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("progressbar", { name: "Overall lesson progress" }),
    ).not.toBeInTheDocument()
    expect(screen.getByText("Program at a glance")).toBeInTheDocument()
  })

  it("keeps the mentor preview out of the learner navigation and direct route", async () => {
    window.location.hash = "curriculum"
    api.me.mockResolvedValue({
      email: "intern@example.com",
      name: "Intern",
      role: "intern",
    })
    render(<App />)
    expect(
      await screen.findByRole("heading", {
        name: "This preview is for mentors.",
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: /^curriculum/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        (_, el) =>
          el.tagName === "P" &&
          el.textContent === plainText(program.lessons[0].byHand.task),
      ),
    ).not.toBeInTheDocument()
  })

  it("shows the login form when there is no session", async () => {
    mockHealthFetch()
    api.me.mockRejectedValue({ status: 401 })

    render(<App />)

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /log in/i }),
      ).toBeInTheDocument(),
    )
  })

  it("shows the signed-in view for an intern, with no admin panel toggle", async () => {
    mockHealthFetch()
    api.me.mockResolvedValue({
      email: "intern@example.com",
      name: "Intern",
      role: "intern",
    })

    render(<App />)

    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: /start learning/i }),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText("Intern")).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: /mentor workspace/i }),
    ).not.toBeInTheDocument()
  })

  it("shows mentor navigation and logs out", async () => {
    mockHealthFetch()
    api.me.mockResolvedValue({
      email: "mentor@example.com",
      name: "Mentor",
      role: "mentor",
    })
    api.logout.mockResolvedValue()

    render(<App />)

    await waitFor(() =>
      expect(
        screen.getByText("Mentor", { selector: "strong" }),
      ).toBeInTheDocument(),
    )
    expect(
      screen.getByRole("link", { name: /mentor workspace/i }),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /log out/i }))
    expect(api.logout).toHaveBeenCalled()
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /log in/i }),
      ).toBeInTheDocument(),
    )
  })
})
