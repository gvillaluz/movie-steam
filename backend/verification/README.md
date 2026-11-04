# NestJS foundation verification

Verified on 2026-10-24 with Node.js 26.12.0 and npm 11.20.0. Run backend commands from `backend/`.

| Command/check | Observed result | Evidence |
| --- | --- | --- |
| `npm test` before implementing the foundation | 20 tests: 18 failed, 2 passed; missing health, validation, configuration handling, and error contracts | [Initial failures](test-red.txt) |
| `npm test` after implementation | 20 passed, 0 failed | [Passing tests](test-green.txt) |
| `npm run build` | Exit 0 | [Build](build.txt) |
| `npm run lint` | Exit 0 | [Lint](lint.txt) |
| `npm run format:check` | Exit 0; formatting matches | [Formatting](format.txt) |
| Real HTTP against `npm start` in production mode | 5 expected status/body checks passed on an OS-assigned loopback port | [HTTP responses](http.json) |
| Frontend source comparison and output/server isolation | All frontend source hashes unchanged; no test files in production output; server port closed | [Isolation](isolation.json) |

HTTP expectations were defined before requests: health 200 with exactly `{"status":"ok"}`; unknown path, unsupported POST, and two test-only fixture endpoints 404 with Problem Details. The unknown-path check also verifies that query values are omitted and X-Request-Id matches traceId. In-process tests separately cover unexpected exceptions, invalid DTOs, forbidden extra fields, and invalid startup configuration.

The verification server was stopped after the checks. Ctrl+C did not stop npm's child process on Windows; the exact node process command line was verified and PID 33648 was terminated. The isolation check confirmed the listening port was closed.

The earlier ASP.NET scaffold's evidence is retained under `aspnet-foundation/` for history only and does not validate NestJS. The new backend does not implement database access, accounts, streaming, provider migration, chat, rooms, or frontend integration; those checks do not apply to this foundation slice.
