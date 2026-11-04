# Feature workflow

Work one slice at a time. A slice is the smallest change that works end to end. If a feature is large, split it into slices and finish one before starting the next.

Use this workflow together with the root `AGENTS.md` and each affected application's `AGENTS.md`. This repository is `movieStreamer`: the React frontend is in `client/`, and the feature-based NestJS backend is in `backend/`. Follow `client/AGENTS.md` for API -> hooks -> UI and `backend/AGENTS.md` for Controller -> smart Service -> data-only Repository.

## 1. Plan

- Re-read this file, `AGENTS.md`, all applicable workspace and repository instructions, and `roadmap.md` if one exists when beginning each task or resuming in a new session.
- Inspect actual execution paths, tests, documentation, and existing working-tree changes. Distinguish known behavior from assumptions and missing evidence.
- Name the affected application areas and repositories. Identify whether `client/`, `backend/`, or both are affected. Do not assume a mobile application or additional repository is included.
- State whether the API contract changes. If a separately maintained backend contract must change, identify its repository and prerequisites; the backend goes first after approval.
- List the style files that will change for UI work.
- If a roadmap defines a current phase and the feature falls outside it, stop and ask. If there is no roadmap or phase, state that; do not invent one.
- Give a short plan covering the user story, scope, files, approach, acceptance criteria, independently derived expected outcomes, API contract changes, schema prerequisites where relevant, risks, verification commands, and open questions.
- Report missing or unconfirmed prerequisites first. If the roadmap has a Phase 0, treat each Phase 0 task as its own plan-approve-execute cycle. Propose one small prerequisite task; do not provision an entire environment or silently resolve every prerequisite.
- Wait for explicit approval of the final scoped plan before coding, as defined by the gate below.

## 2. Cut scope

- Check that the slice is small enough to finish and test in one go. If not, split it and propose the first slice for approval.
- State exclusions and deferred work explicitly. Include required consumers and relevant failure and authorization cases.
- Present the final reduced plan before the gate.

## 3. Gate

- The coordinating agent presents the final scope, allowed paths, acceptance criteria, expected results, contract changes, schema/deployment prerequisites, and exclusions.
- Include implementation order, selective subagent ownership when useful and authorized, automated checks, E2E steps, and blockers.
- Wait for explicit user approval before implementation. Approval covers this slice only. Do not ask again for unchanged approval already given in the conversation.
- Plan approval is a strict scope gate. Stop and request approval if a prerequisite, path, dependency, or change falls outside the approved plan.
- Missing prerequisites become separate small approved tasks. Do not claim readiness based on assumptions.

## 4. Build

### Backend, only when included in the approved slice

- Follow `backend/AGENTS.md`, its feature-module boundaries, and its configured verification commands; follow repository-specific instructions for any separately approved backend repository.
- Write a behavior test first and run it; observe the expected failure. Implement until it passes.
- Run the build and fix introduced errors and warnings.
- Document the API contract: route, request, response, and error cases.

### React client

- Change only the repositories and paths named in the approved plan.
- Build against the agreed contract using feature API modules in `client/src/api/`, custom hooks in `client/src/hooks/`, and UI in pages/components.
- For behavior changes, write a test first and observe the expected failure, then implement until it passes. Use the configured Node test runners. Ask before adding another test framework or environment. Do not claim test-first evidence when no test ran.
- Handle loading, empty, and error states.
- Preserve existing architectures, naming, routes, paging, security, styling, persistence, and secret-storage patterns where applicable. Follow the existing JavaScript and plain CSS conventions; do not introduce TypeScript or CSS Modules solely to follow this workflow.
- Keep writes within approved paths and preserve existing uncommitted work.
- Run targeted checks during implementation. Stop if an unapproved dependency, path, or prerequisite is required.

## 5. End-to-end verify

### Live story check

- Run the real client and any approved local backend against disposable local data, never a production database. The frontend currently integrates with external APIs; `backend/` has health and popular-movie catalog endpoints; other frontend provider integrations and persistence have not migrated. State which integrations can actually be verified.
- Start dev servers only for approved applications and stop servers started for the slice when done.
- Test one user story at a time. Write expected results before running it, then compare observed output to those expectations.
- When a database is required, use a disposable local database provisioned by the user. Never execute migrations or touch the real operational database.
- Verify persistence and refresh where applicable, plus relogin, role ownership, and an important failure path when the slice includes those behaviors. Mark inapplicable checks explicitly.
- Simulated network, authentication, database, or storage tests are automated evidence, not proof of live E2E behavior. Verify external delivery separately when email, push, or storage matters.
- If prerequisites are absent, report blocked checks and propose the smallest prerequisite task. Do not mark the feature complete while required evidence is missing.

### Repository checks and integration review

- Run the required builds, lint, and available tests for every repository touched, and read the output.
- Only then say the slice is done. If a check failed or could not run, say so.
- Record pre-existing failures separately from introduced failures. Do not silently weaken checks or fix unrelated failures.
- Use a reviewer selectively within the approved task. The coordinating agent checks the integrated result, fixes in-scope findings, and reruns affected checks.
- Require reviewable evidence appropriate to the task: actual command output, inspectable diffs or artifacts, and observed E2E results where applicable. An AI report alone is not verification. Completion requires the approved acceptance criteria and all required automated and E2E evidence.

## Report and stop

- Summarize changes per file and list manual steps the user should test.
- List unrelated bugs without fixing them.
- Include verification commands/results, limitations, remaining checks, and relevant API contract and schema prerequisites. Report implemented/unverified or blocked when required evidence is outstanding.
- If this completes a defined current phase, say so and propose a roadmap update.
- Stop. Do not start the next slice until approved.

## Test rules

- A test that has never failed is not sufficient regression evidence. Verify that the test detects the intended defect. If it still passes when that behavior is deliberately broken, strengthen or replace it; do not leave the deliberate break in the final code.
- Use captured or realistic data when possible. Sanitize captured local data before use; never copy sensitive real records into source, artifacts, or logs. Use realistic synthetic fixtures when safe captures are unavailable.
- Mock only at outer boundaries, such as external services; do not mock the code under test.
- Independently derive expected values rather than copying actual output into expectations.
- Do not weaken or delete a test just to make it pass.

## Existing verification commands

- From `client/`: `npm run lint`, then `npm run build`.
- For approved browser checks, start the client with `npm run dev` from `client/` and use the URL Vite reports.
- Frontend, from `client/`: `npm test` runs API tests with Node's built-in runner. The optional catalog browser checks require the already-installed browser tools described in `client/AGENTS.md`.
- Backend, from `backend/`: `npm run build`, `npm run lint`, `npm run format:check`, and `npm test`. See `backend/AGENTS.md` for installation and startup instructions.
- Frontend has no configured format command; match nearby formatting. Backend uses Prettier and its backend-specific configuration.
- Use existing installed dependencies. If restore/install or a missing SDK is required, report it and propose a small approved prerequisite task. Do not install packages automatically.
- Workflow/documentation-only changes use file/content validation; application builds and live E2E do not apply when application behavior is unchanged.

## Intended responsibilities

- React developer: approved client flows against the agreed API; API -> hooks -> UI, explicit data contracts, JavaScript, colocated CSS, existing persistence/paging patterns, and automated/build/browser evidence.
- Backend developer: approved `backend/` paths and tests; feature-based NestJS module boundaries; Controller/Gateway -> smart Service -> data-only Repository; validation, identity and ownership, contract/error cases, schema descriptions, and configured verification evidence.
- Code reviewer: read-only review of the approved plan, final diff, contracts, correctness, security/ownership, regressions, scope drift, and verification gaps. Return severity, location, observed behavior, and reproduction evidence; distinguish pre-existing issues.
- These are responsibilities, not installed custom-agent definitions or a requirement to delegate. Use subagents selectively only within approved work.
- The coordinating agent retains planning, scope approval, API contract coordination, integration verification, and the final report.
