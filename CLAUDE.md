# CLAUDE.md: learning-app

## Purpose

This repository is a web app for a structured fresher learning program in AI-assisted software development. It delivers the curriculum, predict-learn-prove exercises, weekly checkpoints, a question log, and a mentor dashboard.

The learning design matters as much as the code. Lessons are short and hands-on. Every concept starts with a prediction and ends with a task.

## Stack

- Frontend: React with Vite, in `client/`
- Backend: Node.js with Express, in `server/`
- Database: SQLite via `better-sqlite3`, stored in a Docker volume
- Auth: Google Identity Services on the client. The server verifies the ID token with `google-auth-library` and sets a signed, httpOnly session cookie.
- Content: lesson and checkpoint data in `content/`
- Deployment: Docker on a DigitalOcean droplet, deployed with `doctl`

## Commands

- Install: `npm install` (run at the repo root; this is an npm workspaces project covering `client` and `server`)
- Dev server: `npm run dev:server` and `npm run dev:client` (run both, in separate terminals; Vite proxies `/api` to the server on port 3000)
- Tests: `npm test` (both workspaces), or `npm run test:client` / `npm run test:server`
- Build: `npm run build` (builds the client; the server serves `client/dist` when `NODE_ENV=production`)
- Docker build and run: `docker compose up --build`

Use the Node version in `.nvmrc` (current LTS). Run `nvm use` before the above commands if your shell doesn't pick it up automatically.

## Conventions

- Keep changes small, and explain each change in the commit message.
- Add or update a test with each behaviour change.
- Do not add a dependency without saying why it is needed.
- Keep lesson text short. Prefer a hands-on task over a long explanation.
- Curriculum changes go in `content/`, not hard-coded in components.

## Security rules (never break these)

- Never disable or bypass the email allowlist, including for testing. Test with a dedicated test user instead.
- Never trust client-supplied identity. Verify the Google token on the server for every protected route.
- Never commit secrets, including `.env` files, tokens, client secrets, or session keys. Use `.env.example` for variable names only.
- Never log tokens, emails, or progress data at a level that would leak them.
- Do not deploy, change firewall rules, or modify DigitalOcean resources without explicit approval from the user in this session.
- Do not run destructive commands against the production database or its backups.

## Learning-program rules

- Each concept in `content/` has a prediction prompt, a short lesson, and a prove task.
- Tasks marked "no AI" must not include AI-generated solutions in the repo.
- Predictions are stored as the intern wrote them. Do not edit them.
- Mentor-only fields (for example, the wrong-prediction flag) must never appear in the intern-facing views.

## Working style

- Plan before editing more than one file. Show the plan and wait for approval.
- Explain what each change does in plain language, in case the reader is new to the stack.
- If a requirement is unclear, ask one focused question rather than guessing.
