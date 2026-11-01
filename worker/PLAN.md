# Worker API — Go → Hono port plan

Port the Go REST API (`server/`) to Hono on Cloudflare Workers. Exercise: the files are scaffolded with header comments and stubs only; fill them in following the order below.

## Decisions

- **Structure:** feature folders. Each feature has `*.routes.ts` (the "controller", handlers inline so Hono infers path params), `*.queries.ts` (the "model", plain functions taking `sql`), `*.schemas.ts` (zod).
- **No repository interface, no controller functions.** Hono loses path-param types when handlers are extracted from the route. Testability comes from queries taking `sql` as an argument.
- **DB:** `postgres` driver, one client per request, pooled by Cloudflare Hyperdrive. No module-level pool on Workers.
- **Auth:** same contract as Go — HS256 JWT, 1hr, HttpOnly cookie named `session`, `SameSite=None; Secure` in production.
- **Errors:** always JSON `{ "error": "..." }`. Use `app.onError` plus `HTTPException`.
- **Validation:** `zod` + `@hono/zod-validator`.

## Layout

```
worker/
  index.ts                  app, global middleware, route mounting
  types.ts                  Env bindings + context variables
  middleware/
    db.ts                   per-request sql client from Hyperdrive
    auth.ts                 requireAuth — verify JWT cookie, set userId
    admin.ts                requireAdmin — load user, check role
  lib/
    jwt.ts                  sign/verify session token
    password.ts             hash/compare
  features/
    auth/
      auth.schemas.ts       signup + login zod schemas
      auth.queries.ts       createUser, findUserByEmail
      auth.routes.ts        POST /signup, /login, /logout
    users/
      users.schemas.ts      update + id param schemas
      users.queries.ts      list, get, update, delete, setPasswordHash
      users.routes.ts       GET /me, admin CRUD
```

## Route map (from `server/cmd/api.go`)

| Method | Path | Auth | Feature |
|---|---|---|---|
| GET | `/health` | none | index |
| POST | `/api/signup` | none | auth |
| POST | `/api/login` | none | auth |
| POST | `/api/logout` | session | auth |
| GET | `/api/me` | session | users |
| GET | `/api/admin/users` | admin | users |
| GET | `/api/admin/users/:id` | admin | users |
| PUT | `/api/admin/users/:id` | admin | users |
| DELETE | `/api/admin/users/:id` | admin | users |
| POST | `/api/admin/users/:id/passwordReset` | admin | users |

Reference implementations: `server/internal/handlers/*.go`, `middleware/*.go`, `utils/jwt.go`, `utils/validateSignup.go`.

## Build order

Each phase depends on the one before it. Finish and manually test a phase before starting the next.

### Phase 0 — Foundation

Setup already done: `postgres`, `zod`, `@hono/zod-validator` installed; `nodejs_compat` flag, `[[hyperdrive]]` binding (with `localConnectionString` on Docker Postgres port 5433) and `tsconfig.json` in place.

1. `types.ts` — define `AppEnv` (see the worked example below). Everything imports it, so it comes first.
2. `middleware/db.ts` — create the per-request `sql` client, `c.set("sql", ...)`, close with `waitUntil` after `next()`.
3. `index.ts` — `new Hono<AppEnv>()`, `app.use("*", dbMiddleware)`.

Test: `npm run dev`, `curl localhost:8787/health`. Optionally add a throwaway route running ``await c.get("sql")`select 1` `` to prove the Postgres connection, then delete it.

### Phase 1 — Shared helpers

- `lib/password.ts` — `hashPassword`, `comparePassword`. Use `bcryptjs` so existing Go bcrypt hashes verify unchanged.
- `lib/jwt.ts` — `signSession`, `verifySession`; HS256, 1hr expiry, via `hono/jwt`.
- `worker/.dev.vars` (gitignored) — `JWT_SECRET`, `FRONTEND_URL=http://localhost:5173`, `APP_ENV=development`.

### Phase 2 — Signup

`auth.schemas.ts` → `auth.queries.ts#createUser` → `POST /signup` → mount in `index.ts` → `app.onError`. Port the rules from `validateSignup.go`. Handle unique-violation (Postgres code `23505`) as 409.

Test: signup returns 201 the first time and 409 the second.

### Phase 3 — Login

`loginSchema`, `auth.queries.ts#findUserByEmail`, `POST /login`: compare password, `signSession`, set the `session` cookie (HttpOnly; `SameSite=None; Secure` when `APP_ENV=production`). Return the same error for unknown email and wrong password.

Test: response carries a `Set-Cookie: session=...` header.

### Phase 4 — Auth middleware, `/me`, logout

`middleware/auth.ts#requireAuth` reads the cookie, `verifySession`, `c.set("userId", ...)`, 401 on failure. `users.queries.ts#getUser` → `GET /api/me`. `POST /api/logout` clears the cookie.

Test with `curl -c cookies.txt` / `-b cookies.txt`: `/me` is 401 without the cookie and returns the user with it.

### Phase 5 — Admin

`middleware/admin.ts#requireAdmin` (runs after `requireAuth`, loads the user, checks role). `users.queries.ts`: list, get, update, delete, `setPasswordHash`. `users.schemas.ts`: update body + id param. The five `/api/admin/users` routes. A missing row is a 404 (the `ErrNotFound` equivalent).

### Phase 6 — CORS and cookies in a browser

`hono/cors` on `/api/*` with the exact `FRONTEND_URL` origin and `credentials: true`, registered before other middleware. Then exercise it from the real React app; cookie and CORS problems usually only show up in a browser.

### Phase 7 — Tests

Vitest with `@cloudflare/vitest-pool-workers`, or call query functions directly against Docker Postgres (they take `sql`, so no mocks are needed). Port cases from the `*_test.go` files.

### Phase 8 — Deploy and cutover

1. `npx wrangler login`.
2. `npx wrangler hyperdrive create portfolio-db --connection-string="<Supabase connection string>"` and put the printed `id` in `wrangler.toml`.
3. `npx wrangler secret put JWT_SECRET`; set `FRONTEND_URL` and `APP_ENV=production` under `[vars]`.
4. `npx wrangler deploy`.
5. Point the frontend's `VITE_API_URL` at the Worker, update `docs/DEPLOYMENT.md`, delete `server/` when satisfied.

## Worked example — signup

Request flow: `POST /api/signup` → db middleware puts `sql` on the context → `zValidator` parses and validates the body → handler hashes the password → `createUser` inserts → `201` with the new user. Any thrown `HTTPException` is turned into `{ "error": "..." }` by `app.onError`.

### `types.ts`

```ts
/**
 * Shared Hono environment types — Cloudflare bindings and per-request context
 * variables used by every route and middleware.
 */
import type { Sql } from "postgres";

export type AppEnv = {
  Bindings: {
    HYPERDRIVE: Hyperdrive;
    JWT_SECRET: string;
    FRONTEND_URL: string;
    APP_ENV: string;
  };
  Variables: {
    sql: Sql;
    userId: string;
  };
};
```

### `middleware/db.ts`

```ts
/**
 * DB middleware — opens a postgres client per request from the Hyperdrive
 * binding and closes it after the response.
 */
import { createMiddleware } from "hono/factory";
import postgres from "postgres";
import type { AppEnv } from "../types";

// Workers cannot reuse a connection across requests, so there is no module-level pool.
export const dbMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const sql = postgres(c.env.HYPERDRIVE.connectionString, { max: 1 });
  c.set("sql", sql);
  await next();
  c.executionCtx.waitUntil(sql.end());
});
```

### `features/auth/auth.schemas.ts`

```ts
/**
 * Auth request schemas (zod) — signup and login bodies.
 */
import { z } from "zod";

export const signupSchema = z.object({
  username: z.string().trim().min(3).max(30),
  email: z.email().toLowerCase(),
  password: z.string().min(8),
});
```

The rules above are placeholders; replace them with the ones from `server/internal/utils/validateSignup.go`.

### `features/auth/auth.queries.ts`

```ts
/**
 * Auth queries — SQL for creating and looking up users during signup/login.
 */
import type { Sql } from "postgres";

type NewUser = { username: string; email: string; passwordHash: string };

export const createUser = async (sql: Sql, { username, email, passwordHash }: NewUser) => {
  const [user] = await sql`
    insert into users (username, email, password_hash)
    values (${username}, ${email}, ${passwordHash})
    returning id, username, email
  `;
  return user;
};
```

`returning` deliberately omits `password_hash`; never return the whole row.

### `features/auth/auth.routes.ts`

```ts
/**
 * Auth routes — POST /signup, /login, /logout. Handlers are written inline
 * (not extracted) so Hono keeps request and param types.
 */
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import type { AppEnv } from "../../types";
import { hashPassword } from "../../lib/password";
import { signupSchema } from "./auth.schemas";
import { createUser } from "./auth.queries";

const UNIQUE_VIOLATION = "23505";

export const auth = new Hono<AppEnv>();

auth.post(
  "/signup",
  zValidator("json", signupSchema, (result) => {
    if (!result.success) {
      throw new HTTPException(400, { message: result.error.issues[0].message });
    }
  }),
  async (c) => {
    const { username, email, password } = c.req.valid("json");
    const passwordHash = await hashPassword(password);

    try {
      const user = await createUser(c.get("sql"), { username, email, passwordHash });
      return c.json(user, 201);
    } catch (err) {
      if ((err as { code?: string }).code === UNIQUE_VIOLATION) {
        throw new HTTPException(409, { message: "An account with this email already exists" });
      }
      throw err;
    }
  },
);
```

The insert runs straight away and the database's unique constraint on `email` decides duplicates. Go checks first (`CheckUserExists`) and then inserts, which races under concurrent signups.

### `index.ts`

```ts
/**
 * Worker entry — Hono app served by Cloudflare Workers (wrangler dev / deploy).
 * Mounts global middleware and the feature route modules.
 */
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "./types";
import { dbMiddleware } from "./middleware/db";
import { auth } from "./features/auth/auth.routes";

const app = new Hono<AppEnv>();

app.use("*", dbMiddleware);

app.get("/health", (c) => c.json({ check: "ok" }));

app.route("/api", auth);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
```

### Try it

```bash
curl -X POST localhost:8787/api/signup \
  -H 'content-type: application/json' \
  -d '{"username":"joel","email":"joel@example.com","password":"Test1ng@123"}'
```

Expect `201` with `{id, username, email}`; repeating it returns `409`. Requires Docker Postgres up (`cd server && make docker-up`) with the `users` table from `server/db`.

## Open questions

- **Password hashing:** existing hashes are from Go. If bcrypt, `bcryptjs` verifies them as-is. If migrating, Web Crypto PBKDF2 is native but needs a rehash-on-login step.
- **Secrets:** `JWT_SECRET` and `FRONTEND_URL` go in `.dev.vars` locally and `wrangler secret put` / `[vars]` in prod.
- **Schema/migrations:** Go side owns them today. Decide whether the Worker adopts them or they stay in `server/db`.
- **Typed RPC:** export `AppType` from `index.ts` and use `hc<AppType>` in the React app once routes are chained.
