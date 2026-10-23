# How to inspect and maintain the curriculum

Use this guide to review the full syllabus as a mentor, change existing content in the repository, or prepare a safe structural change. For lesson expectations see [CURRICULUM.md](CURRICULUM.md); for implementation priorities see [HANDOFF.md](HANDOFF.md).

## Prerequisites

- A working local app using the [README setup](../README.md#run-locally).
- An allowlisted mentor account for the browser preview. `MENTOR_EMAIL` must also appear in `ALLOWLIST_EMAILS`; role is assigned at registration and stored in SQLite.
- Repository access for edits. There is currently no browser-based editor or publish API.
- A separate local database, not a production database, when testing behavior.

## Task 1: Inspect the complete plan

1. Sign in as a mentor and choose **Curriculum**, or open **Mentor workspace → View full curriculum**.
2. Read the project brief and expected checkpoint evidence for each week. Click **Expand all lessons**, or open one lesson at a time.
3. Review Predict, Learn, Prove, checklist, hint, reflection and references. Use **Lesson permalink** to share a specific item with another authenticated mentor. D4 must retain its **Explain without AI** instruction.

Verification: all 20 titles are present across four weeks. Reading content must not require submitting a prediction or clicking a learner completion button. Navigating to an existing `#lesson/<id>` URL as a mentor should also open the inspection view. An intern still uses the learner lesson flow.

## Task 2: Edit an existing lesson or reference

1. Open `content/program.json`. Locate the lesson by its stable `id`, not its position in the array. For example, edit F1's `lesson` or `hint`, not its ID.
2. Update the relevant text. Use plain text, with `\n\n` between lesson paragraphs. Optional `code` is displayed as text in a code block; optional `prompt` is a starter prompt. Do not insert HTML or assume Markdown will render as rich content.
3. Check linked resources. Every lesson `resources` entry must match a `resources[].id`. Keep links to primary publishers, describe the useful section/takeaway, and distinguish required from optional material.
4. If changing a weekly expectation, update the associated `brief`, `deliverables` and affected lessons together. Stop for a migration decision if the new requirement materially changes what an existing approval means.
5. Run the verification commands below. Refresh the browser to load the changed program, inspect the mentor view, and test the learner presentation with a dedicated test account.
6. Review and commit the content changes. Publication to a running deployment is a separate, explicitly approved release action; a local edit does not publish to production.

The server reads program JSON for requests, but an already-open Studio keeps its loaded program in memory. Reload the page to see changes. A deployed container needs an updated release containing the content; do not hand-edit files in a live container as a publishing system.

## Task 3: Plan a lesson, ordering or version change

1. Write down which existing learners, predictions, completions and approvals would be affected.
2. Preserve existing IDs for the same learning concept. Never recycle an old ID for unrelated material. New lessons need unique IDs and explicit placement in a week's `ids`.
3. Keep `lessons` array order identical to the flattened `weeks[].ids` order. The next-lesson flow uses that ordering. Each lesson should occur exactly once.
4. Update curriculum/schema tests. Current tests deliberately assert twenty lessons and their mapped order; changing the four-week/twenty-lesson program is a product change, not just fixing a failing test.
5. For material checkpoint changes, design a new version and historical mapping before publishing. `journey_reviews` includes a version; `progress` and `predictions` do not. A version-string bump alone is not a safe migration strategy.
6. Update the [curriculum reference](CURRICULUM.md) and [handoff](HANDOFF.md) when the documented sequence or scope changes. Do not change legacy `server/src/weeks.js` to match the new program; it preserves old checkpoint meaning.

Verification: compare the old and proposed curriculum by stable ID, inspect existing-user fixtures, confirm no learner history is deleted or reinterpreted, and obtain mentor approval for changed expectations. Do not reset a real user to test content.

## Content field reference

| Entity | Fields and renderer expectations |
| --- | --- |
| Program | `version`, `name`, `tagline`, `weeks[]`, `lessons[]`, `resources[]`, `glossary[]` |
| Week | `number`, `title`, `label`, `description`, `outcome`, `milestone`, ordered `ids[]`, `projectTitle`, `brief`, `deliverables[]` |
| Lesson | Stable `id`; `title`, `summary`, `kind`, estimated numeric `time`; `predictPrompt`, `lesson`, `proveTask`; `checklist[]`, `hint`, `reflection`, resource-ID `resources[]`; optional `code`, `prompt`, `ai` |
| AI instruction | Omitted means the default “AI encouraged · your thinking comes first”; D4 explicitly uses `ai: "Explain without AI"` |
| Resource | Unique `id`, `title`, `source`, `track`, relevant numeric `weeks[]`, `format`, `url`, `description`, `takeaway`, boolean `required` |
| Glossary | Array of `[term, definition]` pairs |

Current resource tracks are `Development` and `Generative AI`; those names correspond to UI filter choices. Do not invent a third track without updating and testing the filter. The content tests check ID mappings, required learning text, checklists and resource references, but are not a complete production authoring schema validator. Add validation with any future editor.

Foundation files `content/concepts/F1.json` through `F8.json` are historical inputs to `getConcepts()`. That loader retains their original concept names while overlaying current lesson data. Editing only a foundation file will not update the active program UI. See [content compatibility](../content/README.md).

## Editorial and UI requirements

- Keep explanations short and concrete. Prefer a task a novice can demonstrate over another paragraph of theory.
- Predictions invite a best guess; do not imply that an incorrect starting thought is failure.
- Checklists describe observable actions. They are self-reported practice, not automated assessment.
- State how AI may help and what the learner must explain independently. Never add generated solutions for no-AI exercises.
- Use safe disposable examples. Never include actual credentials, private repositories, internal mentor flags or confidential answer keys in shared curriculum JSON.
- Reuse the existing typography, spacing, controls and state copy from [DESIGN.md](../DESIGN.md). New content must wrap on mobile and remain readable with fallback fonts.
- A reflection prompt is not a saved response field. Add persistence and privacy rules before changing that claim.

## Verification commands

From the repository root:

```sh
npm run test:server
npm run test:client
npm run lint --workspace client
npm run build
git diff --check
```

Inspect both the mentor curriculum preview and learner lesson flow. Test long titles, code, resource links and empty search results when those fields change. Check supplied URLs against the publisher at the time of the edit; do not rely indefinitely on the original verification date.

## Troubleshooting

| Symptom | Check / action |
| --- | --- |
| No Curriculum link | Confirm the account's stored role is `mentor`. Changing `MENTOR_EMAIL` does not automatically rewrite existing users. Use an authorized account-management process; do not bypass the allowlist. |
| Content unchanged after editing | Edit `program.json`, not only `concepts/F*.json`; reload Studio; verify the server/release is using this checkout. |
| Content fails to load | Validate JSON syntax, check the server error locally, and restore a valid edit before retrying. There is no browser draft/publish safety net yet. |
| Lesson missing or next link wrong | Check unique IDs, each week's mapping, `lessons` ordering and reference integrity tests. |
| Old approval did not become a new sign-off | Expected: legacy approvals keep their original foundation meaning. Review the new evidence separately. |
| “Complete the remaining lessons” blocks evidence | Check that all IDs in that week's active mapping are `done`; predictions or Learn alone do not complete a lesson. |
| Browser draft disappeared after logout | Expected: unsubmitted drafts are device-local and cleared on logout. Submitted data remains on the server. |
| Editor requested in the browser | Not implemented. Follow this repository workflow or take up the versioned editor plan in the handoff. |
