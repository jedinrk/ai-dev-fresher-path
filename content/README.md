# Content

Curriculum data for weeks, lessons, resources, and the glossary lives here as JSON, not hard-coded in components.

Mentors can inspect every lesson in the app's **Curriculum** view without completing learner steps. For maintenance instructions, see [How to inspect and maintain the curriculum](../docs/how-to-maintain-curriculum.md). The [curriculum reference](../docs/CURRICULUM.md) lists weekly expectations and mentor preparation; the [handoff](../docs/HANDOFF.md) distinguishes implemented features from future work.

- `program.json` is the active First Build curriculum, version `first-build-v4`: six weeks, thirty-six lessons (`L01` to `L36`), the Triage project briefs, the references, a glossary, the primary tool, and the mentor rhythm. The order follows the frame agreed on 2026-10-25: tools and concepts (Week 1), agents and the API by hand with Claude Code introduced in L08 (Week 2), React (Week 3), SOLID, clean architecture, review, CI, and deploy (Week 4), models and APIs including Claude, OpenAI, Foundry, and the Agent SDK (Week 5), and a Triage capstone from one of three ready-made tickets, handover, demo, and reflection (Week 6). No lesson involves real team work. Update lesson text here; no component changes are needed.
- `concepts/F1.json` … `F8.json` preserve the original foundation records. The loader keeps their stable IDs and original concept names; their old prose is never shown. Existing predictions and progress still belong to these IDs.

## Lesson schema

Each week defines its ordered lesson `ids`, learner-facing title, label, description, outcome, milestone, project title, brief, and deliverables.

Each lesson has:

| Field | Purpose |
| --- | --- |
| `id`, `title`, `summary`, `kind`, `time` | Stable ID, learner-facing name, one-line summary, lesson kind, minutes including practice |
| `predictPrompt` | Answered in the learner's own words before anything else; stored as written |
| `checks[]` | Two or three self-checks: `{ question, options: [{ text, correct, feedback }] }`. Exactly one option is correct. Every option has feedback that names what was wrong and why. Answers stay in the browser. |
| `lesson` | Under five minutes of reading. A small Markdown subset: paragraphs separated by a blank line, `### ` subheadings, `- ` bullets, `1. ` numbered steps, inline `**bold**`, `` `code` ``, and `[links](url)`. No HTML. The same subset works in `byHand.task`, `withAI.task`, `explainBack.prompt`, and hints; prediction prompts and check text stay plain. |
| `examples[]` | `{ caption, language, code }` rendered as captioned code blocks |
| `byHand` | `{ task, checklist[] }`. The no-AI task. Its checklist must be complete before the AI part opens. |
| `withAI` | `{ task, prompt?, checklist[] }` or `null` when Claude Code is not used. `prompt` renders as a copyable starter prompt. |
| `hints[]` | Exactly three staged hints, revealed one at a time |
| `reflection` | A discussion prompt, not a saved field |
| `resources[]` | Resource IDs that must exist in `resources` |
| `prepare[]` | Topics to learn before the lesson: `{ topic, meaning, resources[] }`. Shown first as "Before you start" with links; the prediction unlocks when every topic is ticked (browser-local). Every resource ID must also appear in the lesson's `resources`. Lessons without `prepare` show their references in the sidebar instead. |
| `keyReading` | `{ resource, why }`: the one reference that must be read inside the lesson. Rendered as a highlighted "Read this now" card in Learn; the checks cannot be left until it is ticked (browser-local). The resource must also be in `resources`. |
| `explainBack` | `{ prompt }`: shown after the Claude Code checklist. The learner's text is saved on the server (`POST /api/progress/:id/explanation`), editable until the lesson is done, and shown to the mentor at review and back to the learner on the project page. Only on lessons with `withAI`. |
| `widgets[]` | Optional interactive pieces, each `{ type, title, ...data }`. Types: `render-tracer` (`tree`, `actions[]` with `owner`), `flow-tracer` (`steps[]` with optional `onFail` and `stop`, `failToggle`), `prompt-builder` (`vague`, `parts[]` of `{ key, label, hint, placeholder, example }`), `setup-checklist` (shown before the prediction, with `items[]` of `{ id, name, job, installUrl, command?, expect?, check? }`), `request-tracer` (`sampleTitle`, `hops[]`), `stack-map` (`columns[]` of cards), `git-playground` (`steps[]`), `token-counter` (`sample`), `bucket-sort` (`buckets[]`, `cards[]` with `answer` in `buckets`). Widget state stays in the browser. |
| `ai` | Optional label override. L35 uses `"Explain without AI"`. Otherwise the app shows "By hand first · then Claude Code" or "No AI in this lesson". |

Program-level fields: `project` (name and summary), `tools` (`primary`, `alsoKnow[]`), and `mentor` (`reviewSlot`, `questionResponseTime`), which the Today, Questions, and lesson pages display.

Keep the order of `lessons` consistent with the flattened weekly `ids`; tests check this, along with the check and hint rules above. Resources point to the original publisher; all URLs were checked on 2026-10-24.

## Progress and review compatibility

Lesson predictions are stored exactly as submitted and cannot be replaced. Completion requires a submitted prediction and the Learn → Prove sequence on the server. Check answers, checklist ticks, and hint reveals are browser-local and cleared on logout.

Project reviews are keyed by curriculum version. Moving from `first-build-v1` to `first-build-v2` means Week reviews submitted under v1 are no longer shown as current; they remain in the database. The original `server/src/weeks.js` mapping and `checkpoints` table keep their original eight-concept meaning. Lesson progress and predictions are keyed by user and lesson ID, not version. Week 1 now uses new IDs (`L01` to `L06`); any predictions stored under the retired Week 1 IDs (F1, S1, A1, A2, F2, G1) stay in the database but are no longer shown. The admin checkpoint gate in `server/src/weeks.js` is derived from the program's weeks, so it follows whatever `program.json` defines.
