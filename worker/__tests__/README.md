# Worker testing

Tests run **inside workerd** (Cloudflare's runtime) via `@cloudflare/vitest-plugin`, against a **real D1 (SQLite) database** that lives in memory for the length of the run. No mocks, no Docker: the app gets real bindings (`env`) and a real `ExecutionContext`.

## Quick start (fresh clone)

Prerequisites: Node.

```bash
cd worker
npm install
npm test
```

Nothing else is needed: no database server, no `.env`, no Cloudflare login. Run a single file with `npx vitest run __tests__/path/to/file.test.ts`.

## How it fits together

```
npm test
 └─ vitest run
     ├─ vitest.config.ts
     │    ├─ readD1Migrations("./migrations")            → runs in Node, reads the SQL files
     │    ├─ cloudflareTest({ wrangler: wrangler.toml }) → workerd + the DB binding (in memory)
     │    │    └─ miniflare.bindings: JWT_SECRET, TEST_MIGRATIONS
     │    └─ setupFiles: __tests__/setup/applyMigrations.ts → applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
     └─ each *.test.ts uses env.DB (via __tests__/setup/db.ts) and clears users in beforeEach
```

The schema comes from the same `migrations/` folder that `wrangler d1 migrations apply` uses for local dev and production, so tests always run against the real schema. The test database is in memory and never touches `.wrangler/state`, so tests can't damage your local dev data.

## Databases

| Database | Where | Contents | Used by |
|---|---|---|---|
| test | in memory, per run | schema only, cleared before each test | `npm test` |
| local dev | `.wrangler/state/v3/d1` (gitignored) | schema + `guest` account | `wrangler dev` |
| production | Cloudflare D1 `threejs-portfolio` | real data | deployed Worker |

Files:

| File | Purpose |
|---|---|
| `migrations/NNNN_*.sql` | Schema, applied in order. Create new ones with `npm run db:migration:new -- <name>` and never edit one that has run in production |
| `db/seed.sql` | Dev guest account (`guest`, password `Guest1234!`) |
| `db/seed.fixtures.sql` | Opt-in dummy users for local dev (admin, alice, bob, carol, nameless; password `Password123!`) |

## Scripts

| Script | What it does |
|---|---|
| `npm test` | Run all tests once |
| `npm run test:watch` | Watch mode |
| `npm run db:migrate` | Apply pending migrations to the local dev DB |
| `npm run db:seed` | Load the guest account into the local dev DB |
| `npm run db:seed:fixtures` | Load the dummy users into the local dev DB |
| `npm run db:reset` | Delete the local dev DB, then migrate and seed it again |
| `npm run db:query -- "SELECT ..."` | Run one SQL statement against the local dev DB |
| `npm run db:migrate:remote` | Apply pending migrations to production (needs `wrangler login`) |

## Writing a query test

```ts
import { db, clearUsers } from "../setup/db";

beforeEach(() => clearUsers());

const { userId } = await createUser(db, { username, email, passwordHash });
```

- Query functions take `db: D1Database`, so tests pass `env.DB` straight in.
- Rows come back from D1 in snake_case, with `is_admin` as `0`/`1` and timestamps as ISO text. The query modules convert them to camelCase, booleans and `Date`s. Assert on what the query function returns, not on raw rows.
- Arrange state with the helpers in `setup/db.ts` (`makeAdmin`, `deleteUserRow`, `storedPasswordHash`, `countRows`, `tick`), or insert rows through the query functions.
- To simulate a database outage, pass `failingDb()` in place of `env.DB`, or call the app with `{ ...env, DB: failingDb() }`.
- Route tests: `app.request('/path', init, env, createExecutionContext())`, then `await waitOnExecutionContext(ctx)` (see `health.test.ts`).

## Gotchas

- **Vitest doesn't type-check.** Run `npx tsc --noEmit -p .` to catch type errors.
- **Files run one at a time** (`fileParallelism: false`). They share one D1 instance and each clears `users`, so files running in parallel would interfere.
- **Ordering tests need distinct timestamps.** `created_at` has millisecond precision. Call `await tick()` between inserts when a test depends on newest-first order.
- **No error codes.** D1 reports a duplicate as a message like `UNIQUE constraint failed: users.email`. `lib/db.ts#uniqueViolationColumn` parses the column out of it. If the column is missing from a 409, check that helper first.
- **`RETURNING` ignores triggers.** That's why `updated_at` is set explicitly in each `UPDATE` and not by a trigger.
