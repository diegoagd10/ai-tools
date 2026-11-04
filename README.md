<img src="assets/icon.svg" width="64" height="64" alt="">

# ai-tools

Full-stack starter with a login module, extracted from
[open-calorie-tracker](https://github.com/diegoagd10/open-calorie-tracker). It has the first-run
registration, login, logout and a guarded endpoint, and nothing else: add features on top.

## Stack

- `apps/web` — Next.js (App Router, TypeScript, Tailwind)
- `apps/api` — NestJS + Drizzle ORM (SQLite)
- `packages/shared` — schemas (zod) and auth constants used by the web app, the API and the tests

## Login module

| Piece                               | Where                                                         |
| ----------------------------------- | ------------------------------------------------------------- |
| `POST /v1/login`, `/v1/register`    | `apps/api/src/auth/auth.controller.ts`                        |
| `GET /v1/setup`, `/v1/health`       | `apps/api/src/users`, `apps/api/src/health`                   |
| Guarded endpoint: `GET /v1/profile` | `AccessTokenGuard` and `UserId` in `apps/api/src/auth`        |
| Passwords                           | Argon2id, `apps/api/src/auth/password.ts`                     |
| Lockout                             | 5 failures per (IP, username) lock that pair for 15 minutes   |
| Session                             | HS256 JWT in an HTTP-only, `Secure`, `SameSite=Strict` cookie |
| Page guard                          | `apps/web/src/proxy.ts`                                       |

The app has a single account: until it exists every page leads to `/register`, and afterwards
registration is closed. For several users, remove the `hasAny` checks and the
`WHERE NOT EXISTS` in `UsersService.register`, and the `needsSetup` branch in `proxy.ts`.

The lockout counters live in the API's memory, so they reset on restart and only work with one API
instance.

## Development

```bash
pnpm install
pnpm --filter web exec playwright install chromium   # browser tests
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm --filter api db:seed     # creates the development user (SEED_USER_* in apps/api/.env)
pnpm dev:api                  # http://localhost:3001
pnpm dev:web                  # http://localhost:3000
pnpm --filter @ai-tools/shared dev   # only when editing packages/shared
```

## Code quality ([Vite+](https://viteplus.dev))

```bash
pnpm check      # format + lint + type check
pnpm check:fix  # same, auto-fixing format and lint issues
pnpm test       # vp test (Vitest)
pnpm test:cov   # tests with coverage; fails below 95% of statements
```

`pnpm check` needs the web app's route types once: `pnpm --filter web exec next typegen`.

The web tests run `next build`, and Next.js locks its build directory while `next dev` runs, so
stop `pnpm dev:web` before running them. They use real browsers against the real API, on ports
3100–3102 and 3200–3202; pick others with `WEB_TEST_BASE_PORT`:

```bash
WEB_TEST_BASE_PORT=4100 pnpm --filter web exec vp test run
```

## CI and repository rules

Every pull request to `main` runs these checks, and all of them must pass to merge:

| Check                     | Workflow     | What it does                                |
| ------------------------- | ------------ | ------------------------------------------- |
| `Vite+ check`             | `ci.yml`     | Format, lint and type check                 |
| `Unit tests and coverage` | `ci.yml`     | API and shared tests, 95% statement minimum |
| `Web tests`               | `ci.yml`     | Browser tests with Playwright               |
| `Docker images`           | `ci.yml`     | Builds both deployment images               |
| `analyze`                 | `codeql.yml` | CodeQL, also weekly                         |

Dependabot opens weekly updates for npm, Docker and GitHub Actions, plus security fixes as soon as
an advisory is published.

`scripts/protect-main.sh` applies the rules, which live in GitHub and not in the code: pull request
required, all five checks required on an up-to-date branch, no force pushes or deletions, and no
exception for admins. A repo created from this one has to run it once, and a renamed job has to be
updated there.

## Deployment

`docker-compose.yml` runs the API and the web app from the `Dockerfile` (targets `api` and `web`),
each published on the host's loopback for a tunnel or reverse proxy in front. It has to serve HTTPS:
the session cookie is `Secure`, so browsers drop it on plain HTTP other than localhost. The API runs
its migrations on startup and keeps its SQLite database in `DATA_PATH`. Put the variables in a
`.env` beside the compose file (`chmod 600`):

| Variable                         |                                                                    |
| -------------------------------- | ------------------------------------------------------------------ |
| `JWT_SECRET`                     | Required. Random, at least 32 characters (`openssl rand -hex 32`). |
| `DATA_PATH`                      | Required. Host folder for the database, writable by UID 1000.      |
| `WEB_HOST_PORT`, `API_HOST_PORT` | Host ports, 3010 and 3011 by default.                              |
| `WEB_BIND`, `API_BIND`           | Host addresses, `127.0.0.1` by default.                            |
| `TRUST_PROXY`                    | Express "trust proxy", `loopback, uniquelocal` by default.         |

```bash
docker compose up -d --build
docker compose ps   # both services healthy
```

A new database sends every visitor to `/register` until the first account exists, so register
before exposing the web app. Back up by stopping the stack and copying `DATA_PATH`.
