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
      screen.getByRole("heading", { name: "Claude Code overview" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Install Node.js" }),
    ).not.toBeInTheDocument()
    await userEvent.selectOptions(screen.getByRole("combobox"), "6")
    expect(screen.getByText("No references found.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }))
    await userEvent.type(screen.getByRole("searchbox"), "Docker")
    expect(
      screen.getByRole("heading", { name: "Docker: get started" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Install Node.js" }),
    ).not.toBeInTheDocument()
  })

  it("lets learners preview later weeks and resume a lesson by its stable URL", async () => {
    render(
      <Roadmap
        program={program}
        progress={{ steps: { L01: "done" } }}
        journey={{ weeks: [] }}
        currentWeek={program.weeks[0]}
      />,
    )
    expect(
      screen.getByRole("link", { name: /install and verify/i }),
    ).toHaveAttribute("href", "#lesson/L01")
    await userEvent.click(screen.getByRole("button", { name: /finish your triage/i }))
    expect(
      screen.getByRole("link", { name: /write the handover document/i }),
    ).toHaveAttribute("href", "#lesson/L33")
    expect(
      screen.queryByRole("link", { name: /install and verify/i }),
    ).not.toBeInTheDocument()
  })
})
