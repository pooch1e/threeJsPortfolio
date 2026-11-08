# Deployment: Cloudflare Workers (frontend + API) and D1

## Stack

| Layer | Service | Notes |
|---|---|---|
| Frontend | Cloudflare Workers static assets (repo root), `arczpng.com` | Workers Builds on push to `main`; config in root `wrangler.toml` |
| API | Cloudflare Workers (`worker/`), `api.arczpng.com` | Hono app, deployed by Workers Builds on push to `main` |
| Database | Cloudflare D1 | SQLite, bound to the Worker as `DB` |

The previous stack (Go on Google Cloud Run, Postgres on Supabase) is being
retired. See [Teardown](#teardown-of-the-old-stack).

---

## Domains

`arczpng.com` is registered with Cloudflare, so its DNS is already on Cloudflare.

| Host | Serves | Set up by |
|---|---|---|
| `arczpng.com` | React app (frontend Worker) | `routes` in root `wrangler.toml` (`custom_domain = true`) |
| `www.arczpng.com` | redirect to `arczpng.com` | attached to the frontend Worker, plus Cloudflare Rules → Redirect Rules → "Redirect from WWW to root" |
| `api.arczpng.com` | Worker API | `routes` in `worker/wrangler.toml` (`custom_domain = true`); Cloudflare creates the DNS record and certificate on deploy |

Both hosts share the registrable domain `arczpng.com`, so the `session` cookie is
first-party and Safari keeps it. They are still different origins, so the Worker
sends CORS headers for exactly `FRONTEND_URL` (`https://arczpng.com`), with credentials.
`www.arczpng.com` is not allowed by CORS, which is why it redirects to the apex.

---

## Deploy the Worker (Workers Builds, from Git)

Already done: D1 database created (`database_id` in `wrangler.toml`) and
`0001_create_users.sql` applied remotely.

1. Merge the Worker branch into `main` and push.
2. Cloudflare dashboard → Workers & Pages → Create → Import a repository:

   | Setting | Value |
   |---|---|
   | Project name | `threejs-portfolio-api` (must match `name` in `wrangler.toml`) |
   | Production branch | `main` |
   | Root directory | `worker` |
   | Build command | `npm test` |
   | Deploy command | `npx wrangler deploy` |

3. After the first build: Worker → Settings → Variables and Secrets → add
   `JWT_SECRET` as a **Secret** (`openssl rand -base64 32`). Login returns 500 until
   it is set. Plain variables (`APP_ENV`, `FRONTEND_URL`) come from `[vars]` in
   `wrangler.toml` and are overwritten on every deploy, so change them there.
4. Verify: `curl https://api.arczpng.com/health` returns `{"check":"ok"}`.

Every push to `main` then builds, tests and deploys. Builds does not run D1
migrations: for a schema change, `npm run db:migration:new -- <name>`, edit the
file in `migrations/`, run `npm run db:migrate:remote`, then push the code that
needs it.

---

## Deploy the frontend (Workers Builds, from Git)

The repo root holds a second Worker, `threejs-portfolio-web`, that only serves
`dist/` (root `wrangler.toml`). `not_found_handling = "single-page-application"`
makes deep links like `/admin/users/:id` load `index.html`.

Both config files must stay `wrangler.toml`. Wrangler prefers a
`wrangler.json`/`wrangler.jsonc` in any parent directory over a `wrangler.toml`
in the current one, so a JSON config at the root would make `worker/` deploy
the frontend.

1. If `arczpng.com` already has DNS records pointing at Vercel (Cloudflare
   dashboard → `arczpng.com` → DNS), delete the `@` and `www` records first.
   Custom domains can't be attached while another record holds the name.
2. Cloudflare dashboard → Workers & Pages → Create → Import a repository (same repo):

   | Setting | Value |
   |---|---|
   | Project name | `threejs-portfolio-web` (must match `name` in the root `wrangler.toml`) |
   | Production branch | `main` |
   | Root directory | `/` |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler@4 deploy` |

   Builds installs the root `package.json` dependencies itself. Wrangler is not
   a root dependency, so the deploy command names a major version.
3. Add the Redirect Rule for `www` (see [Domains](#domains)).
4. Verify `https://arczpng.com` and a deep link such as `https://arczpng.com/homepage`.

Production builds call `https://api.arczpng.com` (`src/utils/api.js`). Set
`VITE_API_BASE_URL` as a build variable only to point somewhere else.

---

## Create an admin

D1 starts empty and signup always creates non-admin users. Sign up on the site,
then from `worker/`:

```bash
npx wrangler d1 execute DB --remote --command "UPDATE users SET is_admin = 1 WHERE username = '<you>'"
```

---

## Cutover checklist

1. Worker deployed, `/health` is OK.
2. `https://arczpng.com` loads from the frontend Worker and `https://www.arczpng.com` redirects to it.
3. In a browser: sign up, log in, reload (session persists), open the admin
   dashboard with an admin account, log out.
4. Existing users: password hashes were bcrypt in Postgres and still verify
   (`bcryptjs`), but D1 starts empty. Export the Postgres `users` table before
   Supabase is deleted if you want to keep those accounts, and import them
   into D1 with `wrangler d1 execute`. Skip if only the seeded guest matters.
5. Only after steps 1-4 pass, tear down the old stack.

---

## Teardown of the old stack

### Vercel

After the cutover checklist passes on Cloudflare: Vercel dashboard → the
project → Settings → Advanced → Delete Project. Also remove `arczpng.com` from
Vercel's Domains list if you added it there.

Destructive and not reversible. Do these after the cutover checklist passes,
and run them yourself. Check the project and region first.

### Google Cloud (Cloud Run service, secrets, built images)

```bash
gcloud config get-value project
gcloud run services list

gcloud run services delete threejs-portfolio-api --region us-central1
gcloud secrets delete JWT_SECRET
gcloud secrets delete DATABASE_URL

gcloud artifacts repositories list
gcloud artifacts repositories delete cloud-run-source-deploy --location us-central1
gcloud storage buckets list
```

`gcloud run deploy --source` created an Artifact Registry repository
(`cloud-run-source-deploy`) and a Cloud Build staging bucket
(`run-sources-<project>-<region>`). Those keep costing storage after the
service is gone, so delete them too after confirming nothing else uses them.

If the GCP project was created only for this app, deleting the whole project
removes everything at once and is the simplest option:

```bash
gcloud projects delete <project-id>
```

### Supabase

Back up first if you need the data:

```bash
pg_dump "<supabase connection string>" --table=users --data-only > users-backup.sql
```

Then in the Supabase dashboard: Project Settings, General, Delete project.

### Repository cleanup

- Delete `server/` (Go code, Dockerfile, docker-compose).
- Remove `DATABASE_URL`, `POSTGRES_DB` and the unused GitHub and session
  entries from the root `.env.local`.
- Delete `docs/backend-architecture.md` and `docs/phase2-backend.md`, or leave
  them marked historical.

---

## Learnings from the migration

- Cloud Run needed a Dockerfile, Secret Manager, Cloud Build and Artifact
  Registry, and left storage behind after the service was deleted. A Worker is
  one config file and one command.
- Free-tier scale-to-zero meant cold starts plus a Postgres connection on
  first request. Workers have no cold-start container and D1 is a binding, not
  a connection.
- Cross-site cookies are the main deployment risk with a split frontend and
  API. Put both on one registrable domain.
