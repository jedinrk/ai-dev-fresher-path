# Mentor curriculum reference

Status: `first-build-v4`, six weeks and thirty-six lessons, authored and implemented on 2026-10-25. This document summarizes the active [program data](../content/program.json). The in-app **Curriculum** view renders that data directly and is the best place to read the full lesson text, checks, and feedback lines.

Related: [editing guide](how-to-maintain-curriculum.md), [implementation backlog](HANDOFF.md), [UI/UX standards](../DESIGN.md).

## Program intent

Six weeks, thirty-six lessons, one project. The learner builds **Triage**: A small issue board for a team. Open, In progress, Done. In Week 5 it gains an assistant that suggests labels, and the person decides. Every week adds a layer to the same codebase, so coverage of frontend, backend, database, testing, version control, CI, coding principles, language models, agents, prompting, instruction files, skills, the Claude API, deployment, and one real team contribution does not depend on which repository a mentor happens to assign.

The primary AI tool is **Claude Code**, installed in L08 and used to write code from L09, always after a by-hand task. Every lesson opens with Before you start and has one Read this now reference inside Learn; every lesson where Claude Code writes code ends with Explain it back. No lesson involves real team work; the capstone is a Triage ticket.

Target outcome: after the full cycle an intern can say what each of the following is and show how they implemented it by hand: frontend, backend, database, CI/CD, version control, SOLID and clean architecture, LLM models, AI agents, ML versus GenAI, developer prompting, CLAUDE.md-style instruction files, skills, and where models run (Claude API, OpenAI API, Microsoft Foundry and other cloud platforms, the Agent SDK).

## How every lesson works

Each lesson follows the same seven steps. The app enforces the gate at step five.

| Step | Learner experience | Design principle |
| --- | --- | --- |
| Predict | One question answered in their own words before any explanation. Stored as written, never edited. | Concept before tool |
| Check | Two or three multiple-choice checks with instant feedback. Each option has its own feedback line naming what was wrong and why. | Misconceptions checked directly; feedback on the work |
| Learn | Under five minutes of reading, plus at least one example block (a diff, a request and response, a config file). | Reading under five minutes |
| By hand | A no-AI task of ten to twenty minutes. Must be ticked before the next part opens. | Gates before AI tools |
| With Claude Code | The same idea applied with the agent, often with a starter prompt. Hidden until the by-hand checklist is complete. | Hands-on in every lesson |
| Hints | Three staged hints revealed one at a time. The last names where to look, never the answer. | Automatic hints |
| Reflect and next | A discussion prompt, then the next lesson and the week's checkpoint state. | Visible next step |

Mentor rhythm shown in the app: weekly review **Thursday 18:00 to 18:30 IST**; question log replies: Usually within one working day, and by the end of the week at the latest. Urgent and important questions: ping your mentor directly.

Legacy IDs F1 to F8 are kept for the same concepts, so earlier predictions and completions keep their meaning. Foundation files under `content/concepts/` contribute only their original concept name.

## How a mentor sees everything

Sign in with a mentor account and choose **Curriculum**, or **View full curriculum** in Mentor workspace. **Expand all lessons** shows every prediction prompt, check with its correct answer and feedback, explanation, example, by-hand task, Claude Code task and prompt, staged hints, reflection, and references. Lesson permalinks use `#curriculum/F1`. The view never writes progress.


## Week 1: Find your footing

Rewritten on 2026-10-25 for the six-week frame (tools first, then how software and language models work, Claude Code from Week 2). Weeks 2 to 5 below are still the v2 lessons and will be rewritten in the same way.

Purpose: Set up your tools, learn how a web app and a language model work, and record your first program in Git.

| Order / ID | Lesson | Interactive | By hand, no AI | Min |
| --- | --- | --- | --- | --- |
| 1 / L01 | Install and verify | Setup checklist, shown before the prediction | Every row verified; version numbers in notes.txt; Git name and email set | 35 |
| 2 / L02 | Files, the terminal, and your first program | none | hello.js prints three titles; break it on purpose and read the error line | 40 |
| 3 / L03 | How a web app works | Request tracer: six hops from Add to the updated board | Record a real request from this app's Network tab | 45 |
| 4 / L04 | Frameworks and stacks | Stack map: React, Express, SQLite highlighted; FastAPI, Django, Streamlit, and others explained | Two lines each on one unused choice per layer | 35 |
| 5 / L05 | Git and GitHub | Git playground: init, commit, push, branch | triage repository with .gitignore and two commits, pushed | 45 |
| 6 / L06 | What a language model is | Token counter; rules / machine learning / generative AI sorter | Five sentences with confidence marks, then checked | 45 |

Every Week 1 lesson opens with **Before you start**: the topics to read or watch first (for example client and server, HTTP methods, status codes, JSON, and REST before L03; language, runtime, library, framework, and SQL versus NoSQL before L04; HTTPS versus SSH and the GitHub SSH guide before L05). The prediction unlocks when all topics are ticked. The in-app text is a short introduction; the linked references carry the depth.

Lesson time this week: about 4h 05m plus the preparatory reading. No lesson uses Claude Code; it is installed and introduced in Week 2 after the AI concepts.

Project: **Triage, before the code.** Install the tools, write and run a small program, and push it to a repository called triage. Along the way you learn the shape of a web app and what a language model does, so that when you build Triage next week you know what each part is for.

Checkpoint evidence:

- VS Code, Node.js, and Git installed and verified, and a GitHub account signed in
- hello.js runs and prints issue titles, and you can read an error line and fix it
- A GitHub repository called triage with a .gitignore and two outcome-named commits
- A two-minute explanation of the six hops of a request, in your own words

Mentor preparation: confirm GitHub push authentication (token or GitHub CLI) before L05 and say so in the question log. Ask for the six hops in the learner's own words at the review; the request tracer gives them the vocabulary. The Microsoft course from the original PDF is no longer referenced; Week 1 videos are 3Blue1Brown, IBM Technology, and Fireship, all checked on 2026-10-25.

## Week 2: Meet the agent, build the API

Rewritten on 2026-10-25. Claude Code is introduced in L08 and used only to explain; it writes code first in L09, after the intern has written routes by hand in L10 and L11 it finishes the API in L12. Every lesson opens with Before you start and has one Read this now reference inside Learn.

Purpose: Understand what an agent is, install Claude Code, learn to prompt it, then give Triage a server and a database, writing the first routes yourself.

| Order / ID | Lesson | Read this now | By hand, no AI | With Claude Code | Min |
| --- | --- | --- | --- | --- | --- |
| 1 / L07 | What makes it an agent | Anthropic, Building effective agents | Label a transcript Read / Decide / Act / Ask; circle the missing Ask | none | 40 |
| 2 / L08 | Meet Claude Code: install and first session | Claude Code quickstart | Setup checklist (CLI, Claude.ai sign-in, VS Code extension, /help, plan mode); CLAUDE.md by hand | Explain hello.js and .gitignore; compare /init with your CLAUDE.md | 45 |
| 3 / L09 | Prompting for developers | Claude prompt engineering overview | Rewrite three vague prompts with goal, context, constraints, check; prompt builder | Vague prompt, read the plan, discard; clear prompt, read the diff, commit; **Explain it back** | 40 |
| 4 / L10 | Backend: your first two routes by hand | Express hello world | server.js with two GET routes, 404, start script | none | 60 |
| 5 / L11 | Database: SQLite by hand | SQLBolt lessons 1 to 6 | db-play.js: create, insert, select, update; explain the doubled rows | none | 50 |
| 6 / L12 | Finish the API with Claude Code, and explain it back | Claude Code common workflows | POST by hand with 400 and 201; prediction list of files | PATCH, DELETE, db.js in plan mode, one plan per route; **Explain it back** | 65 |

Lesson time this week: five hours, with the two build lessons the largest; plan for the preparatory reading on top. Interns sign in to Claude Code with their own Claude.ai account; nothing is bought and no API key is used this week.

Project: **Triage gets a server.** See the brief in the app. Deliverables: Claude Code installed both ways and a hand-written CLAUDE.md; two GET routes in the intern's own typing; a SQLite file written by a script they wrote; POST by hand, PATCH and DELETE with Claude Code with an Explain it back entry each; a two-minute walk-through of one request.

Explain it back: the intern's own account of each Claude Code change (what changed, why, what breaks if a line is removed) is saved on the server, shown to the mentor in the review card next to the predictions, and replayed to the intern on the project page. Use it as the first five minutes of the Thursday review.

Mentor preparation: confirm every intern has a Claude.ai account before L08 and say so in the question log. Have a known-bad diff ready (SQL built from strings) in case Claude Code produces only clean ones in L12.

## Week 3: Put it on screen

Purpose: Learn how React thinks, build the Triage board by hand, wire it to your API, write tests that fail first, and open your first pull request.

| Order / ID | Lesson | Read this now | By hand, no AI | With Claude Code | Min |
| --- | --- | --- | --- | --- | --- |
| 1 / L13 | Why React, and how it thinks | react.dev Thinking in React | Component tree on paper; render tracer | none | 40 |
| 2 / L14 | The board by hand | react.dev Quick start | Vite app, four components, add form on local state | none | 60 |
| 3 / L15 | Wire it to the API | react.dev Synchronizing with effects | Proxy, GET in an effect, loading state | POST, PATCH, DELETE; **Explain it back** | 55 |
| 4 / L16 | Tests, fail first | Testing Library intro | One API test and one component test, red first | Smallest change to green; **Explain it back** | 50 |
| 5 / L17 | States and usability | MDN accessibility | Eight states with words; keyboard-only attempt | Implement states; **Explain it back** | 50 |
| 6 / L18 | Your first pull request | GitHub About pull requests | Branch, description under four headings | Review of the diff, judged item by item | 45 |

Mentor preparation: review the Week 3 pull request before Thursday with at least four comments of different kinds (bug, clarity, question, preference); L21 opens by answering them. Have a sample pull request available for the intern to comment on.

## Week 4: Work like a team

Purpose: Name the principles behind good code, split Triage into layers, answer your review, keep secrets out, let CI run your tests on every push, and put Triage on a server.

| Order / ID | Lesson | Read this now | By hand, no AI | With Claude Code | Min |
| --- | --- | --- | --- | --- | --- |
| 1 / L19 | SOLID, in plain words | DigitalOcean SOLID | Mark reasons-to-change in server.js; principle sorter | none | 45 |
| 2 / L20 | Clean architecture: layers and the dependency rule | Robert C. Martin, The Clean Architecture | Extract validation; status table with a database-free test | Split into routes/service/db; **Explain it back** | 60 |
| 3 / L21 | Code review, both directions | GitHub Reviewing changes | Reply to every comment; leave two of your own | One commit per comment; **Explain it back** | 40 |
| 4 / L22 | Dependencies, environments, secrets | Twelve-Factor config | Lockfile version, .env.example, planted secret removed | Config from env, fail fast; **Explain it back** | 45 |
| 5 / L23 | CI: automate the checks | GitHub Actions quickstart | Pipeline tracer; workflow by hand with a prediction | Fix a red run, add a check; **Explain it back** | 50 |
| 6 / L24 | Docker and deploy | Docker Get started | Dockerfile and .dockerignore; volume survives a new container | deploy.sh; server with mentor at the keyboard; **Explain it back** | 60 |

Mentor preparation: supply a disposable repository with a planted fake secret for L22, a sample red CI run in case the intern's first run is green, and be at the keyboard for the L24 deploy.

## Week 5: AI inside the product

Purpose: Build a rule-based labeler by hand, learn the four ways to reach a model and when to choose each, call Claude from code, make the prompt safe, and ship a suggestion the person decides on.

| Order / ID | Lesson | Read this now | By hand, no AI | With Claude Code | Min |
| --- | --- | --- | --- | --- | --- |
| 1 / L25 | The rule-based labeler and a test set | Google ML crash course: classification | Labeler, fifteen-issue test set with held-back items | Score script; **Explain it back** | 50 |
| 2 / L26 | Where models run: Claude API, OpenAI API, Foundry, and the Agent SDK | Claude Get started | Surface picker; three scenarios; one direct request | none | 45 |
| 3 / L27 | Call the model from code | Claude Messages API | Request on paper; key in env only; cost estimate | SDK, service/assistant.js, suggest route; **Explain it back** | 55 |
| 4 / L28 | Prompts that ship | Claude Structured outputs | System prompt builder; schema; five more test issues | Structured output, validation, error handling, scores; **Explain it back** | 50 |
| 5 / L29 | Instruction files and skills | Claude Code Skills | Rules learned in CLAUDE.md; a skill by hand | Use and fix the skill | 40 |
| 6 / L30 | The triage assistant | Claude API Errors | Four card states; suggestions table; test plan | Full flow with fallback; pull request with scores; **Explain it back** | 60 |

Mentor preparation: provide the API key through the approved channel before L27 and confirm the model and budget. Run the model-down test yourself at the review.

## Week 6: Finish your Triage

Purpose: Add one last feature to your Triage app, write the document that lets someone else run it, demo it to the team, explain your own code without AI, and write what you learned.

| Order / ID | Lesson | Read this now | By hand, no AI | With Claude Code | Min |
| --- | --- | --- | --- | --- | --- |
| 1 / L31 | Choose your last feature | Atlassian user stories | Pick one of three features (each with numbered requirements); write docs/feature.md | Plan mode only: list the files, compare | 45 |
| 2 / L32 | Build your last feature | Claude Code Common workflows | Requirement 1 end to end, by hand | One plan per requirement; PR with CI green; **Explain it back** | 90 |
| 3 / L33 | Write the handover document | Write the Docs | HANDOVER.md; someone else follows Run it | Questions a newcomer would still have | 40 |
| 4 / L34 | Prepare your demo | Write the Docs (audience) | Outline with minute marks; rehearsal; fallback | Three audience questions | 35 |
| 5 / L35 | Demo it, then explain your code without AI | none new | Demo; explain one click through the code with every AI tool closed | none | 30 |
| 6 / L36 | Write what you learned, and what is next | GitHub About pull requests | Open-PR status; reflection; dated goal | Compare early predictions | 30 |

The three features, each with explicit numbered requirements in the lesson: a Blocked column, search and filter, and per-user boards (no login). The intern picks one and the mentor agrees it in the question log. No real team work is involved; the decision to involve the intern in real work is made after the program.

Mentor preparation: agree the feature choice in L31 before L32 starts. Arrange the demo audience and a handover tester who is not you. In L35, pick the click yourself and do not provide generated answers.

## Reviewing work consistently

The app provides deliverables and free-text feedback, not a numeric grade. Recommended review conversation, inside the Thursday 18:00 to 18:30 IST slot:

1. Open the evidence and check one agreed behavior and one edge case yourself.
2. Ask the learner to trace one interaction and explain how they checked it.
3. Compare the submitted work with the week's deliverables. Distinguish missing evidence from a misunderstood concept.
4. Name the specific prediction, check, or output that was wrong, and the reason. Feedback is about the work.
5. Request changes with specific feedback if required work is missing. Sign off only after reviewing the actual work.

Predictions are the learner's original thinking. Check answers are self-assessment with instant feedback; they are not stored on the server and should not be graded. Reflection prompts are discussion prompts, not saved journals. Never expose internal wrong-prediction flags to learners.

## Resource inventory

26 publisher references in two tracks, **Development** and **Generative AI**, each with a purpose, takeaway, relevant weeks, format, and required/optional label. All URLs returned HTTP 200 on 2026-10-24. Recheck setup and tool pages before each cohort. 36 glossary terms cover the vocabulary used in the lessons, including LLM, token, context window, agent, plan mode, CLAUDE.md, skill, machine learning, generative AI, and structured output.

## Remaining content work

| Priority | Item | Scope |
| --- | --- | --- |
| Before pilot | Mentor read-through of all thirty lessons | Check feasibility, durations, local tool policy, and the check feedback wording. Record decisions by lesson ID. |
| Before pilot | Disposable secret-example repository for F6 | A tiny repository with a fake key in history. No real credentials. |
| Before pilot | Sample issues for Week 4 | Fifteen realistic issue titles with expected labels, if the learner's own set is thin. |
| Next | Optional stretch tasks | For faster learners: React rebuild of the board, a Blocked status, per-user boards. Must never block completion. |
| Later | Server-saved check results | Only if mentors want to see which checks were missed; decide privacy first. Today checks are browser-local. |

Do not expand lesson count to increase coverage. Pilot evidence should decide whether a learner needs a better explanation, an earlier prerequisite, a smaller task, or a deeper reference.
