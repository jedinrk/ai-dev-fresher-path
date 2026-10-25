# Syntree

The interface should feel like a welcoming professional workspace for a first-time developer. The core loop is Predict → Learn → Prove, followed by a weekly project review with a mentor.

## Visual language

- Warm neutral canvas, pale sage navigation, white reading surfaces, deep green primary actions, restrained gold for revision states.
- Manrope headings and DM Sans body text, with system fallbacks. The home-page italic accent uses Georgia. Google Fonts is optional: the application remains functional when it is unavailable.
- Spacious page headings, a consistent sidebar, quiet borders, modest corner radii, and a single prominent next action.
- The small code-window and plant illustration is decorative, locally rendered, and hidden from assistive technology.
- Readable contrast, visible keyboard focus, labeled controls, reduced-motion support, and no status conveyed only by color.

## Screens

- Today: the actual next unfinished lesson, weekly destination, five-week overview, question-log status, and the mentor's review slot and reply promise.
- My roadmap: expandable weeks with lesson links, completion states, and project checkpoints. Future weeks remain explorable.
- Lesson: prediction, self-checks with instant per-option feedback, a short explanation with captioned examples, a by-hand no-AI task, a Claude Code task that unlocks after it, three staged hints, contextual help, and safe save/retry behavior.
- My project: project brief, deliverables, evidence submission, revision feedback, and sign-off. A mentor previews learner pages but cannot submit to their own review queue.
- Resources: search, topic/week filtering, primary-source links, and a small glossary.
- Questions: contextual drafts and a persistent conversation log.
- Mentor workspace: review queue, questions, cohort progress, and a separate area for account management and original foundation records.
- Mentor curriculum: a full read-only inspection view of the same program data. Weekly briefs and evidence expectations stay visible; lessons expand individually or together. No prediction gate, completion controls, or progress writes. Lesson permalinks open the selected lesson with its week context.

## Implementation notes

Routes use URL fragments, so direct lesson links, reload, browser Back/Forward, and static hosting work without another routing dependency. Navigation moves focus to the main content. At narrow widths, the sidebar becomes a compact top navigation; reading and project views become one column.

Content belongs in `content/program.json`, not JSX. Progress comes from authenticated APIs. Do not seed fake learner activity, streaks, deadlines, or mentor replies into the product.

The UI never claims to inspect a learner's local editor or verify their code automatically. A checklist records the learner's practice; a mentor verifies the evidence and explanation at the checkpoint.

## Continuation standard

This is the chosen direction, not a request to explore a new theme. Preserve it when adding assignments, editing tools, learner details or content. See the [remaining plan](docs/HANDOFF.md) and [curriculum editing guide](docs/how-to-maintain-curriculum.md).

### Palette and typography

Use the existing CSS variables rather than introducing near-duplicate colors:

| Role | Current value |
| --- | --- |
| Main canvas | `#f8f9f5` |
| Strong ink, `--ink` | `#233e35` |
| Secondary text, `--muted` | `#59685b` |
| Primary action, `--green` | `#205b49` |
| Quiet border, `--border` | `#e1e6dd` |
| Reading surface, `--surface` | `#ffffff` |
| Warm supporting surface, `--cream` | `#f0f0e6` |
| Keyboard focus outline | `#b07a31`, 3px with 4px offset |

Manrope is the heading family; DM Sans is body/control text. Georgia's italic accent is reserved for the Today/authentication hero, not every heading. Use monospace for code and identifiers, not long instructional text. Keep explanatory text comfortably readable, with roughly 1.65 line height; metadata can be smaller but must not become the only place essential instructions appear. Use existing responsive heading classes rather than a fixed desktop size on every screen.

The CSS loads Google Fonts, with sans-serif fallbacks. Verify functionality and wrapping when external fonts are blocked. Color values alone do not guarantee contrast: test actual foreground/background combinations, including deep-green cards, secondary labels and badges.

### Layout and components

- Reuse `PageHeading`, `Icon`, `ProgressBar` and `ReviewBadge` from `ui.jsx`.
- Reuse `.panel`, `.section-heading`, `.button.primary`, `.text-link`, `.error-banner`, `.empty-state` and existing form styles.
- Keep whitespace generous, usually following existing 8px-based spacing and 12–24px internal gaps. Most panels have modest rounded corners, quiet borders and no large shadow.
- One prominent next action per learner context. Supporting references and hints belong beside or below the reading flow, not above the task.
- Mentors can have a denser list of lessons and review criteria, but retain the same type, panel and feedback language.
- Use the existing locally rendered code-window/plant illustration as decoration. Do not add unrelated stock photos, large gradients or decorative animation to teaching screens.

Current layout breakpoints are 1180px, 950px and 700px, with an additional wide-screen adjustment at 1500px. Below 700px the sidebar becomes top navigation. Reuse these unless a new component demonstrably needs a local breakpoint. Use `minmax(0, 1fr)`, flexible actions and wrapping for long content; avoid fixing a parent width to a desktop screenshot.

Mentor mobile navigation uses two rows of three items so the sixth destination stays visible. Its short “Mentor” label keeps the accessible name “Mentor workspace.” On desktop, mentors see a program summary instead of a misleading personal completion bar. Nonessential topbar decoration is hidden on narrow screens so the breadcrumb can breathe.

### Interaction contracts

| Situation | Required behavior |
| --- | --- |
| Navigation | Stable hash URL; Back/Forward works; focus moves to main content; skip link remains usable |
| Busy request | State what is happening and disable duplicate submission; do not clear entered text |
| Failed save | Keep the draft, show actionable error text, allow retry |
| Saved but refresh failed | Tell the user the save succeeded; do not imply that submitting again is required |
| Local draft | Say “on this device”; do not imply cross-device or server persistence |
| Empty list/filter | Explain why it is empty and offer a next action or filter reset |
| Completion | Distinguish lesson completion, ready for review, awaiting review, changes requested and signed off |
| Mentor preview | All teaching content available without impersonating a learner or writing progress |
| Future editor | Separate edit, preview and publish states; unsaved-change feedback, validation and conflict recovery |

Use plain encouraging language: “Your next small step,” “Start with your best guess,” and specific revision guidance. Avoid guilt, leaderboards, public rankings and invented urgency. Celebrate actual outcomes, not fabricated activity. Do not promise a mentor response deadline that the program has not agreed.

### Accessibility and responsive review

- Native buttons for actions, anchors for navigation, visible form labels, descriptive accessible names for icon-only controls.
- Expanders expose `aria-expanded`; selected navigation exposes `aria-current`; progress conveys counts as well as color.
- Errors announce with `role="alert"`; meaningful loading states use `role="status"`. Don't announce every decorative change.
- Preserve visible focus, native keyboard operation and reduced-motion behavior. Decorative icons/illustration remain hidden from assistive technology.
- Review at 320px, 390px, 768px and desktop widths, with long titles/URLs and 200% zoom. Ensure learner and mentor navigation both remain reachable.
- Test empty/loading/error/success states, not just populated screenshots. Keep touch controls comfortably sized, aiming for a 44px target for newly introduced primary controls.

These are implementation requirements and review targets, not a claim of formal accessibility certification. Any new surface must be checked in the browser as well as covered by behavior tests.
