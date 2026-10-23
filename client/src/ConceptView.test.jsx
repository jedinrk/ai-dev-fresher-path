import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import ConceptView from "./ConceptView"
import { api } from "./api"

vi.mock("./api", () => ({
  api: { submitPrediction: vi.fn(), advanceStep: vi.fn() },
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
