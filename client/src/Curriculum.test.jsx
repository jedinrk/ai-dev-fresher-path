import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import Curriculum from "./Curriculum"
import program from "../../content/program.json"
import { plainText } from "./plaintext"

const paragraph = (text) => (_, el) =>
  el.tagName === "P" && el.textContent === plainText(text)

describe("mentor curriculum", () => {
  it("lists every lesson and weekly deliverable without learner progress", async () => {
    render(<Curriculum program={program} />)
    for (const lesson of program.lessons) {
      expect(
        screen.getByRole("button", { name: new RegExp(lesson.id + " ·") }),
      ).toHaveAttribute("aria-expanded", "false")
    }
    for (const week of program.weeks) {
      for (const item of week.deliverables)
        expect(screen.getByText(item)).toBeInTheDocument()
    }
    await userEvent.click(
      screen.getByRole("button", { name: "Expand all lessons" }),
    )
    for (const lesson of program.lessons) {
      expect(screen.getByText(lesson.predictPrompt)).toBeInTheDocument()
      expect(screen.getByText(paragraph(lesson.byHand.task))).toBeInTheDocument()
      expect(
        screen.getByRole("link", { name: `Lesson permalink · ${lesson.id}` }),
      ).toHaveAttribute("href", `#curriculum/${lesson.id}`)
    }
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", {
        name: /submit prediction|mark.*complete/i,
      }),
    ).not.toBeInTheDocument()
    await userEvent.click(
      screen.getByRole("button", { name: "Collapse all lessons" }),
    )
    expect(
      screen.queryByText(paragraph(program.lessons[0].byHand.task)),
    ).not.toBeInTheDocument()
  })

  it("opens a deep-linked lesson, including independent-explanation instructions", () => {
    render(<Curriculum program={program} selectedId="L35" />)
    const lesson = program.lessons.find((item) => item.id === "L35")
    expect(screen.getByText(paragraph(lesson.byHand.task))).toBeInTheDocument()
    expect(screen.getByText("Explain without AI")).toBeInTheDocument()
    expect(screen.getByText(lesson.reflection)).toBeInTheDocument()
    expect(screen.queryByText(/With Claude Code/)).not.toBeInTheDocument()
    for (const check of lesson.checks) {
      expect(screen.getByText(check.question)).toBeInTheDocument()
      for (const option of check.options)
        expect(screen.getByText(option.feedback)).toBeInTheDocument()
    }
    expect(screen.getByRole("link", { name: /all weeks/i })).toHaveAttribute(
      "href",
      "#curriculum",
    )
    expect(
      screen.getByText(/in-app editor is not available yet/i),
    ).toBeInTheDocument()
  })

  it("recovers from an unknown lesson link", () => {
    render(<Curriculum program={program} selectedId="unknown" />)
    expect(screen.getByRole("status")).toHaveTextContent("Lesson not found")
    expect(screen.getByRole("button", { name: /L01 ·/ })).toBeInTheDocument()
  })
})
