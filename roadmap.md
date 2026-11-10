# Roadmap

Product: `movieStreamer`, a movie streaming site with accounts, group watching rooms, and chat.

**Current phase:** Phase 1 (approved, in progress; video-source permission verification deferred to pre-release)

## How to use this roadmap

- Work in order. Do not start a phase until the previous one is done and the user approves the next.
- Each phase needs a short proposal and approval. Each task below is one slice and needs its own proposal and approval (see `AGENTS.md`).
- Tasks are deliberately small. If a task turns out larger than one slice, split it before proposing.
- Items marked **Decide** are open questions. Do not assume an answer; propose options and wait.
- Architecture comes from `client/AGENTS.md` and `backend/AGENTS.md`, not from this file.

## Current state (known)

- `client/` exists (JavaScript React) and integrates with external APIs.
- `backend/` (NestJS, Express, TypeScript) has these done: health endpoint, startup configuration, request validation, and error handling.
- `backend/` also has a popular-movies catalog endpoint (`GET /api/catalog/movies/popular`, TMDB provider). TypeORM, the Nest TypeORM integration, and the PostgreSQL driver are installed; database connection and schema work are not yet implemented.
- PostgreSQL 18 is provisioned locally as the empty `moviestreamer_dev` database. TypeORM packages are installed and dependency verification is complete. Socket.IO is selected for future room and chat gateways but is not installed yet.
- Not started: persistence, accounts, series, search, details, playback, favorites, watch history, friends, rooms, chat.
- `client/` has `npm test` (Node's built-in runner) for API tests and an optional Playwright browser check. `backend/` tests also use Node's built-in runner.
- `client/` still calls TMDB directly from the browser for series, search, and details (legacy). Favorites are stored in the browser only. An anime integration also exists.

---

## Phase 0: Prerequisites and decisions

Each task is its own plan-approve-execute cycle.

- [x] **Defer** confirming that the current video source is authorized for streaming and syncing until before any public release. The current source is retained provisionally; permission remains unconfirmed. (Movie metadata already comes from TMDB; video does not.)
- [x] **Decide** the ORM for PostgreSQL: TypeORM, selected 2026-10-25 (see docs/decisions.md). (PostgreSQL is already the intended database.)
- [x] **Decide** the authentication method: server-side sessions in a secure cookie for logged-in users; guests browse anonymously (selected 2026-10-25; see docs/decisions.md).
- [x] **Confirm** Socket.IO for rooms and chat, as named in `backend/AGENTS.md` (confirmed 2026-10-25; see docs/decisions.md).
- [x] **Confirm** friends/following is wanted; schedule relationship and presence work in Phase 9 (confirmed 2026-10-25; see docs/decisions.md).
- [x] **Decide** where the app will be hosted: Vercel Hobby for personal, non-commercial use (selected 2026-10-25; see docs/decisions.md).
- [x] Provision a disposable local database for development and tests (PostgreSQL 18 database `moviestreamer_dev`, created 2026-10-25; see docs/decisions.md).
- [x] Define how environment variables and secrets are stored (selected 2026-10-25; see docs/decisions.md).

Decision records and research notes live in [docs/decisions.md](docs/decisions.md).

## Phase 1: Backend foundation

Configuration, request validation, and error handling already exist. Do not redo them.

- [x] Install the approved ORM and PostgreSQL driver (TypeORM 1.1.1, `@nestjs/typeorm` 12.0.2, and `pg` 8.23.1 installed; dependency verification completed 2026-10-25 after isolating catalog fixtures from environment credentials).
- [ ] Connect the backend to the disposable local database.
- [ ] Add a first migration with a rollback.
- [ ] Add database settings to environment validation.
- [ ] Check that request logging exists and contains no sensitive data. Add only what is missing.

## Phase 2: Accounts and authentication (backend)

- [ ] Account schema (id, email, username, password hash, created time).
- [ ] Register endpoint with input validation.
- [ ] Password hashing with a vetted algorithm.
- [ ] Login endpoint.
- [ ] Logout endpoint.
- [ ] Authentication guard that identifies the current user.
- [ ] "Get current user" endpoint.
- [ ] Token or session expiry and renewal.
- [ ] Change password endpoint.
- [ ] Delete account endpoint.

## Phase 3: Security baseline (backend)

- [ ] Rate limiting on login and register.
- [ ] Lockout or slow-down after repeated failed logins.
- [ ] Secure HTTP headers.
- [ ] CORS restricted to the frontend origin.
- [ ] Secure cookie or token storage settings.
- [ ] Ownership check helper: a user can only change their own data.
- [ ] Confirm no secrets or personal data appear in logs or error responses.
- [ ] Dependency vulnerability check.

## Phase 4: Authentication (frontend)

- [ ] Register page.
- [ ] Login page.
- [ ] Keep the user logged in across refresh.
- [ ] Logout action.
- [ ] Protected routes that redirect to login.
- [ ] Handle loading, empty, and error states on all auth screens.
- [ ] Handle expired sessions.

## Phase 5: Catalog, profile and personal lists

Catalog (extends the existing popular-movies feature). Each task moves one legacy browser-to-TMDB flow to the backend, one at a time, keeping the current behavior:

- [ ] Movie details: backend endpoint, then switch the client hook to it.
- [ ] Search: backend endpoint, then switch the client hook to it.
- [ ] Popular series: backend endpoint, then switch the client hook to it.
- [ ] Series details and episodes: backend endpoint, then switch the client hook to it.
- [ ] Remove the browser TMDB credential once no client feature uses it.

Profile and lists:

- [ ] Profile endpoint and page (view and edit username).
- [ ] Watchlist: add, remove, and list.
- [ ] Favorites: add, remove, and list on the account. Decide how existing browser-local favorites are kept or imported.
- [ ] Watch history: record and list.
- [ ] Frontend pages for each list.

## Phase 6: Rooms

- [ ] Room schema (id, name, host, privacy, invite code).
- [ ] Create room endpoint (host is the creator).
- [ ] Join room by invite code.
- [ ] Leave room.
- [ ] List the user's rooms.
- [ ] Room details endpoint, visible only to members.
- [ ] Host-only actions: rename room, close room.
- [ ] Frontend: create and join room.
- [ ] Frontend: room page shell showing members.

## Phase 7: Synchronized playback

- [ ] Install Socket.IO gateway packages on the backend and the matching client on the frontend (dependency slice only).
- [ ] Write down the rules for reconnect, duplicate events, ordering, and missed events before building playback sync.
- [ ] Set up the real-time connection with authentication (identity from verified auth, never from the payload).
- [ ] Only room members may connect to a room.
- [ ] Set the room's current movie (host only).
- [ ] Broadcast play and pause.
- [ ] Broadcast seek.
- [ ] Sync a late joiner to the current position.
- [ ] Reconnect handling after a dropped connection.
- [ ] Frontend: player controls wired to room events.
- [ ] Decide who may control playback (host only or everyone), then implement.

## Phase 8: Room chat

- [ ] Message schema.
- [ ] Send message in a room (members only, length-limited).
- [ ] Save each message before confirming or broadcasting it.
- [ ] Broadcast new messages to the room.
- [ ] Load recent chat history when joining.
- [ ] Per-user message rate limit.
- [ ] Frontend: chat panel with loading, empty, and error states.
- [ ] Escape message content to prevent script injection.

## Phase 9: Presence and member management

- [ ] Add mutual-follow relationships before presence; expose a user's active/online status only to mutual followers.
- [ ] Show who is online in the room.
- [ ] Join and leave notices.
- [ ] Host can remove a member.
- [ ] Host can transfer host role.
- [ ] Handle the host leaving (transfer or close).

## Phase 10: Safety and moderation

- [ ] Host can ban a member from a room.
- [ ] Report a message or user.
- [ ] Block a user.
- [ ] Private rooms require an invite code.
- [ ] Optional: basic content filter for chat.

## Phase 11: Quality and release

- [ ] Backend tests for each feature's main behavior and failure cases.
- [ ] Frontend tests for critical flows, using the existing `npm test` runner.
- [ ] Automated lint, build, and test checks in CI.
- [ ] End-to-end check of the full flow: register, login, create room, invite, sync play, chat.
- [ ] Production environment configuration and secret management.
- [ ] Database backup and restore check.
- [ ] Error monitoring.
- [ ] Deployment and rollback steps documented.
- [ ] Privacy policy and terms of service pages.

## Later (not scheduled)

- Email verification and password reset.
- Social login.
- Emoji reactions in rooms.
- Subtitles and multiple audio tracks.
- Room scheduling and notifications.
- Mobile layout polish.
