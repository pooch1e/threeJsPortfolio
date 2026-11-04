# Worker testing

Tests run **inside workerd** (Cloudflare's runtime) via `@cloudflare/vitest-plugin`, against a **real Postgres** in Docker. No mocks: the app gets real bindings (`env`) and a real `ExecutionContext`.

## Quick start (fresh clone)

Prerequisites: Node, and Docker with the `docker compose` plugin running.

```bash
cd worker
npm install
npm test
```

`npm test` runs `pretest` first (`npm run db:up`), which starts the database and waits until it is healthy. Nothing else is needed: no `.env`, no Cloudflare login. Run a single file with `npx vitest run __tests__/path/to/file.test.ts`; start the DB yourself first with `npm run db:up`.

## How it fits together

```
npm test
 ├─ pretest → docker compose up --wait          (db/docker-compose.yml)
 └─ vitest run
     ├─ vitest.config.ts
     │    ├─ sets CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE → threejs_test
     │    ├─ cloudflareTest({ wrangler: wrangler.toml })  → workerd + bindings
     │    └─ setupFiles: __tests__/setup/assertTestDb.ts   → aborts unless DB is threejs_test
     └─ each *.test.ts uses env.HYPERDRIVE.connectionString (already the test DB)
```

The key idea: `wrangler.toml` declares a `HYPERDRIVE` binding whose `localConnectionString` points at the **dev** DB. `vitest.config.ts` overrides that with an env var so every test entry point (`npm test`, `npx vitest`, one file, watch mode) gets the **test** DB. Tests never contain a connection string. The setup guard double-checks with `SELECT current_database()` and refuses to run otherwise, so a broken override can never touch dev data.

## The databases

One Postgres 16 container (`threejs-worker`, port **5433**) holds two databases:

| Database | Contents | Used by |
|---|---|---|
| `threejs_database` | schema + `guest` demo user | `wrangler dev` |
| `threejs_test` | schema only (empty) | tests |

Files in `worker/db/`:

| File | Purpose |
|---|---|
| `docker-compose.yml` | Container, port, healthcheck, volume mounts |
| `init/01-init.sh` | First-start script: creates `threejs_test`, applies the schema to both DBs, seeds dev only |
| `schema.sql` | `users` table + `updated_at` trigger (single source of truth for both DBs) |
| `seed.sql` | Dev-only guest account (`guest@demo.com`, password `Guest1234!`) |
| `seed.test.sql` | Opt-in dummy users for the test DB (admin, alice, bob, carol, nameless; password `Password123!`) |

**Init scripts only run when the volume is first created.** After editing `schema.sql` or `init/`, run `npm run db:reset` (wipes the volume, rebuilds both DBs).

## Scripts

| Script | What it does |
|---|---|
| `npm test` | Start DB, run all tests once |
| `npm run test:watch` | Watch mode (start the DB first) |
| `npm run db:up` / `db:down` | Start / stop the container (data kept) |
| `npm run db:reset` | Destroy the volume and rebuild both DBs |
| `npm run db:psql` | psql shell on the dev DB |
| `npm run db:seed:test` | Truncate `users` in `threejs_test` and load `seed.test.sql` |

## What must be true for tests to run

| Dependency | Why |
|---|---|
| Docker + compose plugin | Hosts Postgres |
| Port 5433 free | Container publishes it; the old Go `server/` compose also uses 5433, so don't run both |
| `vitest`, `@cloudflare/vitest-plugin`, `wrangler` | Test runner, workerd pool, and the `wrangler.toml` the plugin reads |
| `postgres` | Driver used by the app and by tests |
| `bcryptjs` | Imported by `lib/password.ts` |
| `wrangler.toml` | Must declare the `HYPERDRIVE` binding (with `localConnectionString`) |
| `env.d.ts` | Types `env` from `cloudflare:workers`. Keep its bindings in sync with `types.ts` |

## Writing a query test

```ts
import { env } from 'cloudflare:workers'
import postgres from 'postgres'

const sql = postgres(env.HYPERDRIVE.connectionString, { max: 1, transform: postgres.camel })
afterAll(() => sql.end())
beforeEach(() => sql`TRUNCATE users`)
```

- Use `transform: postgres.camel` so rows match the app (`passwordHash`, `isAdmin`).
- `TRUNCATE users` in `beforeEach` is safe because the test DB has no seed data.
- Need fixtures? Run `npm run db:seed:test`, or insert rows in the test.
- Route tests: `app.request('/path', init, env, createExecutionContext())`, then `await waitOnExecutionContext(ctx)` (see `health.test.ts`).

## Gotchas

- **Vitest doesn't type-check.** Run `npx tsc --noEmit -p .` to catch type errors.
- **Parallel files share one DB.** Two files truncating `users` at once will interfere. If that happens, set `fileParallelism: false` in `vitest.config.ts`.
- **"Refusing to run tests against …"** means the override isn't reaching the binding. Check that `vitest.config.ts` still sets the env var before `defineConfig`, and that your shell isn't exporting a different `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`.
- **Connection refused** means the container isn't up: `npm run db:up`.
