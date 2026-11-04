# Popular movie catalog migration verification

Verified on 2026-10-24. This slice adds `GET /api/catalog/movies/popular` and wires the existing Home/Movies UI through a custom hook and the Vite API proxy.

## Automated checks

- Backend tests: 26 passed, including six catalog tests. The six catalog tests first failed with missing endpoint responses, then passed after implementation. See [initial failures](../catalog-red.txt) and [passing tests](../catalog-green.txt).
- Frontend API tests: five initially failed against direct-provider behavior, then all five passed. See [initial failures](../catalog-client-red.txt) and [passing tests](../catalog-client-green.txt).
- Backend and frontend production builds passed. Backend lint and formatting passed.
- Frontend lint still reports pre-existing issues: 12 errors and 5 warnings, compared with 13 errors and 7 warnings before this slice. No new lint diagnostics were introduced. Existing failures in App, NavBar, SearchBar, FavoritesPage, TvSeriesPage, WatchPage and related-content effects were not repaired.

Backend tests execute the real controller, service, and provider client. Only the external HTTP transport is redirected to a local fixture server. The fixture independently expects IDs `[550, 603, 680, 13]`, first duplicate position with the last duplicate value, exactly pages 1 through 5, and rejection of incomplete entries. Empty, malformed, upstream-failure, missing-credential, and simulated-timeout cases remain distinct; failures never return partial lists. Timeout mapping is automated evidence, not a live provider outage test.

## Browser checks

See [browser output](../catalog-browser.txt), [structured results](browser.json), and [Home screenshot](home.png).

Live-provider checks passed:

- Home rendered 97 eligible movies through Vite -> NestJS -> live TMDB; the browser made zero direct TMDB API calls during movie catalog loading.
- Movies also loaded through the backend.
- Favorites toggling and navigation remained functional.
- The existing browser-to-TMDB series and movie-search flows remained functional.

Separate controlled-network checks passed:

- Loading stays visible until completion, without a premature empty state.
- A backend failure is distinct from an empty result; retry recovers.
- An empty backend result renders an empty state.
- A delayed movie response cannot replace series results after navigation.
- A delayed old search cannot replace the newer search result.

The browser test starts isolated backend/Vite processes on ephemeral loopback ports, closes the browser, and awaits termination of both server processes in its finally block. No persistent dev servers are left by the suite.

## Existing issue retained

Favorites can be cleared on page refresh by the original storage effects under React StrictMode. The browser check retains the failing assertion as an explicit TODO. It additionally verifies that those storage effects are byte-equivalent to the original tracked source after newline normalization. This behavior was not introduced or fixed by the catalog migration. The browser result is one passing main test and one pre-existing TODO, not a completely clean regression suite.

## Contract and limits

- Endpoint is anonymous. No database, schema, authentication, or migration was added.
- Backend reads the existing verified credential from ignored local `.env`; the credential is not included in responses or evidence. Other client features still contain their legacy public credential references.
- Each provider page has a ten-second timeout; five pages are requested sequentially. There is no cache or background refresh in this slice.
- Series, search, details, recommendations, playback rules, accounts, and persistence have not migrated. Existing roadmap content was preserved.
- CSS files were not changed. Production hosting still needs an approved reverse-proxy deployment that routes `/api` to NestJS; the Vite proxy is development-only.

## Reproduce

From `backend/`: `npm run build`, `npm run lint`, `npm run format:check`, and `npm test`.

From `client/`: `npm run build`, `npm run lint` (known failures above), and `npm test`.

For the browser suite, set `MOVIE_PLAYWRIGHT_MODULE` to an already-installed Playwright package and `MOVIE_BROWSER_EXECUTABLE` to an installed Chromium/Edge executable, then run `node --test test/catalog.browser-check.mjs` from `client/`. It requires a working `TMDB_API_KEY` in the ignored backend environment for live-provider checks. It does not download browser tools.

Manual check: start NestJS with `npm start` from `backend/` and Vite with `npm run dev` from `client/`. Open Home and Movies, inspect `/api/catalog/movies/popular` in the browser network panel, and confirm movie cards render. Verify Series, Search, and favorites navigation. Stop both servers afterward.
