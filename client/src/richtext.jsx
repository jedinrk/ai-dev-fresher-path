// Lesson text uses a small Markdown subset: paragraphs separated by a blank
// line, "### " subheadings, "- " bullet lists, "1. " numbered lists, and
// inline **bold**, `code`, and [links](url). Content is trusted (it comes from
// content/program.json), and everything renders as text nodes, never HTML.
const INLINE = "(\\*\\*[^*]+\\*\\*|`[^`]+`|\\[[^\\]]+\\]\\([^)\\s]+\\))"

export function InlineText({ text }) {
  const parts = []
  const re = new RegExp(INLINE, "g")
  let last = 0
  let match
  while ((match = re.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const token = match[0]
    if (token.startsWith("**"))
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>)
    else if (token.startsWith("`"))
      parts.push(<code key={match.index}>{token.slice(1, -1)}</code>)
    else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      parts.push(
        <a key={match.index} href={link[2]} target="_blank" rel="noreferrer">
          {link[1]}
        </a>,
      )
    }
    last = match.index + token.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

const kindOf = (line) =>
  /^### /.test(line) ? "h3" : /^- /.test(line) ? "ul" : /^\d+\. /.test(line) ? "ol" : "p"

// Groups consecutive lines of the same kind; a heading always stands alone and
// a blank line always ends the current group.
function groups(text) {
  const out = []
  let current = null
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd()
    if (!line.trim()) {
      current = null
      continue
    }
    const kind = kindOf(line)
    if (kind === "h3") {
      out.push({ kind, lines: [line.slice(4)] })
      current = null
      continue
    }
    const content = kind === "ul" ? line.slice(2) : kind === "ol" ? line.replace(/^\d+\. /, "") : line
    if (current && current.kind === kind) current.lines.push(content)
    else {
      current = { kind, lines: [content] }
      out.push(current)
    }
  }
  return out
}

export function RichText({ text, className }) {
  if (!text) return null
  return (
    <div className={className}>
      {groups(text).map((group, i) => {
        if (group.kind === "h3")
          return (
            <h3 key={i}>
              <InlineText text={group.lines[0]} />
            </h3>
          )
        if (group.kind === "ul" || group.kind === "ol") {
          const List = group.kind
          return (
            <List key={i}>
              {group.lines.map((line, j) => (
                <li key={j}>
                  <InlineText text={line} />
                </li>
              ))}
            </List>
          )
        }
        return (
          <p key={i}>
            <InlineText text={group.lines.join(" ")} />
          </p>
        )
      })}
    </div>
  )
}
