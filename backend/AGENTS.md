# Backend instructions

These instructions apply to `backend/`. Also follow the root `AGENTS.md` and [feature workflow](../FEATURE_WORKFLOW.md).

## Stack and current scope

- Use NestJS, TypeScript, Node.js, and the Express HTTP adapter in one backend package and one deployable application.
- The backend is a feature-based modular monolith. Do not recreate the old Application/Domain/Infrastracture/Presentation trees or add per-feature packages, microservices, CQRS, or generic architectural frameworks without approval.
- HealthModule and CatalogModule are implemented, along with startup configuration, validation, and errors. Popular movies use Controller -> CatalogService -> TmdbClient. Series, search, details, persistence, accounts, streaming, chat, and rooms remain future slices.
- PostgreSQL is the intended database. Database/ORM setup and migrations need their own approved slice. Nest gateways with Socket.IO are intended for chat and rooms; those packages and features are not installed yet.
- The frontend remains JavaScript React in `client/`; backend TypeScript does not authorize a frontend conversion.

## Feature-based structure

```text
backend/
  src/
    main.ts                 # Process startup
    app.module.ts           # Composes feature modules
    app.setup.ts            # Shared HTTP setup for production and tests
    config/                 # Environment validation
    common/                 # Generic filters, pipes, decorators only
    modules/
      health/
        health.module.ts
        health.controller.ts
      catalog/              # Movie DTOs, service, controller, and TMDB client
  test/                     # Integration tests and test-only fixtures
```

Add auth, users, friends, catalog, playback, favorites, watch-history, rooms, and chat modules only when implementing them. Keep a feature's controller, service, repository, gateway, DTOs, entities, enums, and tests within that feature. Use subfolders such as `dto/` and `entities/` only as needed. Add `src/database/` for connection setup and migrations when persistence is approved; feature repositories stay in their own modules.

## Flow and responsibilities

**HTTP request -> Controller -> smart Service -> data-only Repository -> Database.**

- Middleware handles transport concerns such as correlation; guards handle authentication and coarse access; pipes validate/transform DTOs before controller handlers; interceptors wrap execution; exception filters translate uncaught errors.
- Controllers bind DTOs, obtain the authenticated principal, call services, and return transport responses. Do not access the ORM, repositories, or external providers directly.
- Services own business rules, resource-specific permissions, ownership, state transitions, orchestration, and transaction decisions. Do not pass Express request/response or socket objects into services.
- Repositories own bounded queries, paging, joins, projection, and persistence. No permissions, friendship rules, room policies, HTTP calls, or broadcasting here. Do not create a generic repository solely to wrap every ORM method.
- External data flow is Controller -> Service -> provider client. Keep provider clients inside their feature, use fixed/configured provider origins, and do not label HTTP clients as database repositories.
- Health is a constant liveness response and needs no service or repository. Do not add empty abstractions for consistency.
- Services should return explicit results/DTOs or feature errors; keep HTTP/socket exception translation at transport boundaries when services are shared by both.

**Socket event -> connection authentication/message guard -> DTO validation -> Gateway -> Service -> Repository -> authorized delivery.**

- Gateways are thin transport entry points and use the same business services as HTTP controllers.
- Authenticate connections before processing messages and authorize each message's action, room, and conversation. Socket room membership alone is not authorization.
- Derive identity from verified authentication, not payload user IDs. Validate host privileges for playback controls and membership/blocking rules for chat.
- Persist durable messages before acknowledging or broadcasting success. Repositories never emit socket events; delivery belongs in a dedicated provider or transport adapter.
- Socket.IO requires its matching client; it is not the raw browser WebSocket protocol. Reconnect, duplicates, ordering, and missed-message recovery must be specified when implementing real-time features.

## Module boundaries and dependency injection

- A module owns its data access and implementation details. Export only the services or tokens that other features actually need.
- Cross-feature calls use explicitly exported services through imported modules. Never reach into another module's repository, query its tables directly, or import unexported internals.
- Avoid circular imports and routine `forwardRef()` fixes. Move orchestration to an appropriate consuming feature or redesign the boundary.
- Keep `common/` free of business rules and feature dependencies. Configuration may be global; do not make all feature modules global.
- Inject concrete providers by constructor. Add interfaces/tokens only for a real external boundary or implementation choice; TypeScript interfaces disappear at runtime, so use explicit tokens or abstract classes when needed.
- Use Nest's container rather than manually constructing services. Avoid service locator patterns and excessive abstractions.

## TypeScript and API patterns

- Use strict TypeScript, kebab-case filenames, PascalCase types/classes, camelCase members, and Nest suffixes such as `.module.ts`, `.controller.ts`, `.service.ts`, `.repository.ts`, and `.gateway.ts`.
- Use decorated DTO classes for HTTP payload validation. Use type-only imports for actual types, but retain runtime class imports where Nest injection or validation metadata needs them.
- Apply the shared `configureApp()` to production and HTTP test applications. Global validation transforms DTO instances, rejects unknown fields, and disables implicit scalar conversion; add explicit parsers/conversions where required.
- Never accept ORM entities as public write payloads or return credential fields in responses. Use explicit DTOs.
- Use async/await for I/O, bounded calls, cancellation/timeouts where appropriate, and clear error outcomes. Avoid blocking CPU work on request handlers.
- Keep secrets in backend environment configuration. Commit only examples; never send provider credentials to the frontend or log passwords, tokens, connection strings, or private message bodies.
- Unexpected HTTP errors return generic Problem Details without exception messages/stacks. Validation errors return safe messages without input values. Use the generated trace ID for log correlation; do not trust arbitrary client correlation IDs.
- Each new feature defines its contracts, validation, failure cases, and authorization rules before changing frontend consumers.

## Verification commands

Run from `backend/`:

```powershell
npm run build
npm run lint
npm run format:check
npm test
```

- `npm test` compiles tests separately and uses Node's built-in test runner with Nest testing utilities and Supertest. No Jest installation is required. Test fixtures are excluded from production builds.
- Use `npm ci` for an approved locked dependency installation. Dependency/SDK/ORM changes still require an approved slice.
- `npm start` runs the built app. `npm run start:dev` uses the local Nest CLI watch mode. Default URL: `http://127.0.0.1:5080/api/health`.
- `npm run format` intentionally writes formatting; lint and format-check do not mutate files.
- Write meaningful tests, observe their intended failure, implement, then rerun relevant checks. Mock only external boundaries, not business logic under test.
- Keep test-only controllers out of AppModule and production output. Verify real HTTP separately from in-process integration tests; stop servers started for verification.
- Record pre-existing failures separately. Never weaken rules or fix unrelated bugs to make checks pass.
- Database checks require an approved user-provisioned disposable local database. Do not install/provision services, run migrations, or deploy outside the approved scope.

## Popular movie catalog

- `GET /api/catalog/movies/popular` is anonymous and returns `{ items: MovieDto[] }`. Fetch exactly five popular-movie provider pages, retain first position/last duplicate value by movie ID, and exclude entries lacking a valid ID, title, poster, or release date. A failed page fails the entire request; do not return partial success.
- `TMDB_API_KEY` is optional for health but required for catalog calls. Missing configuration returns 503, upstream/network/invalid-response failures 502, and provider timeouts 504, using Problem Details without provider payloads or credentials.
- TmdbClient uses the fixed TMDB origin and a ten-second timeout per sequential request. Never accept caller-supplied provider URLs. TMDB_FETCH is the external HTTP boundary token for tests; controllers/services remain real.
- Do not log raw fetch errors or provider URLs containing credentials. Tests use a local provider fixture and synthetic credentials; live browser checks use ignored backend-local configuration.
