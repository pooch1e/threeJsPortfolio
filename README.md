# Three.js Portfolio

A full-stack creative portfolio: a React + Three.js frontend hosting a
collection of interactive WebGL scenes and shader experiments, backed by
a Cloudflare Workers REST API (Hono + D1) for authentication and an admin dashboard. Built as a
demonstration piece spanning real-time 3D graphics, full-stack web
architecture, and cloud deployment.

**Live:** [arczpng.com](https://arczpng.com) · API at `api.arczpng.com`

---

## What this project demonstrates

| Domain | Where |
|---|---|
| **3D / WebGL graphics** | Custom Three.js scenes, GLSL shaders, GPU particle systems, post-processing, procedural geometry — see [Scenes](#scenes) |
| **Frontend architecture** | Layered `Experience → World → Objects` pattern for managing many independent Three.js scenes inside one React app without them fighting over the render loop, GPU resources, or lifecycle |
| **Full-stack application design** | Hono REST API on Cloudflare Workers with a feature-folder layout (routes / queries / schemas), stateless JWT auth, D1 (SQLite) — see [Backend](#backend-cloudflare-worker) |
| **State & auth flows** | Protected/public/admin route guards in React Router, HttpOnly cookie sessions, role-based access (admin dashboard) |
| **Cloud deployment** | Two Cloudflare Workers from one repo — static frontend at `arczpng.com`, API + D1 at `api.arczpng.com` — wired together via CORS and same-site cookies, deployed from Git — see [Deployment](#deployment--infrastructure) |
| **Testing** | Vitest inside the real Workers runtime (workerd) against an in-memory D1 for the backend, no mocks and no Docker; Vitest for frontend logic |

---

## Architecture

```
React (Vite)  →  world/*  (Three.js scenes)  →  Hono API  →  D1 (SQLite)
   Cloudflare Workers  client-side              Cloudflare Workers
```

**Frontend:** `src/main.jsx` → `App.jsx` (routes, auth guards) → page →
`useWorld.jsx` hook → an `Experience` class → a `World` → its objects.
Every scene follows the same `Experience → World → Objects` shape, with
shared core utilities (`Time`, `Sizes`, `Mouse`, `Debug`, `Resources`,
`EventEmitter`) in `world/utils/` — this is what lets ~15 independent
WebGL scenes coexist in one SPA without duplicating render-loop or
resource-loading logic.

Scenes extend `BaseExperience`, customising it through hooks
(`createWorld`, `createResources`, `cameraOptions`, `setupCamera`,
`setupUtils`) rather than reimplementing setup. Scene objects take the
`experience` as their single dependency and read one level deep
(`experience.scene`, `experience.debug`) — never reaching through
another object — so what a file needs is visible in the first few lines
of its constructor.

**Backend:** Hono on Cloudflare Workers, code in `worker/`. Each feature
(`auth`, `users`) is a folder of routes, query functions and zod schemas.
Query functions take the D1 binding as an argument and run raw SQL — no ORM
and no classes — so tests call them directly against a real database. Auth
is stateless JWT (HS256, 1hr) carried in an HttpOnly cookie, with
`SameSite=None; Secure` in production for cross-origin auth between the
frontend (`arczpng.com`) and the API (`api.arczpng.com`).

Full write-up: [docs/architecture.md](docs/architecture.md) (frontend). The
backend plan and build order live in [worker/PLAN.md](worker/PLAN.md); the
Go-era reference in [docs/backend-architecture.md](docs/backend-architecture.md)
is historical.

---

## Scenes

Each folder under `world/` is a self-contained Three.js experience,
dynamically routed via `/experience/:slug`:

- **`animalWorld`** — GLTF model loading, environment/lighting setup (Fox, Rat)
- **`portalWorld`** — baked lighting, custom portal shader, Draco-compressed GLTF
- **`shaderTestWorld`** — a suite of standalone shader demos: procedural terrain, GPU particle flow fields, fireworks, galaxy, coffee smoke, wobbly sphere, hologram, halftone, post-processing pipeline, and more
- **`flowerWorld`** — GPU particle simulation driving a text/point-cloud effect
- **`tileFieldWorld`**, **`sineWorld`**, **`pointCloudWorld`**, **`asciiWorld`**, **`rectPerception`** — further shader and procedural-geometry experiments

A debug panel (lil-gui) is available on any scene via `?debug=true` for
live-tweaking uniforms and parameters.

### Audio-reactive scenes

Any scene can opt into a music track and drive its visuals from it. A scene
declares what it wants in one hook — a smoothed `level` signal for visuals that
should breathe with the music, plus named **triggers** that fire the frame a
frequency band crosses a threshold, for visuals that should step in time with
it. Triggers are independent, so several parts of a scene can react to
different parts of the mix at once.

```js
audioOptions() {
  return {
    path: "/static/audio/Principle.m4a",
    triggers: {
      beat:  { band: [2000, 8000], threshold: 0.35, holdMs: 120 },
      pulse: { band: [60, 250],    threshold: 0.55, holdMs: 300 },
    },
  };
}
```

Bands are tuned live rather than guessed: `?debug=true` adds a spectrum canvas
showing each trigger's band, threshold and level drawn over the running FFT.
`world/rectPerception` uses two concurrent triggers to sweep colour through its
ribbons. Full guide: [docs/world/audio.md](docs/world/audio.md).

---

## Backend (Cloudflare Worker)

- Hono 4 on Cloudflare Workers, TypeScript, D1 (SQLite) via the `DB` binding
- Stateless JWT sessions, HttpOnly cookie named `session`, `SameSite=None; Secure` when `APP_ENV=production`
- `bcryptjs` for password hashing, so hashes created by the old Go server still verify
- Routes: `/health`, `/api/signup`, `/api/login`, `/api/logout`, `/api/me`, and `/api/admin/users…` (list, get, update, delete, password reset) gated by an `is_admin` check
- Consistent JSON error envelope (`{"error": "..."}`) produced by one `app.onError`, using an `AppError` class with an HTTP status
- Schema lives in `worker/migrations/` and is applied identically to local dev, tests and production

### History: Go + Cloud Run + Supabase

The API started as a Go (Chi, `database/sql`) service on Google Cloud Run
with Postgres on Supabase. It was rewritten as a Worker to cut the number of
moving parts from three services to two, remove cold starts, and keep the
whole stack in one language. The Go code in `server/` is kept only until the
cutover is verified, then deleted.

---

## Deployment & infrastructure

| Layer | Service | Why |
|---|---|---|
| Frontend | **Cloudflare Workers (static assets)** | `dist/` served at `arczpng.com`, SPA fallback for React Router; root `wrangler.toml` |
| API + database | **Cloudflare Workers + D1** | Hono at `api.arczpng.com`, no cold starts, free tier is ample at this traffic; `worker/wrangler.toml` |

Both Workers deploy through Workers Builds on every push to `main`: the frontend
from the repo root (`npm run build`), the API from `worker/` (`npm test`, then
`wrangler deploy`). CORS is locked to one exact origin, `https://arczpng.com`
(no wildcards, required for cookie auth). Both hosts share the `arczpng.com`
registrable domain, so the session cookie stays first-party.

The API build runs the Worker test suite and stops the deploy if it fails.

Full runbook, including teardown of the old GCP and Supabase resources:
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Local development

```bash
npm run dev                          # frontend (port 5173)
cd worker && npm install
npm run db:migrate && npm run db:seed  # create and seed the local D1 database
npm run dev                          # API on port 8787
```

`worker/.dev.vars` (gitignored) holds local Worker config:

```
JWT_SECRET=<any string, local only>
APP_ENV=development
FRONTEND_URL=http://localhost:5173
```

The frontend calls `http://localhost:8787` in dev and `https://api.arczpng.com` in production builds. Set `VITE_API_BASE_URL` to override either. The Worker only accepts cross-origin requests from `FRONTEND_URL`.

## Testing

```bash
npm run test               # Vitest — frontend
cd worker && npm test      # Worker tests, run inside workerd against in-memory D1
```

Worker test details: [worker/__tests__/README.md](worker/__tests__/README.md).

## Linting

```bash
npm run lint
```

---

## Tech stack

**Frontend:** React 19, React Router 7, Vite 7, Tailwind CSS 3.4, Three.js 0.180, GSAP, Zustand, GLSL (via `vite-plugin-glsl`) — no TypeScript, pure JSX.

**Backend:** Hono 4, Cloudflare Workers, D1 (SQLite), zod, `bcryptjs`, Vitest + `@cloudflare/vitest-plugin`, TypeScript.

**Infra:** Cloudflare Workers (frontend + API), Cloudflare D1.

---

## Key docs

| Doc | Contents |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Three.js + React frontend architecture |
| [docs/world/audio.md](docs/world/audio.md) | Driving scene visuals from music — level, band triggers, analysis EQ, spectrum tuning panel |
| [worker/PLAN.md](worker/PLAN.md) | Worker backend build order |
| [worker/__tests__/README.md](worker/__tests__/README.md) | How the Worker tests run |
| [docs/backend-architecture.md](docs/backend-architecture.md) | Historical Go backend reference |
| [docs/phase2-backend.md](docs/phase2-backend.md) | Auth flow walkthrough (Go-era) |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Cloudflare Workers deployment (frontend + API) and old-stack teardown |
| [docs/admin-plan.md](docs/admin-plan.md) | Admin dashboard plan (react-admin + API endpoints) |

---

## Learnings

- **Match the platform to the size of the app.** Cloud Run + Supabase meant a Dockerfile, Secret Manager, Cloud Build and a separate database vendor for a handful of tables. A Worker with D1 is one config file and one deploy command.
- **SQLite has fewer types, so the app owns more.** IDs are UUID text generated by `crypto.randomUUID`, booleans are `0/1` integers, timestamps are ISO-8601 text. `updated_at` is set explicitly in each UPDATE instead of by a trigger, because `RETURNING` does not see values an AFTER trigger writes.
- **Test against the real runtime.** Running Vitest inside workerd with an in-memory D1 and the real migrations catches schema and binding mistakes that mocks would hide, and needs no Docker.
- **Generic types on SQL don't check the SQL.** `sql<{ username: string }[]>` compiled while the query selected a different column set, and a lookup filtering on `name` while signup wrote `username` returned no rows. Assert on results in tests, don't just log them.
- **Cross-origin cookies need `SameSite=None; Secure`, and CORS needs an exact origin.** With `credentials: true` a wildcard origin is rejected.
- **Third-party cookie rules are the next risk.** Safari and some Chrome configurations block cookies when the API is on a different site (`*.workers.dev`) than the frontend. Serving the API from a subdomain of the frontend's domain makes it same-site.
- **A dangling `import` is a syntax error.** One half-typed line in `index.ts` produced a build warning that looked unrelated to the failing test.
