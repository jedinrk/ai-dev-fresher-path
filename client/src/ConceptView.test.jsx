import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import ConceptView from "./ConceptView"
import { api } from "./api"

vi.mock("./api", () => ({
  api: { submitPrediction: vi.fn(), advanceStep: vi.fn(), saveExplanation: vi.fn() },
}))

afterEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

const concept = {
  id: "F1",
  concept: "What software is",
  predictPrompt: "What do you think a terminal is for?",
  lesson: "A terminal is a text interface.",
  proveTask: "Run a command.",
}

const v2 = {
  id: "A1",
  title: "What an LLM actually does",
  predictPrompt: "Where does the answer come from?",
  lesson: "A model predicts likely next text.",
  checks: [
    {
      question: "Can a model read a file you did not paste in?",
      options: [
        { text: "Yes.", correct: false, feedback: "No: if it is not in the context window, it has not seen it." },
        { text: "No.", correct: true, feedback: "Right: nothing outside the context window exists for the model." },
      ],
    },
  ],
  examples: [{ caption: "Tokens", code: "[Reject] [ blank]" }],
  byHand: { task: "Finish five sentences by hand.", checklist: ["I finished the sentences."] },
  withAI: {
    task: "Ask Claude to review your prediction.",
    prompt: "Here is my prediction.",
    checklist: ["Claude reviewed my prediction."],
  },
  hints: ["First hint.", "Second hint.", "Third hint."],
}

describe("ConceptView lesson v2", () => {
  it("requires every check to be answered, gives instant feedback, and keeps the by-hand task before the AI task", async () => {
    api.advanceStep.mockResolvedValue()
    render(
      <ConceptView
        concept={v2}
        initialStep="learn"
        initialPrediction="Guess"
        onProgressChange={vi.fn()}
        mentor={{ reviewSlot: "Thursday 18:00 to 18:30 IST", questionResponseTime: "within one working day" }}
      />,
    )
    expect(screen.getByText("Tokens")).toBeInTheDocument()
    const next = screen.getByRole("button", { name: /continue to the task/i })
    expect(next).toBeDisabled()
    await userEvent.click(screen.getByRole("radio", { name: "Yes." }))
    expect(screen.getByRole("status")).toHaveTextContent(/not in the context window/)
    expect(screen.getByText(/nothing outside the context window/)).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "No." })).toBeDisabled()
    expect(next).toBeEnabled()
    await userEvent.click(next)
    await waitFor(() => expect(api.advanceStep).toHaveBeenCalledWith("A1", "prove"))

    expect(screen.getByText("Finish five sentences by hand.")).toBeInTheDocument()
    expect(screen.getByText(/unlocks when the by-hand checklist is complete/i)).toBeInTheDocument()
    expect(screen.queryByText("Ask Claude to review your prediction.")).not.toBeInTheDocument()
    expect(screen.getByText(/every Thursday 18:00 to 18:30 IST/)).toBeInTheDocument()
    const done = screen.getByRole("button", { name: /mark as done/i })
    expect(done).toBeDisabled()

    await userEvent.click(screen.getByRole("checkbox", { name: "I finished the sentences." }))
    expect(screen.getByText("Ask Claude to review your prediction.")).toBeInTheDocument()
    expect(screen.getByText("Here is my prediction.")).toBeInTheDocument()
    expect(done).toBeDisabled()
    await userEvent.click(screen.getByRole("checkbox", { name: "Claude reviewed my prediction." }))
    expect(done).toBeEnabled()
  })

  it("reveals hints one at a time and never all at once", async () => {
    render(
      <ConceptView concept={v2} initialStep="prove" initialPrediction="Guess" onProgressChange={vi.fn()} />,
    )
    expect(screen.queryByText(/First hint/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /show a hint \(1 of 3\)/i }))
    expect(screen.getByText(/First hint/)).toBeInTheDocument()
    expect(screen.queryByText(/Second hint/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /next hint \(2 of 3\)/i }))
    await userEvent.click(screen.getByRole("button", { name: /next hint \(3 of 3\)/i }))
    expect(screen.getByText(/Third hint/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /hint/i })).not.toBeInTheDocument()
  })

  it("renders a no-AI lesson without an AI section", () => {
    render(
      <ConceptView
        concept={{ ...v2, withAI: null, ai: "Explain without AI" }}
        initialStep="prove"
        initialPrediction="Guess"
        onProgressChange={vi.fn()}
      />,
    )
    expect(screen.getByText("Explain without AI")).toBeInTheDocument()
    expect(screen.queryByText(/With Claude Code/)).not.toBeInTheDocument()
    expect(screen.queryByText(/unlocks when/i)).not.toBeInTheDocument()
  })
})

describe("ConceptView widgets and step rail", () => {
  const setupLesson = {
    ...v2,
    id: "L01",
    withAI: null,
    widgets: [
      {
        type: "setup-checklist",
        title: "Setup checklist",
        items: [
          { id: "node", name: "Node.js (LTS)", job: "Runs JavaScript.", installUrl: "https://nodejs.org/en/download", command: "node --version", expect: "v24.x.x" },
        ],
      },
    ],
  }

  it("shows the setup checklist before the prediction and counts verified rows", async () => {
    render(<ConceptView concept={setupLesson} userEmail="one@example.test" onProgressChange={vi.fn()} />)
    expect(screen.getByText("01 · SET UP")).toBeInTheDocument()
    expect(screen.getByText("02 · PREDICT")).toBeInTheDocument()
    expect(screen.getByText("0 of 1 verified")).toBeInTheDocument()
    expect(screen.getByText("Not yet")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("checkbox", { name: /the check passed/i }))
    expect(screen.getByText("1 of 1 verified")).toBeInTheDocument()
    expect(screen.getByText("Verified")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /install page/i })).toHaveAttribute("href", "https://nodejs.org/en/download")
  })

  it("renders learn widgets after the explanation with instant feedback", async () => {
    const lesson = {
      ...v2,
      withAI: null,
      widgets: [
        { type: "token-counter", title: "Token counter", sample: "Blank titles are rejected." },
        {
          type: "bucket-sort",
          title: "Rules, machine learning, or generative AI?",
          buckets: ["Rules", "Generative AI"],
          cards: [{ text: "Reject a blank title", answer: "Rules", why: "An if statement." }],
        },
      ],
    }
    render(<ConceptView concept={lesson} initialStep="learn" initialPrediction="Guess" onProgressChange={vi.fn()} />)
    expect(screen.getByText("01 · PREDICT")).toBeInTheDocument()
    expect(screen.getByText(/About \d+ tokens/)).toBeInTheDocument()
    expect(screen.getByText("0 of 1 answered · 0 right")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Generative AI" }))
    expect(screen.getByText("1 of 1 answered · 0 right")).toBeInTheDocument()
    expect(screen.getByText(/this one is rules\. An if statement\./)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Rules" })).toBeDisabled()
  })

  it("lists topics to learn first and unlocks the prediction only when all are ticked", async () => {
    const lesson = {
      ...v2,
      withAI: null,
      prepare: [
        { topic: "JSON", meaning: "The text format of request bodies.", resources: ["mdn-json"] },
        { topic: "Status codes", meaning: "Did it work.", resources: ["mdn-status"] },
      ],
    }
    const resources = [
      { id: "mdn-json", title: "Working with JSON", source: "MDN Web Docs", format: "Guide", url: "https://example.test/json" },
      { id: "mdn-status", title: "HTTP response status codes", source: "MDN Web Docs", url: "https://example.test/status" },
    ]
    render(<ConceptView concept={lesson} resources={resources} onProgressChange={vi.fn()} />)
    expect(screen.getByText("01 · BEFORE YOU START")).toBeInTheDocument()
    expect(screen.getByText("02 · PREDICT")).toBeInTheDocument()
    expect(screen.getByText("Prepare", { selector: "li[aria-current]" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Working with JSON/ })).toHaveAttribute("href", "https://example.test/json")
    expect(screen.queryByText("REFERENCES FOR THIS LESSON")).not.toBeInTheDocument()
    await userEvent.type(screen.getByRole("textbox"), "My guess.")
    const submit = screen.getByRole("button", { name: /submit prediction/i })
    expect(submit).toBeDisabled()
    expect(screen.getByText(/tick every topic/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("checkbox", { name: /JSON/ }))
    expect(screen.getByText("1 of 2 topics covered")).toBeInTheDocument()
    expect(submit).toBeDisabled()
    await userEvent.click(screen.getByRole("checkbox", { name: /Status codes/ }))
    expect(submit).toBeEnabled()
    expect(screen.getByText("Predict", { selector: "li[aria-current]" })).toBeInTheDocument()
  })

  it("requires the key reading to be ticked before the checks can be left", async () => {
    api.advanceStep.mockResolvedValue()
    const lesson = { ...v2, withAI: null, keyReading: { resource: "guide", why: "Read it now." } }
    render(
      <ConceptView
        concept={lesson}
        resources={[{ id: "guide", title: "Prompt engineering overview", source: "Claude Developer Platform", url: "https://example.test/guide" }]}
        initialStep="learn"
        initialPrediction="Guess"
        onProgressChange={vi.fn()}
      />,
    )
    expect(screen.getByRole("complementary", { name: "Read this now" })).toHaveTextContent("Prompt engineering overview")
    expect(screen.getByRole("link", { name: /open it/i })).toHaveAttribute("href", "https://example.test/guide")
    await userEvent.click(screen.getByRole("radio", { name: "No." }))
    const next = screen.getByRole("button", { name: /continue to the task/i })
    expect(next).toBeDisabled()
    expect(screen.getByText(/open the reading above/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("checkbox", { name: /i read it/i }))
    expect(next).toBeEnabled()
  })

  it("asks for an explanation after the Claude Code task and saves it before the lesson can be done", async () => {
    api.saveExplanation.mockResolvedValue()
    const lesson = { ...v2, explainBack: { prompt: "What changed, file by file?" } }
    render(<ConceptView concept={lesson} initialStep="prove" initialPrediction="Guess" onProgressChange={vi.fn()} />)
    expect(screen.getByRole("list", { name: "Lesson progress" })).toHaveTextContent("Explain it back")
    expect(screen.queryByText("What changed, file by file?")).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("checkbox", { name: "I finished the sentences." }))
    expect(screen.getByText(/opens when the claude code checklist is complete/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("checkbox", { name: "Claude reviewed my prediction." }))
    expect(screen.getByText("What changed, file by file?")).toBeInTheDocument()
    expect(screen.getByText("Explain it back", { selector: "li[aria-current]" })).toBeInTheDocument()
    const done = screen.getByRole("button", { name: /mark as done/i })
    expect(done).toBeDisabled()
    const save = screen.getByRole("button", { name: /save explanation/i })
    expect(save).toBeDisabled()
    await userEvent.type(screen.getByRole("textbox", { name: "Your explanation" }), "hello.js now builds objects and prints a count line.")
    await userEvent.click(save)
    await waitFor(() => expect(api.saveExplanation).toHaveBeenCalledWith("A1", "hello.js now builds objects and prints a count line."))
    expect(screen.getByText(/you and your mentor both see this/i)).toBeInTheDocument()
    expect(done).toBeEnabled()
  })

  it("shows the Claude Code step in the rail only when the lesson uses it", () => {
    const { unmount } = render(<ConceptView concept={v2} initialStep="prove" initialPrediction="Guess" onProgressChange={vi.fn()} />)
    const rail = screen.getByRole("list", { name: "Lesson progress" })
    expect(rail).toHaveTextContent("With Claude Code")
    expect(screen.getByText("By hand", { selector: "li[aria-current]" })).toBeInTheDocument()
    unmount()
    render(<ConceptView concept={{ ...v2, withAI: null }} initialStep="done" initialPrediction="Guess" onProgressChange={vi.fn()} />)
    expect(screen.getByRole("list", { name: "Lesson progress" })).not.toHaveTextContent("With Claude Code")
    expect(screen.getByText("Done", { selector: "li[aria-current]" })).toBeInTheDocument()
  })
})

describe("ConceptView", () => {
  it("requires the practice checklist and keeps it checked after a failed completion save", async () => {
    api.advanceStep.mockRejectedValue(new Error("Could not save."))
    render(
      <ConceptView
        concept={{ ...concept, checklist: ["I checked the behavior."] }}
        initialStep="prove"
        initialPrediction="Guess"
        onProgressChange={vi.fn()}
      />,
    )
    expect(screen.getByRole("button", { name: /mark as done/i })).toBeDisabled()
    await userEvent.click(screen.getByRole("checkbox"))
    await userEvent.click(screen.getByRole("button", { name: /mark as done/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not save.",
    )
    expect(screen.getByRole("checkbox")).toBeChecked()
    expect(screen.getByRole("button", { name: /mark as done/i })).toBeEnabled()
  })

  it("restores a draft for the same learner without leaking it to another account", async () => {
    const view = render(
      <ConceptView
        concept={concept}
        userEmail="one@example.test"
        onProgressChange={vi.fn()}
      />,
    )
    await userEvent.type(screen.getByRole("textbox"), "My private draft")
    view.unmount()
    const other = render(
      <ConceptView
        concept={concept}
        userEmail="two@example.test"
        onProgressChange={vi.fn()}
      />,
    )
    expect(screen.getByRole("textbox")).toHaveValue("")
    other.unmount()
    render(
      <ConceptView
        concept={concept}
        userEmail="one@example.test"
        onProgressChange={vi.fn()}
      />,
    )
    expect(screen.getByRole("textbox")).toHaveValue("My private draft")
  })

  it("walks through predict, learn, and prove in order, saving each step", async () => {
    api.submitPrediction.mockResolvedValue()
    api.advanceStep.mockResolvedValue()
    const onProgressChange = vi.fn()

    render(
      <ConceptView concept={concept} onProgressChange={onProgressChange} />,
    )

    expect(
      screen.getByText(/what do you think a terminal is for/i),
    ).toBeInTheDocument()
    expect(screen.queryByText(concept.lesson)).not.toBeInTheDocument()
    expect(screen.queryByText(concept.proveTask)).not.toBeInTheDocument()

    await userEvent.type(screen.getByRole("textbox"), "My guess.")
    await userEvent.click(
      screen.getByRole("button", { name: /submit prediction/i }),
    )

    await waitFor(() =>
      expect(api.submitPrediction).toHaveBeenCalledWith("F1", "My guess."),
    )
    expect(screen.getByText("My guess.")).toBeInTheDocument()
    expect(screen.getByText(concept.lesson)).toBeInTheDocument()
    expect(onProgressChange).toHaveBeenCalledWith("F1", "learn", "My guess.")

    await userEvent.click(
      screen.getByRole("button", { name: /continue to the task/i }),
    )
    await waitFor(() =>
      expect(api.advanceStep).toHaveBeenCalledWith("F1", "prove"),
    )
    expect(screen.getByText(concept.proveTask)).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /mark as done/i }))
    await waitFor(() =>
      expect(api.advanceStep).toHaveBeenCalledWith("F1", "done"),
    )
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your progress is saved.",
    )
  })

  it("resumes from a saved step and prediction", () => {
    render(
      <ConceptView
        concept={concept}
        initialStep="prove"
        initialPrediction="Saved guess."
        onProgressChange={vi.fn()}
      />,
    )

    expect(screen.getByText("Saved guess.")).toBeInTheDocument()
    expect(screen.getByText(concept.lesson)).toBeInTheDocument()
    expect(screen.getByText(concept.proveTask)).toBeInTheDocument()
  })

  it("shows an error if saving the prediction fails", async () => {
    api.submitPrediction.mockRejectedValue(
      new Error("a prediction has already been submitted"),
    )

    render(<ConceptView concept={concept} onProgressChange={vi.fn()} />)

    await userEvent.type(screen.getByRole("textbox"), "My guess.")
    await userEvent.click(
      screen.getByRole("button", { name: /submit prediction/i }),
    )

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "a prediction has already been submitted",
      ),
    )
  })
})
