# Frontend instructions

These instructions apply to `client/`, the existing frontend folder. Also follow the root `AGENTS.md`. Use the ReactJS architecture: **API -> hooks -> UI**.

## Feature workflow

Follow [FEATURE_WORKFLOW.md](../FEATURE_WORKFLOW.md) for planning, scope approval, implementation, verification, and reporting. Work one end-to-end slice at a time and obtain explicit approval of its scoped plan before implementation. Honor approval already given for an unchanged scope; request approval again when the scope, paths, dependencies, or prerequisites change.

## Stack and conventions

- The frontend uses React 19, Vite, React Router, JavaScript ES modules, and plain CSS.
- Keep JavaScript; do not introduce TypeScript, a UI framework, a state library, or a data-fetching library unless the task requires it.
- Use function components and React hooks. Match nearby formatting and avoid unrelated reformatting.
- Use PascalCase for components and page files, camelCase for variables and functions, and `use`-prefixed names for custom hooks.
- Keep page-specific components under that page's `components/` folder. Put reusable components in `client/src/components/` and colocate CSS with the component or page it styles.
- Use relative imports and the project's existing default component exports and named API exports.

## Architecture: API -> hooks -> UI

The data flow is API module -> custom hook -> page/component. UI events call hook actions, which call API functions. Keep responsibilities separate without adding unnecessary abstractions.

### API layer: `client/src/api/`

- Keep HTTP requests, endpoint URLs, request parameters, response extraction, and transport-specific behavior here. Separate API functions by feature: `movieAPI.js`, `seriesAPI.js`, `searchAPI.js`, `contentAPI.js`, and `animeAPI.js`.
- Popular movie lists use the backend `/api/catalog/movies/popular` endpoint through `movieAPI.js`; never restore direct TMDB calls for that flow. Keep shared legacy TMDB configuration in `tmdbConfig.js` for series, search, and detail features until their separate migrations. Put category-independent details and recommendations in `contentAPI.js`; keep series episode requests in `seriesAPI.js`. Do not recreate a catch-all API module or a `services/` directory.
- Prefer the existing Axios approach for new requests; preserve working fetch-based integrations unless changing them is part of the task.
- Export focused async functions with explicit arguments, such as `getEpisodesBySeason(id, season)`. Pass domain values rather than React events or browser pathname objects.
- API modules must not import React, render JSX, navigate, update React state, or display alerts in new or behaviorally refactored code.
- Return predictable data shapes and propagate actionable failures to hooks. An empty result and a failed request must remain distinguishable; do not silently turn failures into successful empty responses.
- Support request cancellation when needed. Read new configurable API values from Vite environment variables; never add private credentials to frontend source. Browser-exposed environment variables are public.

### Hooks layer: `client/src/hooks/`

- Create this directory when adding the first custom hook. Use `.js` for hooks without JSX, with names such as `useMovies.js`, `useContentDetails.js`, and `useFavorites.js`.
- Hooks call API functions and own loading, error, data, request lifecycle, and reusable feature behavior, including filtering, deduplication, and persistence when relevant.
- Accept explicit inputs such as an ID, category, or query. Return a small, named interface such as `{ content, loading, error, reload }` and feature actions as needed.
- Handle initial loading, input changes, failure, and empty results. Keep effect dependencies accurate and prevent stale requests from overwriting newer results or updating state after cleanup.
- Derive values from existing state where possible. Avoid redundant state, effects for pure calculations, and unnecessary memoization.
- Keep shared state in the existing context when multiple screens need it. Context providers should compose hooks and expose shared values/actions rather than duplicate request logic.
- Hooks must not return rendered UI. Keep display text, markup, styling, and page composition in the UI layer.

### UI layer: pages and components

- Pages compose feature hooks and components. Components render hook data or props and connect user actions to hook actions.
- Do not call API modules, Axios, or fetch directly from pages, components, or context providers in new or behaviorally refactored code. Import-path-only changes may preserve existing data flow.
- Keep temporary display state, such as an open menu or selected tab, local to the component unless it needs to be shared.
- Use React Router for route inputs and navigation. Pass the relevant ID/category/query into hooks; keep transport details out of route handling.
- Render loading, error, empty, and success states explicitly. Do not show an empty-results message while a request is pending.
- Use semantic elements, accessible labels, keyboard-operable controls, and stable item keys.

## Folder guide

```text
client/src/
  api/                      # HTTP and API response handling by feature
    tmdbConfig.js           # Shared TMDB configuration
    movieAPI.js             # Movie catalog
    seriesAPI.js            # Series catalog and episodes
    searchAPI.js            # Content search
    contentAPI.js           # Shared details, trailers, and recommendations
    animeAPI.js             # Anime integration
  hooks/                    # Feature logic and data lifecycle (add as needed)
    useContentDetails.js
  context/                  # Shared state, composed from hooks
  components/               # Reusable UI and colocated CSS
  pages/
    Description/
      DescriptionPage.jsx   # Hook consumption and page composition
      DescriptionPage.css
      components/           # UI used only by this page
  utils/                    # Pure helpers without React or HTTP dependencies
```

Dependency direction: UI/context may use hooks; hooks may use API modules and pure utilities. API modules and utilities must not depend on hooks or UI.

## Working on existing code

- Some existing components and context providers fetch data directly. Treat those as legacy patterns, not examples for new architecture.
- When changing a feature's data flow, move the relevant logic into a focused hook and preserve its observable behavior. Do not migrate unrelated features just to enforce this document.
- Preserve existing routes, API behavior, favorites storage compatibility, and responsive styles unless the requested change includes them.
- Keep changes focused and reuse existing components and helpers before introducing new ones.

## Verification

- Run commands from `client/`: `npm run lint` and `npm run build` for application code changes.
- Report pre-existing failures separately from failures caused by the change. Do not weaken lint rules to hide problems.
- Check affected screens and loading/error/empty states when changing UI or data flow. Include rapid input or route changes when request races are relevant.
- Run `npm test` for frontend API tests using Node's built-in runner. The optional `node --test test/catalog.browser-check.mjs` uses an existing Playwright installation selected by `MOVIE_PLAYWRIGHT_MODULE` and an installed browser selected by `MOVIE_BROWSER_EXECUTABLE`; do not install browser tooling without approval. Follow the test-first workflow for behavior changes.
- For documentation-only changes, verify paths and instructions against the repository; application builds are unnecessary.

## Catalog migration

- `useCatalog.js` owns loading, error, cancellation/stale-result protection, retry, and legacy series/search normalization. Context composes this hook and retains browser-local favorites; MovieList renders the returned state.
- Movie aggregation, ordering, deduplication, and eligibility filtering belong to the backend catalog service. Do not duplicate them in the movie UI. Legacy series/search keep their existing providers and filtering until approved separately.
- The Vite development proxy sends `/api` to `API_PROXY_TARGET` (default `http://127.0.0.1:5080`). Production hosting must route `/api` to the backend; a Vite proxy is not production infrastructure.
- Movie loading has moved server-side, but other frontend features still use the existing public browser credential. Do not claim complete credential removal until those features migrate.
