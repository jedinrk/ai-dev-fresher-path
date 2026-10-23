# First Build

An invitation-only, four-week learning studio for freshers and junior developers. Learners build a small app, contribute to a team project, respond to review, and explain their work. Each lesson follows **Predict → Learn → Prove**; weekly evidence is reviewed by a mentor.

## Start here

- [Implementation handoff and remaining plan](docs/HANDOFF.md): current state, prioritized backlog, acceptance criteria, technical constraints, and release checks.
- [Mentor curriculum reference](docs/CURRICULUM.md): all 20 lessons, weekly expectations, facilitation notes, and planned content enrichment.
- [How to maintain the curriculum](docs/how-to-maintain-curriculum.md): mentor preview, content editing, verification, and versioning precautions.
- [UI/UX standards](DESIGN.md): the Builder's Studio visual language and interaction rules.
- [Content schema and compatibility](content/README.md): active content and preserved foundation records.
- [Repository working rules](CLAUDE.md): security and development conventions.

## Current capabilities

Learners have a Today page, explorable roadmap, saved lesson progression, project evidence/revision flow, resource search, and contextual questions. Mentors have a review queue, cohort overview, question replies, legacy administration, and a full read-only curriculum preview. The preview opens all lesson stages without submitting predictions or altering progress.

**Content editing currently happens in the repository, not in the browser.** All 20 core lessons are authored. Additional guides, examples, structured mentor rubrics, and an in-app curriculum editor are future work, not existing features.

## Run locally

Use the Node LTS selected by `.nvmrc`. The verified development runtime for this handoff was Node 24.22.1; `.nvmrc` currently tracks `lts/*` rather than pinning that exact version.

1. Run `nvm use` (or select a compatible Node LTS), then `npm ci` at the repository root.
2. Create a **local-only** `.env.local` using the variable names in `.env.example`. Set `PORT=3000`, `NODE_ENV=development`, `DB_PATH=./data/local.db`, a freshly generated `SESSION_SECRET`, and your dedicated local `ALLOWLIST_EMAILS` / `MENTOR_EMAIL`. The mentor email must also be allowlisted. Generate the secret locally with `openssl rand -hex 32`; never paste it into a commit or chat. No DigitalOcean token is required for development. Do not overwrite an existing environment file or point at a production database.
3. In one terminal run `node --env-file=.env.local --watch server/src/index.js`. In another run `npm run dev:client`. Open the URL Vite prints and create an account using an allowlisted local email.

The npm server scripts expect environment variables to be supplied externally; they do **not** automatically load `.env`. Vite proxies `/api` to port 3000. The first registered account matching `MENTOR_EMAIL` receives the mentor role; role is stored in the user record.

## Verify changes

```sh
npm test
npm run lint --workspace client
npm run build
git diff --check
```

The client builds into `client/dist`; Express serves it when `NODE_ENV=production`. Docker Compose uses its own persistent SQLite volume. Do not deploy or modify production resources without explicit approval. See the [handoff](docs/HANDOFF.md#verification-and-release-checklist) before any release.

## Repository map

| Area | Responsibility |
| --- | --- |
| `client/src/Studio.jsx` | Authenticated shell, hash routes, shared program/progress loading |
| `client/src/LearningPages.jsx` | Today, roadmap, resources and glossary |
| `client/src/ConceptView.jsx` | Learner prediction, explanation, task and completion |
| `client/src/Curriculum.jsx` | Read-only, ungated mentor curriculum inspection |
| `client/src/Project.jsx`, `Mentor.jsx` | Weekly submission, feedback and review workflows |
| `content/program.json` | Active four-week curriculum, references and glossary |
| `server/src/routes/journey.js` | Expanded project-review API |
| `server/src/db.js`, `progress.js` | SQLite schema and progress persistence |
| `server/src/auth/` | Allowlist, password hashing and signed-cookie authentication |

Screenshots and the original supplied PDF were kept under gitignored `.context/` during development. They are not required to run or continue the project. The committed documents above are the durable handoff.
