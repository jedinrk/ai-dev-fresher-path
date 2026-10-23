# Mentor curriculum reference

Status: core curriculum authored and implemented, `first-build-v1`. This document summarizes the active [program data](../content/program.json). The in-app **Curriculum** view renders that data directly and is the best place to inspect the latest full lesson text.

Related: [editing guide](how-to-maintain-curriculum.md), [implementation backlog](HANDOFF.md), [UI/UX standards](../DESIGN.md).

## Program intent

The source was the supplied `AI_Dev_Learning_Path.pdf`. Preserve its four-week progression, To-Do starter project, mentor-assigned team project, software-development and generative-AI resource tracks, and 5–10 minute final demo. The twenty short lessons, detailed prompts, checklists, and evidence-review workflow are teaching scaffolding authored for the interactive app, not verbatim PDF content.

The intended outcome is increasing independence, not simply finishing pages. Learners should understand one interaction, make a useful change, verify it, respond to review, and explain what they did. The weeks are an organizing structure, not enforced dates or five mandatory daily attendance slots. Lesson time estimates include practice but do not represent the total internship workload.

## How a mentor sees everything

After signing in with a mentor account, choose **Curriculum** in the navigation or **View full curriculum** in Mentor workspace. Use **Expand all lessons** to inspect every prediction prompt, explanation, optional code/starter prompt, task, checklist, hint, reflection, and reference. Every week also shows its project brief and expected checkpoint evidence.

Lesson permalinks use `#curriculum/F1`, for example. These open the selected lesson and its containing week. **All four weeks** returns to the overview. Existing `#lesson/F1` links also open the read-only preview for mentors. No learner steps need to be completed, no fake predictions are created, and no progress is written by this view.

This is a read-only inspector, not a content editor. Follow the [editing guide](how-to-maintain-curriculum.md) for repository updates. The route is mentor-only in the UI; the shared lesson data is already available to every authenticated learner through the content API. Never place confidential mentor answers or internal grading notes in that shared data.

## Week 1: Find your footing

Purpose: become comfortable with the tools, work thoughtfully with Cline, and build a small application that works.

| Order / ID | Lesson | Expected practice / evidence | Approx. minutes |
| --- | --- | --- | --- |
| 1 / F1 | Meet your workspace | Open a folder, locate it in the terminal, create a file and explain a listing command. | 20 |
| 2 / S1 | Get your tools ready | Check VS Code, Node/npm, Git, GitHub and Cline; report missing access to the mentor. | 35 |
| 3 / F8 | Give your AI partner a clear brief | Review a small plan, challenge an assumption, inspect the resulting change, try a normal and edge case. | 25 |
| 4 / F2 | Build your first To-Do flow | Add, complete and remove tasks; reject blank input; explain storage and refresh behavior. | 60 |
| 5 / F5 | Check it. Then show it. | Observe a meaningful test fail and pass; save work on a branch and demo the app. | 40 |

Project: **A little app. A real beginning.** Build a To-Do app with Node.js and basic HTML, CSS and JavaScript. Keep the storage choice small and explicit.

Checkpoint expectations:

- A working To-Do app with useful empty-input feedback.
- A meaningful automated test.
- A repository and a short demo.
- An explanation of where tasks live and what happens on refresh.

Mentor preparation: provide the approved AI provider/access policy and local tool guidance before setup. Do not tell interns to purchase credits. Agree whether the starter persists data, and do not confuse an in-memory implementation with a broken persistence feature that was never required. Check one behavior yourself and ask the learner to trace it. F8 deliberately appears in Week 1; the older foundation sequence introduced AI much later.

## Week 2: Make your first contribution

Purpose: understand a real user problem and deliver one scoped contribution in a team codebase.

| Order / ID | Lesson | Expected practice / evidence | Approx. minutes |
| --- | --- | --- | --- |
| 6 / P1 | Understand the real problem | Agree on a brief, three acceptance checks and one explicit non-goal. | 25 |
| 7 / F6 | Run and map the project | Run the assigned repository, locate scripts and data flow, identify a fake secret in a disposable example. | 40 |
| 8 / F3 | Follow a request | Identify method, path, status and body in a real request; describe useful failure feedback. | 25 |
| 9 / P2 | Make one useful change | Implement the assigned change on a branch, check acceptance criteria, add a relevant test. | 60 |
| 10 / F4 | Prepare your first review | Commit/push and prepare a review handoff or draft PR with verification and uncertainties. | 30 |

Project: **A small change with a real purpose.** The mentor chooses the actual repository and task. There is no built-in project-assignment editor yet; communicate the assignment outside the app and use the project evidence field for the handoff.

Checkpoint expectations:

- A mentor-agreed brief and acceptance criteria.
- A working feature or fix on a task branch.
- A relevant test and verification notes.
- A review handoff or draft pull request.

Mentor preparation: supply repository access, setup instructions, a scoped issue and review expectations. Make success observable; avoid vague assignments such as “improve the app.” F6 intentionally replaces the earlier required Git-history secret-removal exercise with safe fake-secret identification. Real secret exposure must be escalated through the team's process, not practiced on a shared repository. A draft PR in Week 2 is an early-feedback addition; formal submission continues in Week 3.

## Week 3: Make it better, together

Purpose: act on feedback, improve maintainability/usability and handle a slightly more demanding task.

| Order / ID | Lesson | Expected practice / evidence | Approx. minutes |
| --- | --- | --- | --- |
| 11 / R1 | Turn feedback into a plan | Turn review comments into an action list; clarify uncertainty and address agreed changes. | 25 |
| 12 / R2 | Make the code easier to read | Refactor one small area, demonstrate tests still pass and explain the change. | 35 |
| 13 / R3 | Build for the person using it | Improve one interaction; check applicable empty/loading/error/success states, keyboard use and mobile layout. | 45 |
| 14 / R4 | Take the next challenge | Complete a second scoped task in small steps and record a tradeoff. | 60 |
| 15 / F7 | Submit and follow the checks | Submit/update PRs and explain actual CI checks, or clearly label a mentor-provided example. | 30 |

Project: **Good work gets better with feedback.** Keep changes focused so a reviewer can understand why each one exists.

Checkpoint expectations:

- Review feedback addressed or discussed.
- A focused refactor and usability improvement.
- A second scoped contribution.
- Submitted PRs with their checks explained.

Mentor preparation: provide actionable review comments and a second task. A green check does not establish that every requirement is correct. If the team project lacks CI, provide a labeled sample rather than inventing a successful run. Review usability with the learner, not just implementation structure.

## Week 4: Finish and tell your story

Purpose: leave useful work behind, present its value and explain it independently.

| Order / ID | Lesson | Expected practice / evidence | Approx. minutes |
| --- | --- | --- | --- |
| 16 / D1 | Close the remaining gaps | Resolve open review items, request the appropriate merge step and identify blocker owners. | 35 |
| 17 / D2 | Leave a useful handover | Document setup, behavior, verification, decisions, limits and next steps; have someone follow one instruction. | 40 |
| 18 / D3 | Tell the story of your build | Rehearse a 5–10 minute demo: problem, interaction, decision, checks and next improvement. | 35 |
| 19 / D4 | Show it. Explain it. Own it. | Present, trace an interaction and answer mentor questions **without AI assistance**. | 30 |
| 20 / D5 | Look back. Choose what’s next. | Reflect with evidence, one surprising lesson, one limitation and one concrete next goal. | 20 |

Project: **Leave something the team can build on.** Pending merges or dependencies must be reported honestly. Demo/handover work need not wait for a merge controlled by somebody else.

Checkpoint expectations:

- Accurate status of all open contributions.
- A tested handover document.
- A 5–10 minute demo delivered to the team.
- A reflection and one concrete next learning goal.

Mentor preparation: arrange the demo audience, confirm the handover reader and ask understanding-oriented questions. Do not add generated answer scripts or solutions for D4. The learner can acknowledge uncertainty and investigate afterward; the goal is honest ownership, not memorized delivery.

## Reviewing work consistently

The existing app provides deliverables and free-text feedback, not a numeric grading system. Recommended review conversation:

1. Open the evidence and check the agreed behavior and relevant edge case.
2. Ask the learner to explain an implementation choice and how they checked it.
3. Compare submitted work with the week's deliverables. Distinguish missing evidence from a misunderstood concept.
4. Request changes with specific feedback if required work is missing. The learner can then resubmit.
5. Sign off only after reviewing the actual work. Lesson completion alone is not project approval.

Predictions are the learner's original thinking, not an exam answer to rewrite. Reflection prompts in lessons are currently discussion prompts, not saved journals. Ask for final reflection in the evidence summary or a linked handover. Never expose internal wrong-prediction flags to learners.

## Resource inventory

The app currently contains eight publisher references, grouped into **Development** and **Generative AI**: VS Code, Node.js, GitHub, Cline, Microsoft Generative AI for Beginners, MDN, React and Write the Docs. Each entry includes its purpose, takeaway, relevant weeks, format and required/optional label. Search/topic/week filtering exists; format filtering does not yet exist.

There are twelve glossary terms: terminal, repository, dependency, frontend, backend, API, commit, branch, pull request, test, deployment and prompt. Initial publisher URLs were checked on 2026-10-23; recheck them before a new cohort, particularly setup instructions. Do not infer that a link check is a pedagogical review of an entire course.

## Remaining content planned

These are proposed enrichment items, not empty core lessons or promised release features. Implement them after mentor approval and a small learner pilot. Keep them in `content/` and render through reusable components.

| Priority | Content package | Proposed scope and acceptance |
| --- | --- | --- |
| Before pilot | Mentor review of all 20 lessons | Check prerequisites, task feasibility, AI rules, durations and local team conventions; record decisions by lesson ID. Confirm who owns updates. |
| Before pilot | Local setup companion | Windows/macOS/Linux troubleshooting; approved Node/runtime and AI provider; proxy/access problems; non-sensitive verification examples. Mentor supplies organizational policy. No real keys or paid-provider assumptions. |
| Before pilot | Starter-app scope sheet | Explicit storage expectation, task behaviors, normal/blank/whitespace checks, one meaningful test and demo checklist. No large framework starter unless needed by this cohort. |
| Before pilot | Mentor checkpoint rubrics | Behavioral evidence, explanation questions, common misconceptions and revision guidance for each week. Confidential notes require a separate mentor-only API/data store, not shared `program.json`. |
| Next | Source-PDF resource reconciliation | Recover exact software-development videos, demo video and any separate prompting guide from the owner; check availability, relevance, permission and learner effort. Current references are a curated subset, not a claim that every PDF resource was imported. |
| Next | Assignment and handoff templates | A scoped brief, acceptance criteria, PR description, review response, handover outline and demo outline. Use clearly labeled fictional examples. Never invent a real employer project. |
| Next | Graduated hints and stretch tasks | Start with F2/F5/F6/F3, then R2/R3/F7. Hints should unblock investigation without handing over a solution. Optional stretch tasks must not block completion. Define schema before adding these arrays. |
| Next | Missing glossary context | Add context, environment variable, HTTP status, acceptance criterion, refactor and CI as needed. Add inline explanations on first use, not just a larger glossary. |
| Later | Worked debugging walkthrough | One observable failure, hypothesis, focused check and verified fix in a disposable exercise. No destructive commands or real credentials. |
| Later | Post-program next paths | Optional frontend, backend and AI-assisted engineering follow-ups based on mentor feedback. These are not an approved fifth week or a replacement for the four-week core. |

Do not expand content merely to increase lesson count. Pilot evidence should decide whether a learner needs a better explanation, an earlier prerequisite, a smaller task or an optional deeper reference.
