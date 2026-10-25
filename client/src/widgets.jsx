import { useState } from "react"
import { Icon } from "./ui"
import { readDraft, saveDraft } from "./drafts"
import { RichText } from "./richtext"

function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => {
    if (!key) return fallback
    try {
      const stored = JSON.parse(readDraft(key) || "null")
      return stored === null ? fallback : stored
    } catch {
      return fallback
    }
  })
  function update(next) {
    setValue(next)
    if (key) saveDraft(key, JSON.stringify(next))
  }
  return [value, update]
}

function Frame({ kind, title, status, instruction, children }) {
  return (
    <section className={`widget widget-${kind}`} aria-label={title}>
      <div className="widget-head">
        <div>
          <p className="eyebrow">INTERACTIVE</p>
          <h3>{title}</h3>
        </div>
        {status && <span className="widget-status">{status}</span>}
      </div>
      {instruction && <p className="widget-instruction">{instruction}</p>}
      {children}
    </section>
  )
}

export function SetupChecklist({ widget, storageKey }) {
  const [done, setDone] = useStoredState(storageKey, {})
  const verified = widget.items.filter((item) => done[item.id]).length
  return (
    <Frame
      kind="setup"
      title={widget.title}
      status={`${verified} of ${widget.items.length} verified`}
      instruction="Install each tool, run its check in a new terminal, then tick the row."
    >
      <ol className="setup-rows">
        {widget.items.map((item, i) => {
          const ok = Boolean(done[item.id])
          return (
            <li key={item.id} className={ok ? "verified" : ""}>
              <span className="setup-number" aria-hidden="true">
                {ok ? <Icon name="check" size={14} /> : i + 1}
              </span>
              <div className="setup-body">
                <div className="setup-title">
                  <h4>{item.name}</h4>
                  <span className={`badge ${ok ? "badge-green" : "badge-neutral"}`}>
                    {ok ? "Verified" : "Not yet"}
                  </span>
                </div>
                <p>{item.job}</p>
                <p className="setup-check">
                  {item.command ? (
                    <>
                      Check: run <code>{item.command}</code>. Expect {item.expect}.
                    </>
                  ) : (
                    <>Check: {item.check}</>
                  )}
                </p>
                <div className="setup-actions">
                  <a href={item.installUrl} target="_blank" rel="noreferrer">
                    Install page <Icon name="external" size={13} />
                  </a>
                  <label>
                    <input
                      type="checkbox"
                      checked={ok}
                      onChange={(e) =>
                        setDone({ ...done, [item.id]: e.target.checked })
                      }
                    />
                    The check passed
                  </label>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </Frame>
  )
}

export function RequestTracer({ widget }) {
  const hops = widget.hops
  const [title, setTitle] = useState(widget.sampleTitle)
  const [stage, setStage] = useState(-1)
  const [issues, setIssues] = useState([])
  const [refreshed, setRefreshed] = useState(false)
  const finished = stage === hops.length
  const running = stage >= 0 && !finished
  function start(e) {
    e.preventDefault()
    if (!title.trim()) return
    setRefreshed(false)
    setStage(0)
  }
  function next() {
    if (stage + 1 === hops.length) setIssues([...issues, title.trim()])
    setStage(stage + 1)
  }
  const status = running
    ? `Hop ${stage + 1} of ${hops.length}`
    : finished
      ? "Request complete"
      : "Waiting for you to press Add"
  return (
    <Frame
      kind="tracer"
      title={widget.title}
      status={status}
      instruction="Type a title, press Add, then follow the request one hop at a time."
    >
      <div className="tracer-layout">
        <div className="mini-board">
          <form onSubmit={start} className="mini-board-form">
            <input
              aria-label="Issue title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={running}
            />
            <button className="button primary" type="submit" disabled={running || !title.trim()}>
              Add
            </button>
          </form>
          <div className="mini-column">
            <span className="mini-column-head">
              Open <em>{issues.length}</em>
            </span>
            {issues.length === 0 ? (
              <p className="small muted">No issues yet.</p>
            ) : (
              <ul>
                {issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
          {finished && (
            <div className="tracer-after">
              <button
                className="text-button"
                onClick={() => {
                  setRefreshed(true)
                  setStage(-1)
                }}
              >
                Refresh the page
              </button>
              <button className="text-button" onClick={() => setStage(-1)}>
                Add another
              </button>
            </div>
          )}
          {refreshed && (
            <p className="tracer-note" role="status">
              Still there after a refresh: the issue lives in the database, not in the page.
            </p>
          )}
        </div>
        <ol className="hops" aria-label="Hops">
          {hops.map((hop, i) => {
            const state = stage === -1 ? "idle" : i < stage ? "done" : i === stage ? "current" : "pending"
            const code = hop.code?.replaceAll(widget.sampleTitle, title.trim() || widget.sampleTitle)
            return (
              <li key={i} className={`hop ${state}`} aria-current={state === "current" ? "step" : undefined}>
                <span className="hop-where">{hop.where}</span>
                <div>
                  <strong>{hop.title}</strong>
                  {state === "current" && (
                    <>
                      {code && <code>{code}</code>}
                      <p>{hop.detail}</p>
                      <button className="button primary small-button" onClick={next}>
                        {i + 1 === hops.length ? "Finish" : "Next hop"} <Icon name="arrow" size={14} />
                      </button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </Frame>
  )
}

export function StackMap({ widget }) {
  const first = widget.columns[0].cards.findIndex((c) => c.used)
  const [selected, setSelected] = useState({ col: 0, card: first < 0 ? 0 : first })
  const card = widget.columns[selected.col].cards[selected.card]
  const usedLabel = widget.usedLabel || "Triage"
  const whyLabel = widget.whyLabel || "Why Triage uses it"
  return (
    <Frame
      kind="stack"
      title={widget.title}
      status={widget.status || "Highlighted: used in Triage"}
      instruction={widget.instruction || "Click any card to see what it is and when you would choose it."}
    >
      <div className="stack-layout">
        <div className="stack-columns">
          {widget.columns.map((column, ci) => (
            <div className="stack-column" key={column.name}>
              <h4>{column.name}</h4>
              {column.cards.map((item, i) => {
                const active = selected.col === ci && selected.card === i
                return (
                  <button
                    key={item.name}
                    className={`stack-card ${item.used ? "used" : ""} ${active ? "active" : ""}`}
                    aria-pressed={active}
                    onClick={() => setSelected({ col: ci, card: i })}
                  >
                    {item.name}
                    {item.used && <span className="badge badge-green">{usedLabel}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <aside className="stack-detail" aria-live="polite">
          <p className="eyebrow">{widget.columns[selected.col].name}</p>
          <h4>{card.name}</h4>
          <RichText className="stack-what" text={card.what} />
          <dl>
            <dt>Good for</dt>
            <dd>{card.goodFor}</dd>
            {card.why && (
              <>
                <dt>{whyLabel}</dt>
                <dd>{card.why}</dd>
              </>
            )}
          </dl>
        </aside>
      </div>
    </Frame>
  )
}

export function GitPlayground({ widget }) {
  const [ran, setRan] = useState(0)
  const done = widget.steps.slice(0, ran)
  const hasRepo = done.some((s) => s.init)
  const commits = done.filter((s) => s.commit).map((s) => s.commit)
  const pushIndex = widget.steps.findIndex((s) => s.push)
  const pushed = ran > pushIndex ? widget.steps.slice(0, pushIndex).filter((s) => s.commit).length : 0
  const branch = done.find((s) => s.branch)?.branch
  return (
    <Frame
      kind="git"
      title={widget.title}
      status={`${ran} of ${widget.steps.length} commands run`}
      instruction="Run each command in order and watch what changes on your machine and on GitHub."
    >
      <div className="git-layout">
        <ol className="git-commands">
          {widget.steps.map((s, i) => (
            <li key={i} className={i < ran ? "done" : i === ran ? "next" : ""}>
              <code>$ {s.command}</code>
              {i < ran && <p>{s.effect}</p>}
              {i === ran && (
                <button className="button primary small-button" onClick={() => setRan(ran + 1)}>
                  Run
                </button>
              )}
            </li>
          ))}
          {ran === widget.steps.length && (
            <li className="git-reset">
              <button className="text-button" onClick={() => setRan(0)}>
                Start over
              </button>
            </li>
          )}
        </ol>
        <div className="git-places">
          <div className="git-place">
            <h4>Your machine</h4>
            {!hasRepo ? (
              <p className="small muted">A plain folder. No history.</p>
            ) : (
              <>
                <p className="small muted">
                  Repository on branch <strong>{branch || "main"}</strong>
                </p>
                <CommitList commits={commits} empty="No commits yet." />
              </>
            )}
          </div>
          <div className="git-place">
            <h4>GitHub</h4>
            <CommitList commits={commits.slice(0, pushed)} empty="Nothing here until you push." />
          </div>
        </div>
      </div>
    </Frame>
  )
}

function CommitList({ commits, empty }) {
  if (!commits.length) return <p className="small muted">{empty}</p>
  return (
    <ol className="commit-list">
      {commits.map((message, i) => (
        <li key={i}>
          <span className="commit-dot" aria-hidden="true" />
          {message}
        </li>
      ))}
    </ol>
  )
}

// A rough split that mirrors how tokenizers chunk text: common words stay
// whole, long or rare words break into pieces, punctuation stands alone.
function roughTokens(text) {
  const pieces = text.match(/\s*(?:[A-Za-z]+|\d+|[^\sA-Za-z\d])/g) || []
  const out = []
  for (const piece of pieces) {
    const lead = piece.match(/^\s*/)[0]
    const word = piece.slice(lead.length)
    if (/^[A-Za-z]+$/.test(word) && word.length > 6) {
      const chunks = word.match(/.{1,4}/g)
      chunks.forEach((chunk, i) => out.push(i === 0 ? lead + chunk : chunk))
    } else out.push(piece)
  }
  return out
}

const CONTEXT_WINDOW = 200000

export function TokenCounter({ widget }) {
  const [text, setText] = useState(widget.sample)
  const tokens = roughTokens(text)
  const share = (tokens.length / CONTEXT_WINDOW) * 100
  return (
    <Frame
      kind="tokens"
      title={widget.title}
      status={`About ${tokens.length} tokens`}
      instruction="Type or paste a sentence. The split is approximate; the scale is the point."
    >
      <textarea
        aria-label="Text to count"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={2000}
      />
      <div className="token-chips" aria-hidden="true">
        {tokens.map((t, i) => (
          <span key={i}>{t.replace(/ /g, " ")}</span>
        ))}
      </div>
      <div className="token-window">
        <div className="progress-track">
          <span style={{ width: `${Math.max(share, 0.4)}%` }} />
        </div>
        <span className="small muted">
          {share < 0.01 ? "Under 0.01" : share.toFixed(2)}% of a {CONTEXT_WINDOW.toLocaleString()}-token context window
        </span>
      </div>
    </Frame>
  )
}

export function BucketSort({ widget, storageKey }) {
  const [placed, setPlaced] = useStoredState(storageKey, {})
  const buckets = widget.buckets.map((b) =>
    typeof b === "string" ? { name: b } : b,
  )
  const answered = widget.cards.filter((_, i) => placed[i] !== undefined)
  const correct = widget.cards.filter((card, i) => placed[i] === card.answer)
  return (
    <Frame
      kind="buckets"
      title={widget.title}
      status={`${answered.length} of ${widget.cards.length} answered · ${correct.length} right`}
      instruction={
        widget.instruction ||
        "Each card describes one feature of an app. Decide how it would be built and pick one of the three. You see the reason straight away."
      }
    >
      {buckets.some((b) => b.meaning) && (
        <dl className="bucket-legend">
          {buckets.map((b) => (
            <div key={b.name}>
              <dt>{b.name}</dt>
              <dd>{b.meaning}</dd>
            </div>
          ))}
        </dl>
      )}
      <ul className="bucket-cards">
        {widget.cards.map((card, i) => {
          const choice = placed[i]
          const right = choice === card.answer
          return (
            <li key={i} className={choice === undefined ? "" : right ? "right" : "wrong"}>
              <p>{card.text}</p>
              <p className="bucket-question">How would you build this?</p>
              <div className="bucket-choices" role="group" aria-label={card.text}>
                {buckets.map(({ name }) => (
                  <button
                    key={name}
                    className={`chip ${choice === name ? "chosen" : ""} ${choice !== undefined && name === card.answer ? "answer" : ""}`}
                    disabled={choice !== undefined}
                    onClick={() => setPlaced({ ...placed, [i]: name })}
                  >
                    {name}
                  </button>
                ))}
              </div>
              {choice !== undefined && (
                <p className="bucket-why" role="status">
                  {right ? "Right. " : `Not quite: this one is ${card.answer.toLowerCase()}. `}
                  {card.why}
                </p>
              )}
            </li>
          )
        })}
      </ul>
      {answered.length > 0 && (
        <button className="text-button" onClick={() => setPlaced({})}>
          Clear and try again
        </button>
      )}
    </Frame>
  )
}

export function PromptBuilder({ widget, storageKey }) {
  const [values, setValues] = useStoredState(storageKey, {})
  const [showExample, setShowExample] = useState(false)
  const [copied, setCopied] = useState(false)
  const filled = widget.parts.filter((p) => (values[p.key] || "").trim()).length
  const source = showExample
    ? Object.fromEntries(widget.parts.map((p) => [p.key, p.example]))
    : values
  const prompt = widget.parts
    .map((p) => `${p.label}: ${(source[p.key] || "").trim()}`)
    .filter((line) => !line.endsWith(": "))
    .join("\n")
  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  return (
    <Frame
      kind="prompt"
      title={widget.title}
      status={`${filled} of ${widget.parts.length} parts written`}
      instruction={widget.instruction}
    >
      <div className="prompt-layout">
        <div className="prompt-parts">
          {widget.parts.map((part) => (
            <label key={part.key} className="prompt-part">
              <span>
                <strong>{part.label}</strong>
                <small>{part.hint}</small>
              </span>
              <textarea
                rows={2}
                maxLength={600}
                value={values[part.key] || ""}
                onChange={(e) => setValues({ ...values, [part.key]: e.target.value })}
                placeholder={part.placeholder}
              />
            </label>
          ))}
        </div>
        <div className="prompt-preview">
          <div className="prompt-preview-head">
            <strong>{showExample ? "A worked example" : "Your prompt, assembled"}</strong>
            <button className="text-button" type="button" onClick={() => setShowExample(!showExample)}>
              {showExample ? "Back to mine" : "Show an example"}
            </button>
          </div>
          <div className="prompt-compare">
            <div>
              <small>The vague version</small>
              <pre>{widget.vague}</pre>
            </div>
            <div>
              <small>{showExample ? "The example" : "Yours"}</small>
              <pre>{prompt || "Fill in the parts on the left."}</pre>
            </div>
          </div>
          {!showExample && prompt && (
            <button className="text-button" type="button" onClick={copy}>
              {copied ? "Copied" : "Copy my prompt"}
            </button>
          )}
        </div>
      </div>
    </Frame>
  )
}

function treeNodes(node, parent = null, out = []) {
  out.push({ name: node.name, parent })
  for (const child of node.children || []) treeNodes(child, node.name, out)
  return out
}

function descendants(tree, owner) {
  const nodes = treeNodes(tree)
  const set = new Set([owner])
  let grew = true
  while (grew) {
    grew = false
    for (const n of nodes) if (n.parent && set.has(n.parent) && !set.has(n.name)) { set.add(n.name); grew = true }
  }
  return set
}

export function RenderTracer({ widget }) {
  const [flash, setFlash] = useState(new Set())
  const [last, setLast] = useState(null)
  const [count, setCount] = useState(0)
  function act(action) {
    setFlash(descendants(widget.tree, action.owner))
    setLast(action)
    setCount(count + 1)
  }
  function Node({ node }) {
    return (
      <div className={`render-node ${flash.has(node.name) ? "rendered" : ""}`}>
        <span>
          {node.name}
          {node.state && <small>state: {node.state}</small>}
        </span>
        {node.children?.length > 0 && (
          <div className="render-children">
            {node.children.map((child) => <Node key={child.name} node={child} />)}
          </div>
        )}
      </div>
    )
  }
  return (
    <Frame
      kind="render"
      title={widget.title}
      status={last ? `${flash.size} component${flash.size === 1 ? "" : "s"} re-rendered` : "Nothing rendered yet"}
      instruction={widget.instruction || "Press an action. The components that re-render light up: the one whose state changed, and everything inside it."}
    >
      <div className="render-layout">
        <div className="render-actions">
          {widget.actions.map((action) => (
            <button key={action.label} className="stack-card" onClick={() => act(action)}>
              {action.label}
              <small>state lives in {action.owner}</small>
            </button>
          ))}
          {last && <p className="render-note" role="status">{last.note}</p>}
        </div>
        <div className="render-tree" aria-live="polite">
          <Node node={widget.tree} />
        </div>
      </div>
    </Frame>
  )
}

export function FlowTracer({ widget }) {
  const [stage, setStage] = useState(-1)
  const [failing, setFailing] = useState(false)
  const steps = widget.steps.map((s) => (failing && s.onFail ? { ...s, ...s.onFail } : s))
  const n = steps.length
  const finished = stage === n
  const running = stage >= 0 && !finished
  const stopAt = failing ? steps.findIndex((s) => s.stop) : -1
  const stopped = failing && stopAt >= 0 && stage >= stopAt + 1
  const status = running && !stopped ? `Step ${stage + 1} of ${n}` : stopped ? widget.failLabel || "Stopped: red" : finished ? widget.passLabel || "Finished: green" : "Ready"
  return (
    <Frame kind="flow" title={widget.title} status={status} instruction={widget.instruction}>
      <div className="flow-controls">
        <button className="button primary small-button" onClick={() => setStage(0)} disabled={running && !stopped}>
          {widget.startLabel || "Start"}
        </button>
        {widget.failToggle && (
          <label>
            <input type="checkbox" checked={failing} onChange={(e) => { setFailing(e.target.checked); setStage(-1) }} />
            {widget.failToggle}
          </label>
        )}
      </div>
      <ol className="hops" aria-label="Steps">
        {steps.map((step, i) => {
          const state = stage === -1 ? "idle" : i < stage ? "done" : i === stage ? "current" : "pending"
          const isStop = failing && i === stopAt && i < stage
          return (
            <li key={i} className={`hop ${state} ${isStop ? "failed" : ""}`} aria-current={state === "current" ? "step" : undefined}>
              <span className="hop-where">{step.where}</span>
              <div>
                <strong>{step.title}</strong>
                {(state === "current" || isStop) && (
                  <>
                    {step.code && <code>{step.code}</code>}
                    <p>{step.detail}</p>
                    {state === "current" && !stopped && (
                      <button className="button primary small-button" onClick={() => setStage(stage + 1)}>
                        {i + 1 === n ? "Finish" : "Next"} <Icon name="arrow" size={14} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </Frame>
  )
}

export function LessonWidget({ widget, storageKey }) {
  switch (widget.type) {
    case "setup-checklist":
      return <SetupChecklist widget={widget} storageKey={storageKey} />
    case "request-tracer":
      return <RequestTracer widget={widget} />
    case "stack-map":
      return <StackMap widget={widget} />
    case "git-playground":
      return <GitPlayground widget={widget} />
    case "token-counter":
      return <TokenCounter widget={widget} />
    case "bucket-sort":
      return <BucketSort widget={widget} storageKey={storageKey} />
    case "prompt-builder":
      return <PromptBuilder widget={widget} storageKey={storageKey} />
    case "render-tracer":
      return <RenderTracer widget={widget} />
    case "flow-tracer":
      return <FlowTracer widget={widget} />
    default:
      return null
  }
}
