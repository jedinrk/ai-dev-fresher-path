import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { Resources, Roadmap } from "./LearningPages"
import program from "../../content/program.json"

describe("learning navigation", () => {
  it("filters references by topic, week, and search, and recovers from no results", async () => {
    render(<Resources program={program} />)
    await userEvent.click(screen.getByRole("button", { name: "Generative AI" }))
    expect(
      screen.getByRole("heading", { name: "Set up your AI coding partner" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Install Node.js" }),
    ).not.toBeInTheDocument()
    await userEvent.selectOptions(screen.getByRole("combobox"), "4")
    expect(screen.getByText("No references found.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }))
    await userEvent.type(screen.getByRole("searchbox"), "React")
    expect(
      screen.getByRole("heading", { name: "React, one component at a time" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Install Node.js" }),
    ).not.toBeInTheDocument()
  })

  it("lets learners preview later weeks and resume a lesson by its stable URL", async () => {
    render(
      <Roadmap
        program={program}
        progress={{ steps: { F1: "done" } }}
        journey={{ weeks: [] }}
        currentWeek={program.weeks[0]}
      />,
    )
    expect(
      screen.getByRole("link", { name: /meet your workspace/i }),
    ).toHaveAttribute("href", "#lesson/F1")
    await userEvent.click(
      screen.getByRole("button", { name: /finish and tell your story/i }),
    )
    expect(
      screen.getByRole("link", { name: /leave a useful handover/i }),
    ).toHaveAttribute("href", "#lesson/D2")
    expect(
      screen.queryByRole("link", { name: /meet your workspace/i }),
    ).not.toBeInTheDocument()
  })
})
