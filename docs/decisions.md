# Decision records

Notes moved out of `roadmap.md`. Each section records a Phase 0 decision and its research.

## Video-source decision — research recorded 2026-10-25

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

## Hosting decision — 2026-10-25

- The hosting decision slice was approved. Use **Vercel Hobby** for the React frontend and NestJS backend while this remains a personal, non-commercial project. The user confirmed the project is personal and accepts the free-plan limitations.
- Deploy the frontend and backend as separate Vercel projects rooted at `client/` and `backend/`. Vercel documents zero-configuration NestJS deployment as a Function. No deployment configuration or application code was added in this decision slice. See [Vercel's NestJS guide](https://vercel.com/kb/guide/ship-a-nestjs-app-on-vercel).
- Hobby usage is subject to plan quotas and the plan is limited to personal, non-commercial use. Function execution has duration limits; usage can be paused when free quotas are exceeded. See [Vercel Hobby plan limits](https://vercel.com/docs/plans/hobby).
- Socket.IO remains the selected realtime transport. On Vercel it must use WebSocket-only transport; clients need reconnect handling because connections may close when a function reaches its duration limit. Shared realtime state, including presence across function instances, will require durable external storage. See [Vercel WebSockets](https://vercel.com/docs/functions/websockets).
- This records the hosting choice only. Deployment, Vercel project setup, secrets, database provisioning, and realtime storage/configuration remain separate slices.

## Local database prerequisite — 2026-10-25

- Provisioned a dedicated, empty PostgreSQL database named `moviestreamer_dev` on the local PostgreSQL 18 server at `127.0.0.1:5432` for development and tests. Existing databases were left untouched.
- Verified the connection, database name, PostgreSQL version (18.6), and that the `public` schema contains no tables.
- The database is owned by the local `postgres` superuser. Do not use the superuser for application runtime; defining a restricted application role and storing its connection settings safely belongs to the approved database connection slice. No application code, configuration, credentials, schema, or migrations were added.

## Environment-variable and secret-storage decision — 2026-10-25

- Store local backend values in ignored `backend/.env`; the existing `backend/.env.example` may contain names and placeholders only. For local frontend development, use `.env.local` files, which the client ignore rules exclude. Never commit real values, credentials, or populated local environment files.
- Store deployment values in the matching Vercel project's environment-variable settings, scoped to the needed environment and project. Keep credentials and private keys in the backend project only. Limit project access to trusted maintainers.
- Frontend build-time variables are public. Vite exposes `VITE_`-prefixed values in the browser bundle, so use that prefix only for non-sensitive client configuration such as a public API origin. Never put API keys, database credentials, session secrets, or other private values in frontend variables.
- This is a storage-policy decision only. No env files, values, deployment settings, or application code were changed. See [Vite environment variables](https://vite.dev/guide/env-and-mode) and [Vercel environment variables](https://vercel.com/docs/environment-variables).

## PostgreSQL ORM decision — 2026-10-25

- The ORM decision slice was approved. The selected ORM is **TypeORM**.
- Rationale: Nest maintains `@nestjs/typeorm`, which supports repository injection and fits the backend's feature-module and data-only repository boundaries. TypeORM migrations provide explicit `up` and `down` methods and a command to revert the most recently applied migration, matching the roadmap's requirement for a migration with rollback. See [NestJS TypeORM integration](https://docs.nestjs.com/data/typeorm) and [TypeORM migrations](https://typeorm.io/migrations/).
- Prisma also has a documented NestJS recipe and customizable SQL migrations, while Drizzle provides SQL migration generation. TypeORM is preferred here because its Nest integration is maintained by Nest and its migration interface explicitly pairs forward and reverse operations. See [NestJS Prisma recipe](https://docs.nestjs.com/recipes/prisma) and [Drizzle migrations](https://orm.drizzle.team/docs/migrations).
- Tradeoff: TypeORM's entity/decorator and repository style is more framework-integrated and less schema-first than Prisma or Drizzle. Migrations still require careful authored `down` logic; automatic reversal is not guaranteed for every data transformation.
- TypeORM 1.1.1, `@nestjs/typeorm` 12.0.2, and `pg` 8.23.1 were installed. The Phase 1 dependency slice is verified after the approved catalog fixture isolation fix; all 26 backend tests, build, lint, and formatting checks passed on 2026-10-25. Database connection and migration creation remain separate slices.

## Authentication-method decision — 2026-10-25

- The user chose **server-side cookie sessions** for logged-in browser users. Account registration and login do not require bearer tokens for this browser client. Public movie browsing remains anonymous; guests do not need an authentication cookie.
- The browser receives only an opaque session identifier in an `HttpOnly`, `Secure` (in production), `SameSite=Lax` or stricter cookie. Store session state server-side in a durable store; do not use Express's in-memory development store in production. Do not store credentials in browser local or session storage.
- PostgreSQL is the intended durable session store, but connection and session-store setup are separate approved slices. Do not implement account login until durable storage is ready.
- Cookie authentication requires CSRF protections for state-changing requests. Later auth slices must define origin checks, cookie attributes, session renewal and rotation, idle and absolute expiry, logout invalidation, and production HTTPS.
- Nest documents Express sessions; OWASP recommends opaque, server-side session management with secure cookie attributes. See [NestJS session guidance](https://docs.nestjs.com/techniques/session), [OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), and [OWASP CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
- This records the method only. No auth dependencies, session store, cookies, or endpoints were added.

## Realtime transport decision — 2026-10-25

- The Socket.IO confirmation slice was approved. Use **Socket.IO** for the planned room and chat gateways, with the matching `socket.io-client` package in React. NestJS documents Socket.IO as a supported gateway platform and maintains its Socket.IO adapter; the client and server major versions must be compatible. See [NestJS gateways](https://docs.nestjs.com/websockets/gateways), [NestJS Socket.IO adapter](https://docs.nestjs.com/websockets/adapter), and [Socket.IO client installation and compatibility](https://socket.io/docs/v4/client-installation/).
- This confirms the transport only. Installing packages, configuring authenticated connections with the selected cookie session, defining reconnect/event guarantees, implementing rooms/chat/presence, and determining scale-out requirements remain separate slices.
- No application code or dependencies changed in this decision slice.

## Friends and status visibility decision — 2026-10-25

- The friends-feature decision slice was approved. The product will support following relationships; two accounts are mutual followers when each follows the other.
- Active/online account status is visible only between mutual followers. Users who follow one another in only one direction cannot see each other's active status.
- Schedule the following relationship and its status-visibility rule in Phase 9, before implementing online presence. This is a future requirement only; no following or presence behavior is implemented now.
