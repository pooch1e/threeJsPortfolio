# Deployment Plan: Vercel + Fly.io + Supabase

## Stack Overview

| Layer | Service | Reason |
|---|---|---|
| Frontend | Vercel | User-managed — auto-deploys from GitHub, zero config for Vite |
| Backend (Go) | Fly.io | Free 3 shared VMs, always-on (no cold starts), Docker native |
| Database | Supabase | Free managed Postgres, no 90-day expiry (unlike Render) |

Frontend deployment is handled directly by the project owner in the
Vercel dashboard — this doc only covers the backend/DB and the two env
vars that connect the three services.

---

## Pre-Deployment Fixes (status)

- ~~`apiClient` usage bugs in `postSignup.js`/`validateSession.js`~~ —
  **fixed**. `apiClient` (`src/utils/api.js`) throws on non-2xx and
  returns the already-parsed body (JSON/text/`null`), never a `Response`;
  both files now just `return apiClient(...)` / `return await apiClient(...)`
  directly instead of calling `.ok`/`.json()`/`.text()` on the result.
  (`postLogout.js` never had this bug.)
- ~~`godotenv.Load` unconditional relative path in `server/cmd/main.go`~~ —
  **fixed**. Now guarded with `os.Stat("../.env.local")` so it's inert
  inside the Fly.io container.
- ~~`SameSite=None; Secure` cookie flags for cross-origin auth~~ —
  **already implemented**. `sessionCookieFlags()` in
  `server/internal/handlers/login.go` returns `SameSiteNoneMode, true`
  when `APP_ENV=production`, shared by both the login and logout
  handlers so they stay in sync.
- `JWT_SECRET` — generate a fresh one for the Fly secret (see below); the
  empty value in local `.env.local` doesn't block deployment since
  production never reads that file.

---

## Step-by-Step Implementation

### Phase 1 — Dockerfile for Go Backend

`server/Dockerfile` (already created):

```dockerfile
FROM golang:1.25-alpine AS builder
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o /app/server ./cmd/

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
ENTRYPOINT ["/app/server"]
```

Notes:
- No `.env.local` is copied into the image — all config comes from Fly.io secrets
- `ca-certificates` is required for Supabase's TLS connection

---

### Phase 2 — Fly.io Setup (Go Backend)

#### Install flyctl

```bash
brew install flyctl
fly auth login
```

#### Initialise the app

Run from inside the `server/` directory:

```bash
fly launch --no-deploy
```

This detects the Dockerfile and generates `fly.toml`. Review and confirm settings. Key values to check/set in `fly.toml`:

```toml
app = "threejs-portfolio-api"   # or your chosen name — becomes <name>.fly.dev
primary_region = "lhr"          # choose closest region

[http_service]
  internal_port = 8080
  force_https = true

[[http_service.checks]]
  path = "/health"
  interval = "30s"
  timeout = "5s"
```

#### Set secrets

```bash
fly secrets set \
  PORT=8080 \
  APP_ENV=production \
  JWT_SECRET="$(openssl rand -base64 32)" \
  DATABASE_URL="<supabase connection string — see Phase 3>" \
  FRONTEND_URL="https://<your-vercel-domain>"
```

#### Deploy

```bash
fly deploy
```

Verify: `https://<app-name>.fly.dev/health` should return `{"status":"ok"}`.

---

### Phase 3 — Supabase (PostgreSQL)

1. Create a new project at [supabase.com](https://supabase.com) (free tier)
2. In the Supabase SQL editor, run the contents of `server/db/seed/seed.sql` to create the schema — there's no migration tool in this repo (no golang-migrate/goose), schema is applied via this flat SQL file
3. Go to **Project Settings → Database → Connection string → URI**
4. Copy the **Session mode** connection string (port 5432)
5. Append `?sslmode=require` — the local string uses `?sslmode=disable` which Supabase rejects

Example format:
```
postgres://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
```

Use this as the `DATABASE_URL` secret in Fly.io.

Note: `openDb()` in `server/cmd/api.go` opens the connection with no pool
tuning (`SetMaxOpenConns`/`SetMaxIdleConns`/`SetConnMaxLifetime` are never
called) — fine at this scale, revisit if connections get exhausted.

---

### Phase 4 — Vercel (React/Vite Frontend)

Handled directly by the project owner. Coordination points only:

1. In the Vercel project's environment variables, set:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://<your-fly-app>.fly.dev` |

This is already wired in `src/utils/api.js` — no code changes needed.

2. Once the Vercel domain is known, set it as `FRONTEND_URL` in the Fly
   secrets above (Phase 2) — CORS (`server/cmd/api.go`) allows exactly
   one origin, no wildcards, and it must match exactly.

---

### Phase 5 — GitHub OAuth (when ready to implement)

1. Register a new OAuth App at [github.com/settings/developers](https://github.com/settings/developers):
   - **Homepage URL:** `https://<your-vercel-domain>`
   - **Authorization callback URL:** `https://<your-fly-app>.fly.dev/api/auth/github/callback`
2. Add secrets to Fly.io:

```bash
fly secrets set \
  GITHUB_CLIENT_ID="<client id>" \
  GITHUB_CLIENT_SECRET="<client secret>"
```

3. Implement the OAuth flow in the Go backend (callback handler, token exchange, user upsert)

---

## Environment Variables Reference

### Fly.io — Go Backend

Set via `fly secrets set`. Never committed to the repo.

| Variable | Description |
|---|---|
| `PORT` | `8080` |
| `APP_ENV` | `production` |
| `JWT_SECRET` | Random 32+ char string — used to sign/verify JWTs |
| `DATABASE_URL` | Supabase Postgres connection string with `?sslmode=require` |
| `FRONTEND_URL` | Vercel domain — used for CORS allowed origin |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID (when OAuth implemented) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret (when OAuth implemented) |

### Vercel — Vite Frontend

Set in the Vercel project dashboard under Settings → Environment Variables.

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Full URL of the Fly.io backend e.g. `https://threejs-portfolio-api.fly.dev` |

---

## Files to Create / Modify

| File | Action | Notes |
|---|---|---|
| `server/Dockerfile` | Created | Multi-stage Go build — see Phase 1 |
| `server/fly.toml` | Create | Generated by `fly launch`, then edited |
| `server/cmd/main.go` | Modified | `godotenv.Load` now conditional on file existence |
| `src/utils/postSignup.js` | Fixed | Removed invalid `res.ok` / `res.text()` calls |
| `src/utils/validateSession.js` | Fixed | Removed invalid `res.ok` / `res.json()` calls |

---

## Open Questions

Decisions to make before or during implementation:

1. **Fly.io app name** — the name becomes `<name>.fly.dev`. Choose before running `fly launch`.

2. **Custom domain** — attach a custom domain to Vercel and/or Fly.io, or use default `*.vercel.app` / `*.fly.dev` subdomains for now?

---

## Local Development (unchanged)

The existing workflow is unaffected by this deployment setup:

```bash
npm run full-stack        # start Docker (Postgres) + Go server + Vite dev server
npm run full-stack-down   # stop everything
```

All production config is isolated to Fly.io secrets and Vercel env vars — `.env.local` continues to serve local development only.
