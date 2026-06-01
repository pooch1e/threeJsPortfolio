# Deployment Plan: Cloudflare Pages + Fly.io + Supabase

## Stack Overview

| Layer | Service | Reason |
|---|---|---|
| Frontend | Cloudflare Pages | Free, no bandwidth limits, global CDN, auto-deploys from GitHub |
| Backend (Go) | Fly.io | Free 3 shared VMs, always-on (no cold starts), Docker native |
| Database | Supabase | Free managed Postgres, no 90-day expiry (unlike Render) |

---

## Pre-Deployment Fixes Required

These must be completed before deploying. They are bugs or gaps that will cause failures in production.

### 1. Set `JWT_SECRET`
`JWT_SECRET` in `.env.local` is currently empty. Generate a strong random secret (32+ characters) before any auth will work.

```bash
openssl rand -base64 32
```

### 2. Fix three `apiClient` usage bugs in frontend utils

`apiClient` in `src/utils/api.js` returns a **parsed JSON object** (or `null` for 204 responses), not a raw `Response` object. Three utility files incorrectly call `.ok`, `.json()`, and `.text()` on the result:

| File | Invalid calls |
|---|---|
| `src/utils/postSignup.js` | `res.ok`, `res.text()` |
| `src/utils/validateSession.js` | `res.ok`, `res.json()` |
| `src/utils/postLogout.js` | `res.ok` |

Each should be rewritten to work with the already-parsed return value from `apiClient`.

### 3. Fix `godotenv.Load` path in `server/cmd/main.go`

Currently: `godotenv.Load("../.env.local")` — uses a relative path that breaks inside a Docker container. The call silently ignores errors if the file is missing, so the container won't crash, but it is still misleading. Wrap it to only load when the file is present:

```go
if _, err := os.Stat("../.env.local"); err == nil {
    godotenv.Load("../.env.local")
}
```

In production all config is injected as environment variables by Fly.io, so the file is not needed.

### 4. Set `SameSite=None; Secure` on JWT cookie for cross-origin auth

The JWT is sent as an HTTP cookie with `credentials: 'include'` from the frontend. Because the frontend (Cloudflare Pages domain) and backend (Fly.io domain) are on different origins, the cookie **must** be set with:

- `SameSite=None`
- `Secure=true`

Without this, browsers will block the cookie entirely on cross-origin requests.

This is a code change required in `server/internal/handlers/login.go`. Use an environment variable (e.g. `APP_ENV=production`) to set these flags conditionally so local development is not affected.

```go
sameSite := http.SameSiteLaxMode
secure := false
if os.Getenv("APP_ENV") == "production" {
    sameSite = http.SameSiteNoneMode
    secure = true
}

http.SetCookie(w, &http.Cookie{
    Name:     "token",
    Value:    tokenString,
    HttpOnly: true,
    Secure:   secure,
    SameSite: sameSite,
    Path:     "/",
})
```

---

## Step-by-Step Implementation

### Phase 1 — Dockerfile for Go Backend

Create `server/Dockerfile` as a multi-stage build. The final image is ~15–20 MB.

```dockerfile
# Stage 1: Build
FROM golang:1.25-alpine AS builder

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o /app/server ./cmd/

# Stage 2: Runtime
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
  JWT_SECRET="<generated secret>" \
  DATABASE_URL="<supabase connection string — see Phase 3>" \
  FRONTEND_URL="https://<your-cloudflare-pages-domain>"
```

#### Deploy

```bash
fly deploy
```

Verify: `https://<app-name>.fly.dev/health` should return `{"status":"ok"}`.

---

### Phase 3 — Supabase (PostgreSQL)

1. Create a new project at [supabase.com](https://supabase.com) (free tier)
2. In the Supabase SQL editor, run the contents of `server/db/seed/seed.sql` to create the schema
3. Go to **Project Settings → Database → Connection string → URI**
4. Copy the **Session mode** connection string (port 5432)
5. Append `?sslmode=require` — the local string uses `?sslmode=disable` which Supabase rejects

Example format:
```
postgres://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
```

Use this as the `DATABASE_URL` secret in Fly.io.

---

### Phase 4 — Cloudflare Pages (React/Vite Frontend)

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com) and connect your GitHub repo
2. Set build configuration:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version (env var) | `NODE_VERSION=18` |

3. Add environment variable in the Pages dashboard:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://<your-fly-app>.fly.dev` |

This is already wired in `src/utils/api.js` — no code changes needed. Deploys trigger automatically on every push to `main`.

---

### Phase 5 — GitHub OAuth (when ready to implement)

1. Register a new OAuth App at [github.com/settings/developers](https://github.com/settings/developers):
   - **Homepage URL:** `https://<your-cloudflare-pages-domain>`
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
| `FRONTEND_URL` | Cloudflare Pages domain — used for CORS allowed origin |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID (when OAuth implemented) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret (when OAuth implemented) |

### Cloudflare Pages — Vite Frontend

Set in the Pages project dashboard under Settings → Environment Variables.

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Full URL of the Fly.io backend e.g. `https://threejs-portfolio-api.fly.dev` |

---

## Files to Create / Modify

| File | Action | Notes |
|---|---|---|
| `server/Dockerfile` | Create | Multi-stage Go build — see Phase 1 |
| `server/fly.toml` | Create | Generated by `fly launch`, then edited |
| `server/cmd/main.go` | Modify | Make `godotenv.Load` conditional on file existence |
| `server/internal/handlers/login.go` | Modify | Set `SameSite=None; Secure` cookie for production |
| `src/utils/postSignup.js` | Fix | Remove invalid `res.ok` / `res.text()` calls |
| `src/utils/validateSession.js` | Fix | Remove invalid `res.ok` / `res.json()` calls |
| `src/utils/postLogout.js` | Fix | Remove invalid `res.ok` check |

---

## Open Questions

Decisions to make before or during implementation:

1. **Cookie SameSite handling** — use `APP_ENV=production` env var to toggle `SameSite=None; Secure` (recommended), or always use strict mode and run HTTPS locally with Vite's `--https` flag?

2. **Fly.io app name** — the name becomes `<name>.fly.dev`. Choose before running `fly launch`.

3. **Custom domain** — attach a custom domain to Cloudflare Pages and/or Fly.io, or use default `*.pages.dev` / `*.fly.dev` subdomains for now?

4. **`godotenv` in production** — keep the conditional load for developer convenience, or remove entirely and always rely on environment variables?

---

## Local Development (unchanged)

The existing workflow is unaffected by this deployment setup:

```bash
npm run full-stack        # start Docker (Postgres) + Go server + Vite dev server
npm run full-stack-down   # stop everything
```

All production config is isolated to Fly.io secrets and Cloudflare Pages env vars — `.env.local` continues to serve local development only.
