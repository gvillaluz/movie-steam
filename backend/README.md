# MovieStreamer backend

Feature-based NestJS modular monolith using TypeScript, Node.js, and Express. One backend package, one running application. Architecture and coding rules live in [AGENTS.md](AGENTS.md); approval gates live in the [feature workflow](../FEATURE_WORKFLOW.md).

## Implemented foundation

- `HealthModule` exposes anonymous `GET /api/health` returning exactly `{"status":"ok"}`.
- Global DTO validation transforms DTO instances, rejects undeclared properties, and does not implicitly coerce scalar values.
- Global HTTP error handling returns Problem Details with a generated trace ID. Unexpected exception messages and stacks are not returned to clients.
- Environment configuration is loaded through Nest ConfigModule and validated on startup.
- Tests use Nest testing utilities, Supertest, and Node's built-in test runner. Test-only routes are excluded from the production build.

Popular movie catalog requests are wired from React to NestJS. Accounts, friends, series/search/details migration, database persistence, video delivery, chat, and watch rooms are not implemented yet. Those frontend flows still use their legacy integrations.

## Structure

```text
backend/
  package.json
  src/
    main.ts
    app.module.ts
    app.setup.ts
    config/
      environment.ts
    common/
      filters/
        http-exception.filter.ts
    modules/
      health/
        health.module.ts
        health.controller.ts
      catalog/
        catalog.module.ts
        catalog.controller.ts
        catalog.service.ts
        providers/
        dto/
  test/
    environment.test.ts
    foundation.test.ts
    fixtures/
  verification/
```

Future features will each own their controller/gateway, services, DTOs, entities, repositories, and relevant tests under `src/modules/<feature>/`. Add `src/database/` for connection setup/migrations when persistence is approved. Do not recreate global layer folders or generate unused feature scaffolds.

## Request flow

```text
HTTP -> middleware -> guards -> interceptors (before) -> validation pipes
     -> controller -> smart service -> data-only repository -> database
     -> interceptors (after) -> response
Uncaught exception -> exception filter
```

External API calls use a feature-owned provider client instead of a database repository. The constant health response has no business logic and needs no service/repository.

For future real-time features, a thin gateway will call the same business services as controllers. Authenticate connections, authorize individual messages, validate payloads, persist durable messages, and emit only to authorized recipients. Socket.IO will require its matching frontend client; no gateway packages are installed yet.

Nest module exports define the public API between features. Cross-feature consumers import modules and use exported services, never internal repositories. Keep generic transport helpers in `common/` and business behavior within the owning feature.

## Local setup

The package supports Node.js 24 through 26; the foundation is verified on the installed Node.js 26.12.0. Use an LTS runtime for deployment. No database or API credentials are needed for health.

From `backend/`, after the dependency installation has been approved:

```powershell
npm ci
npm run build
npm start
```

Default URL: `http://127.0.0.1:5080/api/health`. Stop with Ctrl+C. For development watch mode, run `npm run start:dev` instead.

The dependency versions are pinned in `package.json` and `package-lock.json`. Build/test/lint/format scripts use local tools; no global Nest CLI is required.

## Configuration

Copy `.env.example` to `.env` if desired. ConfigModule loads `.env` relative to the backend working directory; shell environment variables override it. Real environment files are ignored by Git.

| Setting    | Default       | Validation                                              |
| ---------- | ------------- | ------------------------------------------------------- |
| `HOST`     | `127.0.0.1`   | Non-empty hostname/IP                                   |
| `PORT`     | `5080`        | Integer 0 through 65535; 0 requests an OS-assigned port |
| `NODE_ENV` | `development` | `development`, `test`, or `production`                  |

A PowerShell port override applies to that shell:

```powershell
$env:PORT = '5081'
npm start
```

Invalid settings fail startup. Local development uses HTTP and a loopback host. Authentication, database provisioning, public hosting, TLS, frontend CORS, and deployment require separately approved work. Never place backend credentials in frontend environment variables.

## HTTP contract

| Request                              | Response                                           |
| ------------------------------------ | -------------------------------------------------- |
| `GET /api/health`                    | `200`, `application/json`, `{"status":"ok"}`       |
| Unknown route                        | `404`, `application/problem+json`                  |
| `POST /api/health`                   | `404`, following Nest's normal routing behavior    |
| Invalid DTO on a route accepting one | `400`, Problem Details with safe `errors` messages |
| Unexpected exception                 | `500`, generic Problem Details                     |

Health checks process liveness only, not database/provider/media readiness. The normal application has no write endpoints yet; validation probe routes exist only in tests.

Error bodies contain `type`, `title`, `status`, `instance`, and `traceId`. The instance retains the original request path without query values. The generated trace ID is also returned in `X-Request-Id`. Unexpected errors use `An unexpected error occurred.` and omit `detail`/stack fields. Server logs retain diagnostic exceptions; protect access to them.

The former ASP.NET scaffold returned `405` for unsupported methods; Nest now returns `404`. No existing frontend consumer calls the health endpoint, and no frontend contracts were migrated in this slice.

## Verification

From `backend/`:

```powershell
npm run build
npm run lint
npm run format:check
npm test
```

`npm run format` deliberately applies formatting. `npm test` compiles production and test sources into `.test-dist/` and uses Node's test runner. `npm run build` emits only production sources to `dist/`.

Manual smoke check, after starting the backend:

```powershell
Invoke-RestMethod http://127.0.0.1:5080/api/health
curl.exe -i http://127.0.0.1:5080/api/does-not-exist
curl.exe -i -X POST http://127.0.0.1:5080/api/health
curl.exe -i http://127.0.0.1:5080/api/test-probe/exception
```

Expect `status: ok`, then three `404` Problem Details responses. The last check confirms the test fixture is not registered in the normal application. Stop the server after checking.

See [verification evidence](verification/README.md) for captured commands and observed results. Earlier .NET evidence is archived under `verification/aspnet-foundation/` and is not evidence for NestJS.

## Popular movie catalog migration

`GET /api/catalog/movies/popular` returns `{ items: [...] }`. CatalogController delegates to CatalogService, which aggregates TMDB popular-movie pages 1 through 5, deduplicates by ID (first position, last duplicate value), and excludes entries missing a positive integer ID, title, poster, or release date. Existing movie-card fields retain their snake_case names. Optional overview, rating, original title/language, and backdrop fields are explicitly mapped.

Set `TMDB_API_KEY` in ignored `backend/.env` or the backend process environment. It is not required for health. The provider origin is fixed, with a ten-second timeout per sequential page. Provider failures never produce partial success: missing configuration returns 503, timeout 504, and network/provider/invalid-response failures 502. A genuinely empty catalog returns 200 with an empty `items` array.

Start the backend and, in a second terminal, run `npm run dev` from `client/`. Vite forwards `/api` to `http://127.0.0.1:5080` by default. Set `API_PROXY_TARGET` for a different backend address. Production hosting must explicitly route `/api`; the development proxy does not configure deployment.

The browser calls only NestJS for popular movie lists; TMDB API requests for series, search, and details remain in the browser until their migrations. This slice does not remove every frontend credential reference. Favorites and saved episode selections remain browser-local.

Catalog tests exercise the real controller, service, and HTTP client against a local provider boundary. Browser evidence separates live TMDB checks from controlled network failures, empty results, and delayed responses. See [catalog verification](verification/catalog/README.md).
