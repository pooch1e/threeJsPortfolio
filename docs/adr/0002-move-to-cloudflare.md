# Backend moved from Go + Cloud Run + Supabase to a Cloudflare Worker

The first backend (`server/`) was a Go service (Chi, raw `database/sql`, Postgres) deployed to Google Cloud Run with a Supabase database. It was written to learn Go and to practise deploying a real API, not because the portfolio needed that stack (see `server/docs/adr/0001-no-orm.md`). It has been replaced by a Hono API on Cloudflare Workers with D1 (`worker/`), and the Go code is kept in `server/` as a historical learning reference. It is deprecated and no longer deployed.

## Why Cloudflare

- **One vendor, one dashboard.** DNS, the frontend, the API and the database are all managed in Cloudflare. Before, a deploy touched Vercel, Google Cloud and Supabase.
- **Less deployment machinery.** Cloud Run needed a Dockerfile, Secret Manager, Cloud Build and Artifact Registry, and left storage behind after the service was deleted. A Worker is one `wrangler.toml` and one command.
- **No cold starts.** Cloud Run's scale-to-zero meant a cold container plus a Postgres connection on the first request. Workers have no container, and D1 is a binding rather than a connection.
- **Same-site cookies.** `arczpng.com` and `api.arczpng.com` share a registrable domain, so the `session` cookie is first-party and Safari keeps it.
- **Match the platform to the app.** A handful of tables did not justify a separate database vendor.

## Consequences

- The route contract, JWT cookie and JSON error envelope were kept, so the frontend barely changed. bcrypt password hashes still verify (`bcryptjs`).
- The Go docs and `server/` are marked historical. Nothing in `server/` is deployed or maintained.
- Setup and runbook: [DEPLOYMENT.md](../DEPLOYMENT.md). Backend plan: [worker/PLAN.md](../../worker/PLAN.md).
