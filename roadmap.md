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
- [x] **Decide** the ORM for PostgreSQL: TypeORM, selected 2026-10-25 (see decision record below). (PostgreSQL is already the intended database.)
- [x] **Decide** the authentication method: server-side sessions in a secure cookie for logged-in users; guests browse anonymously (selected 2026-10-25; see decision record below).
- [x] **Confirm** Socket.IO for rooms and chat, as named in `backend/AGENTS.md` (confirmed 2026-10-25; see decision record below).
- [x] **Confirm** friends/following is wanted; schedule relationship and presence work in Phase 9 (confirmed 2026-10-25; see decision record below).
- [x] **Decide** where the app will be hosted: Vercel Hobby for personal, non-commercial use (selected 2026-10-25; see decision record below).
- [x] Provision a disposable local database for development and tests (PostgreSQL 18 database `moviestreamer_dev`, created 2026-10-25; see decision record below).
- [x] Define how environment variables and secrets are stored (selected 2026-10-25; see decision record below).

### Video-source decision — research recorded 2026-10-25

- Phase 0 and this decision slice were approved. Only this slice is authorized for execution; subsequent slices still need proposals and approval.
- Required audience: public. Requested coverage: recent movies and TV series, initially with no ads and preferably good quality. The user would accept cam recordings for recent movies and subsequently chose to retain the existing providers for now despite minimal ads and some nonworking TV episodes. These reliability observations are user-reported, not independently verified. The user confirms they do not have a content license.
- Current implementation: `client/src/pages/Watch/WatchPage.jsx` embeds `vsembed.ru` for movies and TV episodes. Permission to publicly stream or synchronize those titles has not been established. No playback code was changed by this decision slice.
- Researched alternative: Blender open films. [Big Buck Bunny's official license statement](https://peach.blender.org/about/) permits reuse and distribution under CC BY 3.0 and requires retaining the entire ending credits for full-film screenings. The [CC BY 3.0 legal code](https://creativecommons.org/licenses/by/3.0/legalcode) grants reproduction, distribution, and public-performance rights subject to its conditions, including attribution, license notices, and no additional restrictions. This provides a basis for public viewing and, by inference, synchronized viewing of the unchanged film; watch-party playback has not been tested.
- Blender's [film catalog](https://studio.blender.org/films/) is an open-film alternative, not a source for arbitrary recent movies or TV series. It was not selected. Check each film's own license and attribution requirements before any future inclusion.
- An application-controlled player serving permitted media could omit advertising. Media hosting, bandwidth costs, resolution, browser compatibility, seeking, and synchronization remain unverified; free content licensing does not establish free hosting or unrestricted hotlinking.
- Research limitation: the official Big Buck Bunny license statement was available through indexed search results; direct retrieval of that page and the download directory failed. No media file was downloaded or inspected.
- **Provisional decision:** Retain the current providers and existing playback behavior for movies and TV series, as explicitly requested by the user. The active iframe source remains `vsembed.ru`; alternate provider URL declarations already present in the code are not evidence of automatic fallback. No replacement, new fallback, ad removal, or episode fix is authorized by this documentation decision.
- **Unresolved:** Public-streaming and synchronized-viewing permissions remain unconfirmed, and player control/synchronization capability has not been verified. Keep the combined source-and-permissions task unchecked: retaining a provider does not establish its permissions or reliability. Do not treat TMDB metadata availability as video availability.
- **Deferred hybrid idea:** The user wants to keep the current provider for now and has deferred a hybrid fallback for later consideration. A possible fallback is a manual “Find where to watch” link using TMDB's regional watch-provider data. This data supplies service availability and links, not another playable iframe, and cannot reliably detect failure inside the current cross-origin player. No implementation or roadmap phase change is approved for this idea.
- Permission to stream or synchronize from the retained provider remains unconfirmed; review it before any public release. This deferral does not establish authorization. Playback implementation, downloads, hosting setup, and other Phase 0 decisions remain outside this decision record.

### Hosting decision — 2026-10-25

- The hosting decision slice was approved. Use **Vercel Hobby** for the React frontend and NestJS backend while this remains a personal, non-commercial project. The user confirmed the project is personal and accepts the free-plan limitations.
- Deploy the frontend and backend as separate Vercel projects rooted at `client/` and `backend/`. Vercel documents zero-configuration NestJS deployment as a Function. No deployment configuration or application code was added in this decision slice. See [Vercel's NestJS guide](https://vercel.com/kb/guide/ship-a-nestjs-app-on-vercel).
- Hobby usage is subject to plan quotas and the plan is limited to personal, non-commercial use. Function execution has duration limits; usage can be paused when free quotas are exceeded. See [Vercel Hobby plan limits](https://vercel.com/docs/plans/hobby).
- Socket.IO remains the selected realtime transport. On Vercel it must use WebSocket-only transport; clients need reconnect handling because connections may close when a function reaches its duration limit. Shared realtime state, including presence across function instances, will require durable external storage. See [Vercel WebSockets](https://vercel.com/docs/functions/websockets).
- This records the hosting choice only. Deployment, Vercel project setup, secrets, database provisioning, and realtime storage/configuration remain separate slices.

### Local database prerequisite — 2026-10-25

- Provisioned a dedicated, empty PostgreSQL database named `moviestreamer_dev` on the local PostgreSQL 18 server at `127.0.0.1:5432` for development and tests. Existing databases were left untouched.
- Verified the connection, database name, PostgreSQL version (18.6), and that the `public` schema contains no tables.
- The database is owned by the local `postgres` superuser. Do not use the superuser for application runtime; defining a restricted application role and storing its connection settings safely belongs to the approved database connection slice. No application code, configuration, credentials, schema, or migrations were added.

### Environment-variable and secret-storage decision — 2026-10-25

- Store local backend values in ignored `backend/.env`; the existing `backend/.env.example` may contain names and placeholders only. For local frontend development, use `.env.local` files, which the client ignore rules exclude. Never commit real values, credentials, or populated local environment files.
- Store deployment values in the matching Vercel project's environment-variable settings, scoped to the needed environment and project. Keep credentials and private keys in the backend project only. Limit project access to trusted maintainers.
- Frontend build-time variables are public. Vite exposes `VITE_`-prefixed values in the browser bundle, so use that prefix only for non-sensitive client configuration such as a public API origin. Never put API keys, database credentials, session secrets, or other private values in frontend variables.
- This is a storage-policy decision only. No env files, values, deployment settings, or application code were changed. See [Vite environment variables](https://vite.dev/guide/env-and-mode) and [Vercel environment variables](https://vercel.com/docs/environment-variables).

### PostgreSQL ORM decision — 2026-10-25

- The ORM decision slice was approved. The selected ORM is **TypeORM**.
- Rationale: Nest maintains `@nestjs/typeorm`, which supports repository injection and fits the backend's feature-module and data-only repository boundaries. TypeORM migrations provide explicit `up` and `down` methods and a command to revert the most recently applied migration, matching the roadmap's requirement for a migration with rollback. See [NestJS TypeORM integration](https://docs.nestjs.com/data/typeorm) and [TypeORM migrations](https://typeorm.io/migrations/).
- Prisma also has a documented NestJS recipe and customizable SQL migrations, while Drizzle provides SQL migration generation. TypeORM is preferred here because its Nest integration is maintained by Nest and its migration interface explicitly pairs forward and reverse operations. See [NestJS Prisma recipe](https://docs.nestjs.com/recipes/prisma) and [Drizzle migrations](https://orm.drizzle.team/docs/migrations).
- Tradeoff: TypeORM's entity/decorator and repository style is more framework-integrated and less schema-first than Prisma or Drizzle. Migrations still require careful authored `down` logic; automatic reversal is not guaranteed for every data transformation.
- TypeORM 1.1.1, `@nestjs/typeorm` 12.0.2, and `pg` 8.23.1 were installed. The Phase 1 dependency slice is verified after the approved catalog fixture isolation fix; all 26 backend tests, build, lint, and formatting checks passed on 2026-10-25. Database connection and migration creation remain separate slices.

### Authentication-method decision — 2026-10-25

- The user chose **server-side cookie sessions** for logged-in browser users. Account registration and login do not require bearer tokens for this browser client. Public movie browsing remains anonymous; guests do not need an authentication cookie.
- The browser receives only an opaque session identifier in an `HttpOnly`, `Secure` (in production), `SameSite=Lax` or stricter cookie. Store session state server-side in a durable store; do not use Express's in-memory development store in production. Do not store credentials in browser local or session storage.
- PostgreSQL is the intended durable session store, but connection and session-store setup are separate approved slices. Do not implement account login until durable storage is ready.
- Cookie authentication requires CSRF protections for state-changing requests. Later auth slices must define origin checks, cookie attributes, session renewal and rotation, idle and absolute expiry, logout invalidation, and production HTTPS.
- Nest documents Express sessions; OWASP recommends opaque, server-side session management with secure cookie attributes. See [NestJS session guidance](https://docs.nestjs.com/techniques/session), [OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), and [OWASP CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
- This records the method only. No auth dependencies, session store, cookies, or endpoints were added.

### Realtime transport decision — 2026-10-25

- The Socket.IO confirmation slice was approved. Use **Socket.IO** for the planned room and chat gateways, with the matching `socket.io-client` package in React. NestJS documents Socket.IO as a supported gateway platform and maintains its Socket.IO adapter; the client and server major versions must be compatible. See [NestJS gateways](https://docs.nestjs.com/websockets/gateways), [NestJS Socket.IO adapter](https://docs.nestjs.com/websockets/adapter), and [Socket.IO client installation and compatibility](https://socket.io/docs/v4/client-installation/).
- This confirms the transport only. Installing packages, configuring authenticated connections with the selected cookie session, defining reconnect/event guarantees, implementing rooms/chat/presence, and determining scale-out requirements remain separate slices.
- No application code or dependencies changed in this decision slice.

### Friends and status visibility decision — 2026-10-25

- The friends-feature decision slice was approved. The product will support following relationships; two accounts are mutual followers when each follows the other.
- Active/online account status is visible only between mutual followers. Users who follow one another in only one direction cannot see each other's active status.
- Schedule the following relationship and its status-visibility rule in Phase 9, before implementing online presence. This is a future requirement only; no following or presence behavior is implemented now.

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
