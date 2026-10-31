import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, expect, it, vi } from "vitest"
import Mentor from "./Mentor"
import { api } from "./api"
import program from "../../content/program.json"

vi.mock("./api", () => ({
  api: {
    listReviews: vi.fn(),
    listCohorts: vi.fn(),
    getLearner: vi.fn(),
    reviewCheckpoint: vi.fn(),
    answerQuestion: vi.fn(),
  },
}))
const email = "learner@example.com"
let person
beforeEach(() => {
  vi.resetAllMocks()
  person = {
    email,
    name: "Aarav",
    cohort: { id: 1, name: "October" },
    joinedAt: "2026-10-01 12:00:00",
    lastLearningActivity: null,
    weeks: program.weeks.map((w, i) => ({
      week: w.number,
      completed: i === 0 ? w.ids.length : 0,
      total: w.ids.length,
      ready: i === 0,
      review:
        i === 0
          ? {
              status: "submitted",
              evidenceUrl: "https://example.com/work",
              summary: "Evidence for my first week.",
            }
          : null,
    })),
    progress: [{ concept_id: "L01", step: "done" }],
    predictions: [
      {
        concept_id: "L01",
        text: "My unedited guess.",
        created_at: "2026-10-01 12:00:00",
      },
    ],
    explanations: [],
    questions: [
      {
        id: 1,
        questionText: "Earlier question",
        answer: "Earlier reply",
        flagged: false,
        conceptId: "L01",
      },
    ],
    legacy: [],
    history: [],
    questionCount: 0,
  }
  api.listReviews.mockResolvedValue([person])
  api.listCohorts.mockResolvedValue([{ id: 1, name: "October" }])
  api.getLearner.mockResolvedValue(person)
})

it("links each learner profile with cohort and filter context and contains no account controls", async () => {
  render(<Mentor program={program} route="mentor?cohort=1&filter=review" />)
  const link = await screen.findByRole("link", {
    name: "View Aarav's profile",
  })
  expect(link.getAttribute("href")).toBe(
    "#mentor/learner%40example.com/progress?cohort=1&filter=review",
  )
  expect(
    screen.queryByRole("button", { name: /reset|remove|revoke/i }),
  ).not.toBeInTheDocument()
  expect(screen.getByLabelText("Cohort")).toHaveValue("1")
})

it("shows responses independently of submission state and uses the real prediction prompt", async () => {
  person.weeks[0].review.status = "approved"
  render(
    <Mentor
      program={program}
      route="mentor/learner%40example.com/responses/1/L01"
    />,
  )
  expect(await screen.findByText("My unedited guess.")).toBeInTheDocument()
  expect(screen.getByText(program.lessons[0].predictPrompt)).toBeInTheDocument()
  expect(screen.getByText(program.lessons[0].reflection)).toBeInTheDocument()
  expect(screen.getByText("No saved response yet.")).toBeInTheDocument()
  expect(
    screen.getByText(/Self-check attempts and unsaved drafts/),
  ).toBeInTheDocument()
})

it("keeps answered questions and mentor replies visible", async () => {
  render(
    <Mentor program={program} route="mentor/learner%40example.com/questions" />,
  )
  expect(await screen.findByText("Earlier reply")).toBeInTheDocument()
  expect(screen.getByText("Earlier question")).toBeInTheDocument()
  expect(
    screen.queryByRole("button", { name: "Send reply" }),
  ).not.toBeInTheDocument()
})

it("preserves feedback on failure and distinguishes a saved review from refresh failure", async () => {
  api.reviewCheckpoint
    .mockRejectedValueOnce(new Error("Connection lost"))
    .mockResolvedValueOnce(null)
  render(
    <Mentor program={program} route="mentor/learner%40example.com/reviews/1" />,
  )
  const feedback = await screen.findByLabelText("Feedback for Aarav")
  const requestChanges = screen.getByRole("button", {
    name: "Request changes",
  })
  expect(requestChanges).toBeDisabled()
  await userEvent.type(feedback, "Show a restart test.")
  await userEvent.click(requestChanges)
  expect(await screen.findByRole("alert")).toHaveTextContent("Connection lost")
  expect(feedback).toHaveValue("Show a restart test.")
  api.getLearner.mockRejectedValueOnce(new Error("Refresh failed"))
  await userEvent.click(requestChanges)
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your changes were saved",
    ),
  )
  expect(
    screen.getByRole("button", { name: "Sign off checkpoint" }),
  ).toBeDisabled()
  expect(api.reviewCheckpoint).toHaveBeenLastCalledWith(email, 1, {
    status: "changes_requested",
    notes: "Show a restart test.",
  })
})

it("offers recovery for a missing profile and a clear empty filter result", async () => {
  api.getLearner.mockRejectedValue(new Error("Learner not found."))
  const { unmount } = render(
    <Mentor program={program} route="mentor/missing%40example.com" />,
  )
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Learner not found.",
  )
  expect(
    screen.getByRole("link", { name: /Back to cohort/ }),
  ).toBeInTheDocument()
  unmount()
  render(<Mentor program={program} route="mentor?q=Nobody" />)
  expect(
    await screen.findByText("No learners match these filters."),
  ).toBeInTheDocument()
})
