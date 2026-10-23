# Content

Curriculum data for weeks, concepts, tasks, and checkpoints lives here as data files (JSON or Markdown), not hard-coded in components.

Mentors can inspect every lesson in the app's **Curriculum** view without completing learner steps. For full maintenance instructions, see [How to inspect and maintain the curriculum](../docs/how-to-maintain-curriculum.md). The [curriculum reference](../docs/CURRICULUM.md) lists weekly expectations and proposed remaining content; the [handoff](../docs/HANDOFF.md) distinguishes implemented features from future work.

- `program.json` is the active First Build curriculum: four weeks, twenty lessons, project briefs, eight official references, and a glossary. Update lesson text here; no component changes are needed.
- `concepts/F1.json` … `F8.json` preserve the original foundation records. The content loader merges their stable IDs and concept names with the revised lesson content in `program.json`. Existing predictions and progress still belong to these IDs.

## Editing the program

Each week defines its ordered lesson `ids`, learner-facing title, description, project brief, deliverables, outcome, and milestone. Every lesson has a prediction prompt, short explanation, practical task, checklist, hint, reflection prompt, estimated practice time, and related resource IDs. Paragraphs in `lesson` are separated by two newlines. Optional `code` and `prompt` fields render as a code sample or a copyable starter prompt.

Keep the order of `lessons` consistent with the flattened weekly `ids`; tests check this. Use `title` for the learner-facing name. Foundation `concept` names are retained for the original mentor records.

Use `ai: "Explain without AI"` for independent explanation tasks. Do not add generated solutions to those exercises. Durations are approximate and include practice; the weekly structure is guidance rather than a mandatory daily schedule.

Resources should point to the original publisher, explain their purpose, and offer a takeaway task. The initial official references were checked on 2026-10-23. Recheck setup guides when tool instructions change. The separate prompting guide mentioned in the source PDF was not supplied; the Cline starter prompt here is newly authored content.

## Progress and review compatibility

Lesson predictions are stored exactly as submitted and cannot be replaced. Completion requires a submitted prediction and the Learn → Prove sequence. Existing completed lessons remain complete.

The original `server/src/weeks.js` mapping and `checkpoints` table retain their original eight-concept meaning. Expanded project reviews use `journey_reviews` and the `first-build-v1` curriculum version. Do not change the meaning of a signed-off week in place: introduce a new curriculum version for material checkpoint changes and plan its progress mapping explicitly.

Only project reviews are currently version-keyed. Lesson progress and predictions are keyed by user and lesson ID, not curriculum version. Changing `version` alone is **not** a complete migration or cohort-versioning mechanism. A future in-app editor needs draft/publish history, schema validation and an explicit policy for active learners; it must not silently overwrite historical expectations.

Learners complete the week's lessons and submit an HTTP(S) evidence link plus a short explanation. Mentors can approve or request changes. Only a requested revision can be resubmitted. Original approvals are shown separately and never silently converted into project approvals.

Draft predictions, checklist choices, questions, and checkpoint evidence are local to the browser and account. Submitted predictions, lesson completion, questions, and project reviews are saved on the server. Unsubmitted drafts are cleared on logout; reflection prompts are discussion prompts, not saved journal entries.
