# First Build: implementation handoff and remaining plan

Updated: 2026-10-23. Audience: the next developer/designer and the program mentor. This document describes the local implementation, not a deployed release. No production migration, deployment, push or PR creation is implied by this handoff.

Read [README](../README.md), [DESIGN](../DESIGN.md), [curriculum reference](CURRICULUM.md) and [content editing guide](how-to-maintain-curriculum.md) before changing the experience. Follow [CLAUDE.md](../CLAUDE.md), especially the allowlist, immutable predictions and deployment restrictions.

## 1. Product decisions to preserve

- **Name and style:** First Build, in the Builder's Studio direction. Warm, calm and professional, rather than a competitive course dashboard.
- **Core teaching loop:** predict in your own words, read a short explanation, do a practical task, then discuss evidence with a mentor.
- **Program shape:** five weeks, six guided lessons per week, one growing project (Triage, an issue board) plus one real team task in Week 5. Flexible pace; no enforced dates, attendance or streaks. Lesson time is under five hours per week.
- **Actual work matters:** interns code in their own editor. The web app does not run their code, inspect VS Code, verify tests remotely or automatically assess competency.
- **Concept before tool:** every lesson is predict → checks with instant feedback → learn → a no-AI by-hand task → the same idea with Claude Code, which stays locked until the by-hand checklist is complete. Claude Code is the primary tool from Week 1; Cursor and Codex appear once as a comparison. D4 requires independent explanation without AI.
- **Mentor rhythm is content:** the weekly review slot and the question-log reply promise live in `program.json` under `mentor` and are displayed on Today, Questions and lesson pages.
- **Single content source:** `content/program.json`. Do not duplicate lesson prose in React or create a second independently maintained syllabus inside the UI.
- **Progress versus approval:** lesson completion and mentor checkpoint approval are distinct states. All week's lessons must be done before an intern can submit a checkpoint.
- **Existing users matter:** original foundation IDs, predictions and completion survive. Old weekly approvals are not reinterpreted as approvals of the new project requirements.

## 2. What is implemented

| Surface | Implemented behavior | Important limit |
| --- | --- | --- |
| Authentication | Allowlisted self-registration, password login, signed httpOnly session cookie, logout, session-load errors | No public signup, invitations UI or password-recovery email workflow |
| Today | Actual next unfinished lesson, current week, progress, checkpoint and question context | No artificial streaks, due dates or seeded cohort activity |
| Roadmap | Four expandable weeks, future previews, lesson links and checkpoint states | No mandatory calendar or server-enforced cross-week order |
| Lessons | 20 authored lessons; prediction, Learn/Prove stages, hints, code/prompt display, local checklist, completion and contextual questions | Checklist is browser-side self-report; server enforces progression, not task execution |
| My project | Weekly brief/deliverables, local evidence draft, HTTP(S) link and summary, review/revision/sign-off | No assignment record, attachments, repository integration or review-event history |
| Resources | Eight publisher references, search, topic/week filters, glossary | No format filter, resource completion tracking or full PDF-video inventory |
| Questions | Contextual drafts, server-saved questions/answers, mentor reply workflow | No threaded discussion, notifications, attachments or response-time SLA |
| Mentor workspace | Review queue, feedback, cohort week counts and legacy account/foundation controls | No learner-detail page, assigned-mentor scoping, audit timeline or multiple-mentor management UI |
| Mentor curriculum | Complete read-only overview, expand/collapse all lessons, full content and per-lesson links | No browser editor, drafts or publish action; repository editing only |

The previous proposal under `.context/` described a future state. It is not a reliable completion tracker. Use this document and current code instead. The supplied PDF and QA images are local, gitignored artifacts; the next contributor may need the owner to reattach the PDF for exact source-resource reconciliation.

## 3. Architecture and code entry points

```text
content/program.json
       |
server/src/content.js --> authenticated /api/content/program
       |                              |
legacy concepts/F1..F8                 v
                              client/src/Studio.jsx
                                |       |       |
                         learner pages  |   Curriculum (read only)
                                  Project / Mentor
                                        |
                          /api/progress + /api/journey
                                        |
                              SQLite, authenticated user
```

- `App.jsx`: resolve session, distinguish authentication errors from service errors, render authentication or Studio, clear local drafts on logout.
- `Studio.jsx`: fragment routing, shared program/progress/journey state, route focus management, role-based navigation. It deliberately uses no routing dependency.
- `LearningPages.jsx`: Today, Roadmap, Resources. Keep actual progress-derived calculations separate from decorative presentation.
- `ConceptView.jsx`: learner state machine. Changing presentation must not rewrite a submitted prediction.
- `Curriculum.jsx`: mentor content inspector. Receives only curriculum data, not learner progress; must remain free of progress writes and local learner drafts.
- `Project.jsx`: evidence draft and submission/revision UI. Retain text after failed saves and tell the user if save succeeded but refresh failed.
- `Mentor.jsx`: review actions, questions, cohort, and expandable legacy administration. `AdminPanel.jsx`/`Dashboard.jsx` retain original management behavior.
- `ui.jsx`: shared icons, heading, progress and review-state primitives. `index.css`: shared styles and responsive rules. `drafts.js`: account-scoped browser storage with disabled-storage fallback.
- `routes/journey.js`: new weekly evidence/reviews. `routes/progress.js`: lesson prediction and stage transitions. Existing `routes/admin.js` continues legacy administration.

### Persistence and compatibility

| Data | Where stored | Constraint |
| --- | --- | --- |
| Submitted prediction | SQLite `predictions` keyed by user + concept ID | Preserve exact submitted text; cannot replace it |
| Lesson stage | SQLite `progress` keyed by user + concept ID | Monotonic stages; existing completion retained |
| New weekly review | SQLite `journey_reviews` keyed by user + version + week | Submission → revision request/resubmission or approval |
| Original weekly approval | SQLite `checkpoints` | Uses unchanged `server/src/weeks.js` foundation mapping |
| Questions / replies | SQLite `questions` | Separate from lesson reflection prompts |
| Unsubmitted work | Browser localStorage, account-scoped | Predictions, checklist choices, questions, evidence; cleared on logout; not cross-device |
| Reflection prompt | Curriculum only | Not a saved journal; final reflection can be supplied in evidence |

The curriculum version moved from `first-build-v1` to `first-build-v2` on 2026-10-24 when the program was redesigned around Triage. Reviews submitted under v1 stay in `journey_reviews` but are not shown as current; lesson progress for F1 to F8 carries over because those IDs kept their concepts. New IDs (S1, A1 to A9, B1 to B3, C1, G1, P1, R1, R3, D2 to D5) start empty for everyone.

`journey_reviews` is created additively by `db.js`. There is no general migration framework. Reviews are versioned, but **lesson progress and predictions are not curriculum-versioned**. Changing only `program.version` does not create an independent cohort curriculum or reset lesson work. A future versioning design must account for both.

Original F1–F8 IDs still refer to existing user history even though lesson prose/order changed. Do not claim historical completion proves every new task was performed. Mentors should reconcile older cohorts explicitly; do not erase records or manufacture approvals.

### Current review API contract

All routes below require the signed session and recheck the allowlist. Identity is derived on the server.

| Route | Access and behavior |
| --- | --- |
| `GET /api/content/program` | Authenticated users; active curriculum JSON. Not a private mentor-notes endpoint. |
| `GET /api/journey` | Current user's weeks (`completed`, `total`, `ready`, `review`) and separate `legacy` approvals |
| `POST /api/journey/weeks/:week` | Intern only; known week, all lessons done, no review yet or changes requested. `evidenceUrl`: HTTP(S), ≤2,000 chars, no URL username/password. `summary`: trimmed length ≥20, raw length ≤10,000. Returns 201 with weeks. |
| `GET /api/journey/reviews` | Mentor only; registered intern cohort, week states and prediction text. Not an assigned-cohort filter. |
| `POST /api/journey/reviews/:email/:week` | Mentor only; existing submitted review. `status`: `approved` or `changes_requested`; `notes`: string ≤10,000 chars, nonblank for revision. Returns 204. |

Submission validation does not fetch or verify the evidence URL. Mentors must confirm access and inspect the actual work. A revision overwrites the current evidence/summary and a later review replaces feedback; this is not an immutable review log. Keep this limitation visible until audit history is implemented.

## 4. Recommended remaining implementation order

These are proposed follow-ups with acceptance criteria. They are not all approved for immediate implementation. Start with a small pilot, not a broad rewrite or another visual rebrand.

### P0: Mentor content review and pilot readiness

**Why:** the core experience works; learning usefulness still needs real interns and mentor review.

- Walk all 30 lessons using the mentor curriculum preview and record feedback by stable ID, including the wording of every check feedback line.
- Confirm setup permissions, approved AI access, starter-app storage scope, weekly evidence expectations and available mentor time.
- Reconcile the source PDF's video/resource inventory and missing prompting guide. Do not invent titles or URLs.
- Add the pre-pilot content packages listed in [CURRICULUM](CURRICULUM.md#remaining-content-planned).
- Run one fresh learner through F1 → Week 1 submission → revision → approval. Record confusing language, actual effort and where help was needed.

**Acceptance:** a mentor has approved required content and access instructions; a learner can finish the first useful slice without undocumented setup knowledge; no placeholder project assignments masquerade as real tasks.

**Likely files:** `content/program.json`, content companion files, schema tests, possibly reusable resource/lesson rendering. Keep full answers for independent explanation tasks out of the repository.

### P1: Mentor-assigned project briefs

**Why:** Weeks 2–4 currently describe a mentor assignment, but actual assignment details live outside the app.

Proposed learner-specific fields: repository URL, issue/task URL, user problem, expected behavior, non-goals, acceptance criteria and mentor notes intended for the learner. Decide whether assignments span Weeks 2–4 or are per-week before adding tables.

**Acceptance:** mentors can create/update an assignment for an authorized learner; the learner sees only their assignment; missing assignment has a helpful empty state; drafts survive an error; invalid URLs and cross-user writes are rejected server-side. Existing weekly evidence and sign-off remain intact. No automatic GitHub writes or repository scanning.

**Tests:** mentor authorization, forged identity, learner isolation, missing/updated assignment, malformed URL, save/reload and assignment changes after review.

### P1: Safe in-app curriculum editing

**Why:** the user wants to inspect and eventually update the planned syllabus without depending on a developer. Full inspection now exists; editing does not.

Design the lifecycle first: **draft → validate → preview → publish**, with an explicit publish confirmation and clear separation between draft and what active learners see. Text changes and material changes have different risks.

Implementation prerequisites:

1. Choose the source of truth: versioned database records or repository-managed revisions. Do not casually write deployed JSON files; container files can be replaced on release.
2. Decide cohort enrollment/version pinning and old-progress behavior. Versioned reviews alone are insufficient.
3. Define immutable published snapshots or an equivalent history policy, audit author/time and conflict detection for concurrent edits.
4. Add server-side schema validation, unique IDs, complete weekly mappings, resource reference validation and safe URLs.
5. Build structured forms for week briefs, lessons, resources and glossary. Use the existing mentor preview for draft review. No raw HTML injection.

**Acceptance:** mentors can edit a draft, preview the exact learner result, detect validation errors, recover from failed save and publish intentionally. Interns cannot write/publish. Existing learner predictions/completion and signed-off checkpoints retain their original meaning. Competing saves surface a conflict rather than overwriting silently. Rollback/republication behavior is defined and tested.

**Do not:** implement a single “save JSON” endpoint with no history, silently change stable lesson IDs, put mentor secrets in learner content, or claim that bumping the version solves migration.

### P2: Mentor learner-detail and review history

**Why:** the current cohort overview is useful but shallow. Full prediction context, prior feedback and changes across revisions are hard to audit.

Add a learner-detail screen with lesson stages, exact predictions, evidence, feedback and actual timestamps. Add immutable submission/review events before presenting a historical timeline. Decide retention and mentor/cohort ownership before supporting multiple mentors.

**Acceptance:** reviewers can follow a submitted → changes requested → resubmitted → approved cycle without losing old evidence; current and historical status are distinguishable; internal flags remain mentor-only; missing users and empty histories render safely.

### P2: Learning support and content enrichment

- Graduated hints, optional stretch tasks and examples, using an explicit content schema.
- Format filtering for resources if the inventory grows; preserve combined-filter empty/reset behavior.
- Better inline glossary explanations where a real novice needs them.
- Optional server-saved reflection journal, only after deciding learner privacy and mentor visibility. Do not label a prompt as saved until persistence exists.
- Completion summary based on actual approved checkpoints, not just thirty clicked lessons. Keep pending approvals visible.

**Acceptance:** existing content renders when optional fields are absent; optional work never blocks the required path; failure and empty states are designed; no invented achievements or automated competency claims.

### P3: Operational hardening and production readiness

- Add repeatable browser end-to-end tests for authentication, lesson/save errors, evidence revisions, mentor preview and mobile navigation.
- Test an additive schema update against a copy of an existing database; verify backup/restore procedures in a safe environment.
- Review rate limiting, CSRF protections/session policy, log redaction, evidence-link handling and account recovery. Do not label this handoff a security audit.
- Review runtime pinning, deployment configuration and font hosting/network policy. No new packages were required for this UI implementation.
- Assess keyboard/screen-reader behavior, zoom/reflow and contrast with a repeatable accessibility check. Current targeted checks are not a compliance certification.
- Configure observability and release smoke tests appropriate to the actual deployment, with user approval.

**Acceptance:** tests cover real role boundaries and persistence; migration/backup rollback is rehearsed; release is explicitly authorized; actual production behavior is checked after deployment, not inferred from a local build.

## 5. UI/UX continuation rules

[DESIGN.md](../DESIGN.md) is the visual source of truth; inspect the existing components before introducing a new pattern.

- Reuse the warm canvas, sage surfaces, green primary actions, restrained revision color and readable type hierarchy.
- Keep a clear page heading, short explanation and one dominant action. Mentors need denser information, not a different brand.
- Preserve route permalinks, browser Back/Forward, main-content focus movement and visible keyboard focus.
- Every editable flow needs loading/saving, validation, server failure, retry and success states. Keep user text on failure. “Saved” must distinguish browser-only draft from server persistence.
- Keep mentor preview read-only and ungated. Never simulate course completion just to show content.
- Confirm destructive or publishing actions with clear consequences; ordinary preview/navigation should be frictionless.
- Design empty states honestly: no learners, no review requests, missing assignment and no resource matches are expected states.
- Mobile must remain usable at 320–390px; forms and long URLs must not force page overflow. Use one reading column and reachable actions. Check the mentor navigation as well as learner navigation.

## 6. Verification and release checklist

Automated verification at this handoff: **98 tests passing** (37 client, 61 server), client lint, production build and whitespace checks. Tests cover the full curriculum content rules (checks, hints, by-hand tasks, reading length, weekly load), the check-answer gate, the by-hand lock before the Claude Code task, staged hints, mentor curriculum expansion with checks and feedback, lesson permalinks, unknown lesson recovery, mentor direct lesson preview and learner exclusion from that preview. Unit tests use mocked client APIs; server tests use isolated databases and dedicated allowlisted accounts.

Earlier local browser checks covered prediction/draft/reload, task completion, contextual question/reply, evidence submission → requested revision → resubmission → sign-off, resource filters, logout, and desktop/tablet/narrow-mobile layouts. Those used synthetic users and in-memory data, not production. Screenshots are local artifacts, not durable test fixtures.

The earlier mentor-preview follow-up was checked in the local browser on the v1 content: all lessons expanded, a late-lesson permalink showed its full task, no learner forms or progress writes were emitted, and the final mobile navigation kept all six destinations visible. The 320px layout and targeted text-contrast checks passed; the authenticated preview had no console errors. A pre-login 401 during fixture setup was expected, not a failed authenticated request.

Before each release:

- [ ] Run `npm test`, `npm run lint --workspace client`, `npm run build` and `git diff --check`.
- [ ] Validate all content IDs, week ordering and resource references. Run link checks when resource URLs change.
- [ ] Use a fresh allowlisted learner and mentor in an isolated database; never bypass the allowlist to test.
- [ ] Open Curriculum, expand all, deep-link a late lesson, and verify no prediction/progress write occurs.
- [ ] Verify learner progression, failure recovery, reload persistence and account-scoped drafts; logout clears drafts.
- [ ] Verify unfinished submission is blocked, revision feedback is required, resubmission works, and approved work is locked.
- [ ] Recheck permission boundaries by API, not merely hidden buttons. Learners cannot review or publish.
- [ ] Test existing user data and old approvals without converting or deleting them.
- [ ] Check 320/390/768/1440px layouts, keyboard navigation, focus, long text, empty/error states and console output.
- [ ] Review the staged diff for secrets, local QA accounts/cookies, `.env`, data files and `.context` artifacts.
- [ ] Obtain explicit approval before push/deployment/infrastructure changes where not already authorized. Record commit, backup and rollback plan for a release.

## 7. Open decisions for the owner

These do not block running the current app. Resolve them before the relevant follow-up:

1. Who owns curriculum approval and how often is it reviewed?
2. Which AI provider, access method, budget and privacy rules apply to interns?
3. Which exact source-PDF videos and prompting guide should be retained?
4. Should assignments be per learner, per cohort, or both?
5. Should an in-app editor publish to the repository or a versioned content store? What happens to active cohorts?
6. Are reflections private to the learner, shared with their mentor, or not stored?
7. Does the program need multiple mentors and scoped cohorts, or is the current single configured mentor enough?
8. What are the approved production URL, backup policy and release process?

## 8. Suggested first task for the next contributor

Read the four entry-point documents, run tests under the Node version in `.nvmrc` (the native SQLite module is built for it), sign in with a dedicated local mentor, and inspect all five weeks. Pick **one** P0 content improvement with the mentor, update `program.json`, preview it in Curriculum, test it as a learner, and add a regression test. Keep the existing design and stable IDs. Do not begin by rebuilding the shell or installing a new UI framework.
