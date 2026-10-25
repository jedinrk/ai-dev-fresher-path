import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { RichText } from "./richtext"
import { plainText } from "./plaintext"

describe("RichText", () => {
  it("renders subheadings, lists, bold, code, and links from the lesson text subset", () => {
    render(
      <RichText
        className="lesson-prose"
        text={"### One tool, one job\n\n- **VS Code** edits files.\n- Run `node hello.js`.\n\n1. First\n2. Second\n\nRead the [guide](https://example.test/guide) now."}
      />,
    )
    expect(screen.getByRole("heading", { level: 3, name: "One tool, one job" })).toBeInTheDocument()
    const items = screen.getAllByRole("listitem")
    expect(items).toHaveLength(4)
    expect(items[0].querySelector("strong")).toHaveTextContent("VS Code")
    expect(items[1].querySelector("code")).toHaveTextContent("node hello.js")
    expect(screen.getByRole("link", { name: "guide" })).toHaveAttribute("href", "https://example.test/guide")
    expect(document.querySelector("ol")).toHaveTextContent("FirstSecond")
  })

  it("never renders markup as HTML", () => {
    render(<RichText text={"<b>not bold</b> and **bold**"} />)
    expect(screen.getByText(/<b>not bold<\/b>/)).toBeInTheDocument()
    expect(document.querySelector("b")).toBeNull()
  })

  it("strips markers for plain-text comparisons", () => {
    expect(plainText("### Title\n\n- **A** and `b` and [c](https://x)")).toBe("Title\n\nA and b and c")
  })
})
