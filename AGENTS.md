# Project instructions

These instructions apply throughout `movieStreamer`. Read the applicable application instructions before changing files:

- [Frontend instructions](client/AGENTS.md): the frontend's architecture, conventions, and verification commands.
- [Backend instructions](backend/AGENTS.md): the backend's architecture, conventions, and verification commands.
- [Feature workflow](FEATURE_WORKFLOW.md): planning, scope approval, implementation, verification, and reporting.
- [Roadmap](roadmap.md): phases and tasks. It defines the current phase.

## Repository layout

- `client/` is the React frontend. Keep its name and existing folder conventions.
- `backend/` is the NestJS backend.
- Each application's `AGENTS.md` is the only source of truth for that application's architecture, layering, naming, folder structure, and verification commands. Do not restate or override them here, and do not apply one application's architecture to the other.
- If an application's `AGENTS.md` is missing, unclear, or conflicts with this file, stop and ask. Do not guess.
- Keep shared coordination rules in this file. Keep application-specific rules in the application's own `AGENTS.md`.

## Approval and proposals

Every slice and every roadmap phase needs a written proposal and explicit user approval before any file is changed.

- Propose before building. A proposal covers: goal, affected applications, allowed paths, approach, acceptance criteria, API contract changes, prerequisites, risks, exclusions, verification steps, and open questions.
- Wait for explicit approval. Silence, or approval of a different slice, is not approval.
- Approval covers only the slice or phase proposed. Starting the next slice or the next phase needs a new proposal and new approval.
- A phase proposal is a short outline of its slices. It does not replace the proposal for each slice inside it.
- If scope, paths, dependencies, or prerequisites change while working, stop and ask again.
- Missing prerequisites become their own small proposal. Do not resolve them silently.
- After finishing, report and stop. Do not continue to the next slice on your own.

## Code rules

- Keep code simple. Choose the plainest solution that meets the acceptance criteria.
- Keep functions small and single-purpose. Each function does one task, and its name says what that task is. If a function needs "and" to describe it, split it.
- Avoid overengineering. Do not add abstractions, layers, generic helpers, config options, or extension points for needs that do not exist yet. Do not build for hypothetical future requirements.
- Avoid assumptions. Verify behavior by reading the code, running it, or asking. State what is known and what is unconfirmed. If something is unclear, ask instead of guessing.
- Do not add dependencies, SDKs, frameworks, database setup, or migrations outside an approved slice.
- Follow existing patterns in the surrounding code. Do not refactor, rename, or migrate unrelated code.
- Do not fix unrelated bugs or failures. List them in the report instead.

## Shared workflow

- Work one end-to-end slice at a time. A slice is the smallest change that works end to end.
- Name affected applications, allowed paths, API contract changes, acceptance criteria, prerequisites, exclusions, and verification steps in the proposal.
- Always create a git worktree for each approved slice and make all changes there, not in the main working tree. Create it only after approval, on a new branch named for the slice. Report its path and branch when finished.
- Inspect and preserve existing working-tree changes.
- Coordinate backend contracts before implementing affected frontend consumers. Define requests, responses, validation, authorization, and error cases.
- Read each application's `AGENTS.md` for its actual verification commands. Do not invent build or test commands for unconfigured projects, and do not claim verification that was not performed.
- Work only within the current phase in `roadmap.md`. If the request falls outside it, stop and ask.
- For documentation and empty-folder changes, validate paths, content, links, and diffs. Application builds and live E2E are unnecessary.