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

1. **Setup.** `npm i postgres zod @hono/zod-validator` (plus a hashing lib, see open questions). Add `nodejs_compat` flag and `[[hyperdrive]]` binding to `wrangler.toml` with `localConnectionString` pointing at Docker Postgres on 5433. Fill in `types.ts`.
2. **DB middleware.** `middleware/db.ts`: create client, `c.set("sql", ...)`, close with `waitUntil` after `next()`. Verify with a throwaway `SELECT 1` route.
3. **Signup.** `auth.schemas.ts` → `auth.queries.ts#createUser` → `lib/password.ts#hashPassword` → `POST /signup`. Port the rules from `validateSignup.go`. Handle unique-violation (Postgres code `23505`) as 409.
4. **Login.** `findUserByEmail`, `comparePassword`, `lib/jwt.ts#signSession`, set cookie. Same error for unknown email and wrong password.
5. **Auth middleware + `/me` + logout.** `verifySession`, `requireAuth`, clear cookie on logout.
6. **Admin.** `requireAdmin`, then the five admin routes. Map `ErrNotFound` equivalent to 404.
7. **Error handling + CORS.** `app.onError` returning `{ error }`. `hono/cors` with exact `FRONTEND_URL` origin, `credentials: true`.
8. **Tests.** Vitest with `@cloudflare/vitest-pool-workers`, or test queries directly against Docker Postgres. Port cases from the `*_test.go` files.
9. **Cutover.** Point frontend `VITE_API_URL` at the Worker, update `docs/DEPLOYMENT.md`, delete `server/` when satisfied.

## Open questions

- **Password hashing:** existing hashes are from Go. If bcrypt, `bcryptjs` verifies them as-is. If migrating, Web Crypto PBKDF2 is native but needs a rehash-on-login step.
- **Secrets:** `JWT_SECRET` and `FRONTEND_URL` go in `.dev.vars` locally and `wrangler secret put` / `[vars]` in prod.
- **Schema/migrations:** Go side owns them today. Decide whether the Worker adopts them or they stay in `server/db`.
- **Typed RPC:** export `AppType` from `index.ts` and use `hc<AppType>` in the React app once routes are chained.
