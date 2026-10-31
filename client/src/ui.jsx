import syntreeLogo from "./assets/syntree-logo.png"

export function Icon({ name = "arrow", size = 20, ...props }) {
  const paths = {
    people: (
      <>
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3m2-17a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2" />
      </>
    ),
    today: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    roadmap: (
      <>
        <path d="M5 4v16M5 6h10a4 4 0 0 1 0 8H9" />
        <circle cx="5" cy="4" r="2" />
        <circle cx="9" cy="14" r="2" />
        <circle cx="5" cy="20" r="2" />
      </>
    ),
    project: (
      <>
        <path d="M3 7h7l2-3h7a2 2 0 0 1 2 2v13H3z" />
        <path d="M9 11l-3 3 3 3m6-6 3 3-3 3" />
      </>
    ),
    resources: (
      <>
        <path d="M12 5v15M3 4c4-1 7 0 9 2 2-2 5-3 9-2v15c-4-1-7 0-9 2-2-2-5-3-9-2z" />
      </>
    ),
    questions: (
      <>
        <path d="M21 11a8 8 0 0 1-8 8H7l-4 3V11a9 9 0 0 1 18 0Z" />
        <path d="M9 8a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3h.01" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    external: <path d="M14 3h7v7m0-7L10 14M10 4H4v16h16v-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    spark: <path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />,
    flag: <path d="M5 22V3m0 1c5-4 9 4 15 0v10c-6 4-10-4-15 0" />,
    leaf: <path d="M5 20C0 8 11 3 21 3c0 10-5 20-16 17Zm0 0L16 9" />,
    logout: <path d="M10 4H4v16h6m4-13 5 5-5 5m-5-5h10" />,
    mentor: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 22v-4a8 8 0 0 1 16 0v4" />
      </>
    ),
    search: (
      <>
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 6 6" />
      </>
    ),
    chevron: <path d="m9 5 7 7-7 7" />,
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.arrow}
    </svg>
  )
}

export function Brand({ href = "#today" }) {
  return (
    <a className="brand" href={href} aria-label="Syntree home">
      <img className="brand-logo" src={syntreeLogo} alt="Syntree" />
    </a>
  )
}

export function BuildIllustration() {
  return (
    <div className="build-illustration" aria-hidden="true">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="floating-note">
        <Icon name="check" size={15} /> One small step at a time
      </div>
      <div className="code-window">
        <div className="window-bar">
          <i />
          <i />
          <i />
          <span>your-first-build.js</span>
        </div>
        <div className="code-lines">
          <span className="line-number">01</span>
          <span>
            <b>const</b> beginning = <em>'you'</em>;
          </span>
          <span className="line-number">02</span>
          <span>
            <b>await</b> learn.byDoing();
          </span>
          <span className="line-number">03</span>
          <span>
            build.something(<em>'real'</em>);
          </span>
          <span className="line-number">04</span>
          <span className="code-comment">// you've got this.</span>
        </div>
      </div>
      <div className="plant">
        <svg viewBox="0 0 110 130">
          <path d="M54 109V46" fill="none" stroke="#476c4f" strokeWidth="3" />
          <path
            d="M53 82C21 82 18 62 20 52c24-2 38 9 33 30M55 66c-1-30 16-44 34-43 1 24-12 42-34 43M54 45C34 30 36 10 46 3c18 11 25 27 8 42"
            fill="#90a975"
          />
          <path d="m31 96 8 31h34l8-31" fill="#d9b995" />
          <path d="M29 95h54v8H29z" fill="#e7c9a7" />
        </svg>
      </div>
      <span className="illustration-spark">✳</span>
      <div className="build-stamp">
        <Icon name="flag" size={18} />
        <span>MADE BY YOU</span>
      </div>
    </div>
  )
}

export function PageHeading({ eyebrow, title, description, children }) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {children}
    </header>
  )
}
export function ProgressBar({ value, total, label }) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
    >
      <span style={{ width: `${total ? (value / total) * 100 : 0}%` }} />
    </div>
  )
}
export function ReviewBadge({ state }) {
  const status = state?.review?.status
  const label =
    {
      submitted: "Awaiting review",
      changes_requested: "Changes requested",
      approved: "Signed off",
    }[status] ||
    (state?.ready
      ? "Ready for review"
      : state?.completed
        ? "In progress"
        : "Not started")
  return (
    <span
      className={`badge ${status === "approved" ? "badge-green" : status === "changes_requested" ? "badge-gold" : "badge-neutral"}`}
    >
      {label}
    </span>
  )
}
