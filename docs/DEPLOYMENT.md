# Deployment Plan: Vercel + Cloud Run + Supabase

## Stack Overview

| Layer | Service | Reason |
|---|---|---|
| Frontend | Vercel | User-managed — auto-deploys from GitHub, zero config for Vite |
| Backend (Go) | Google Cloud Run | Always-free tier (2M requests, 180k vCPU-s, 360k GB-s/month), scale-to-zero, Docker native |
| Database | Supabase | Free managed Postgres, no 90-day expiry (unlike Render) |

Fly.io was the original plan but its free tier ended for new accounts
in Oct 2024 (now pay-as-you-go, ~$8-25/mo for a small always-on app).
Cloud Run's always-free tier is still genuinely free at this app's
traffic level. Tradeoff: Cloud Run scales to zero by default, so the
first request after idle pays a cold start — typically well under 1s
for a small Go binary, plus DB connection time to Supabase. If that's
ever a problem, `--min-instances=1` eliminates cold starts entirely at
the cost of running 24/7 (a few dollars/month, since it exceeds the
free vCPU/memory quota).

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
- `JWT_SECRET` — generate a fresh one for the Secret Manager secret (see
  below); the empty value in local `.env.local` doesn't block
  deployment since production never reads that file.

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
- No `.env.local` is copied into the image — all config comes from Cloud Run env vars/secrets
- `ca-certificates` is required for Supabase's TLS connection
- Cloud Run injects `PORT` automatically (defaults to 8080, matching this Dockerfile's `EXPOSE`), so it doesn't need to be set explicitly as a secret/env var

---

### Phase 2 — Cloud Run Setup (Go Backend)

#### Install gcloud CLI

```bash
brew install --cask google-cloud-sdk
gcloud auth login
gcloud config set project <your-gcp-project-id>
```

#### Enable required APIs (one-time per project)

```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

#### Create secrets

```bash
printf '%s' "$(openssl rand -base64 32)" | gcloud secrets create JWT_SECRET --data-file=-
printf '%s' "<supabase connection string — see Phase 3>" | gcloud secrets create DATABASE_URL --data-file=-
```

To rotate either later: `gcloud secrets versions add JWT_SECRET --data-file=-` (and update `--set-secrets` to `:latest`, already the default below).

#### Deploy

Run from inside the `server/` directory — `--source .` builds the
existing Dockerfile via Cloud Build, no separate `docker build`/`push`
step needed:

```bash
gcloud run deploy threejs-portfolio-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars APP_ENV=production,FRONTEND_URL="https://<your-vercel-domain>" \
  --set-secrets JWT_SECRET=JWT_SECRET:latest,DATABASE_URL=DATABASE_URL:latest \
  --cpu-boost
```

`--allow-unauthenticated` is required since this is a public API;
`--cpu-boost` speeds up (but doesn't eliminate) cold starts on the
free scale-to-zero tier. Add `--min-instances=1` instead/also if
cold starts ever become a problem — that keeps one instance warm
24/7, which exceeds the free tier and costs a few dollars/month.

Verify: `https://<service-url>.run.app/health` should return `{"status":"ok"}`. The service URL is printed at the end of `gcloud run deploy`, and can be re-fetched with:

```bash
gcloud run services describe threejs-portfolio-api --region us-central1 --format 'value(status.url)'
```

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

Use this as the `DATABASE_URL` secret in Cloud Run Secret Manager.

Note: `openDb()` in `server/cmd/api.go` opens the connection with no pool
tuning (`SetMaxOpenConns`/`SetMaxIdleConns`/`SetConnMaxLifetime` are never
called) — fine at this scale, revisit if connections get exhausted.

---

### Phase 4 — Vercel (React/Vite Frontend)

Handled directly by the project owner. Coordination points only:

1. In the Vercel project's environment variables, set:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://<service-name>-<hash>.<region>.run.app` |

This is already wired in `src/utils/api.js` — no code changes needed.

2. Once the Vercel domain is known, set it as `FRONTEND_URL` on the Cloud
   Run service (Phase 2, via `gcloud run services update ... --set-env-vars`
   or by redeploying) — CORS (`server/cmd/api.go`) allows exactly one
   origin, no wildcards, and it must match exactly.

---

### Phase 5 — GitHub OAuth (when ready to implement)

1. Register a new OAuth App at [github.com/settings/developers](https://github.com/settings/developers):
   - **Homepage URL:** `https://<your-vercel-domain>`
   - **Authorization callback URL:** `https://<your-cloud-run-service-url>/api/auth/github/callback`
2. Add secrets and wire them into the service:

```bash
printf '%s' "<client id>" | gcloud secrets create GITHUB_CLIENT_ID --data-file=-
printf '%s' "<client secret>" | gcloud secrets create GITHUB_CLIENT_SECRET --data-file=-

gcloud run services update threejs-portfolio-api \
  --region us-central1 \
  --update-secrets GITHUB_CLIENT_ID=GITHUB_CLIENT_ID:latest,GITHUB_CLIENT_SECRET=GITHUB_CLIENT_SECRET:latest
```

3. Implement the OAuth flow in the Go backend (callback handler, token exchange, user upsert)

---

## Environment Variables Reference

### Cloud Run — Go Backend

`APP_ENV` and `FRONTEND_URL` are plain env vars (`--set-env-vars`);
`JWT_SECRET` and `DATABASE_URL` are Secret Manager secrets
(`--set-secrets`). Never committed to the repo. `PORT` is injected
automatically by Cloud Run.

| Variable | Description |
|---|---|
| `APP_ENV` | `production` |
| `JWT_SECRET` | Random 32+ char string — used to sign/verify JWTs (Secret Manager) |
| `DATABASE_URL` | Supabase Postgres connection string with `?sslmode=require` (Secret Manager) |
| `FRONTEND_URL` | Vercel domain — used for CORS allowed origin |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID (when OAuth implemented, Secret Manager) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret (when OAuth implemented, Secret Manager) |

### Vercel — Vite Frontend

Set in the Vercel project dashboard under Settings → Environment Variables.

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Full URL of the Cloud Run backend e.g. `https://threejs-portfolio-api-xyz.us-central1.run.app` |

---

## Files to Create / Modify

| File | Action | Notes |
|---|---|---|
| `server/Dockerfile` | Created | Multi-stage Go build — see Phase 1, used as-is by Cloud Run's `--source` build |
| `server/cmd/main.go` | Modified | `godotenv.Load` now conditional on file existence |
| `src/utils/postSignup.js` | Fixed | Removed invalid `res.ok` / `res.text()` calls |
| `src/utils/validateSession.js` | Fixed | Removed invalid `res.ok` / `res.json()` calls |

---

## Open Questions

Decisions to make before or during implementation:

1. **Cloud Run service name and region** — the name/region combination forms part of the auto-generated `*.run.app` URL. Choose before first `gcloud run deploy`; the region also affects free-tier network egress eligibility (North America only).

2. **Custom domain** — attach a custom domain to Vercel and/or Cloud Run (via `gcloud run domain-mappings create`), or use default `*.vercel.app` / `*.run.app` subdomains for now?

3. **Cold starts vs. cost** — stay on scale-to-zero (free, occasional ~1s cold start) or set `--min-instances=1` (no cold starts, a few dollars/month since it exceeds the free vCPU/memory quota)?

---

## Local Development (unchanged)

The existing workflow is unaffected by this deployment setup:

```bash
npm run full-stack        # start Docker (Postgres) + Go server + Vite dev server
npm run full-stack-down   # stop everything
```

All production config is isolated to Cloud Run env vars/secrets and Vercel env vars — `.env.local` continues to serve local development only.
