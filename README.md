# Three.js Portfolio

A full-stack creative portfolio: a React + Three.js frontend hosting a
collection of interactive WebGL scenes and shader experiments, backed by
a Go REST API for authentication and an admin dashboard. Built as a
demonstration piece spanning real-time 3D graphics, full-stack web
architecture, and cloud deployment.

**Live:** [three-js-portfolio](https://playgroundtest.fyi)

---

## What this project demonstrates

| Domain | Where |
|---|---|
| **3D / WebGL graphics** | Custom Three.js scenes, GLSL shaders, GPU particle systems, post-processing, procedural geometry — see [Scenes](#scenes) |
| **Frontend architecture** | Layered `Experience → World → Objects` pattern for managing many independent Three.js scenes inside one React app without them fighting over the render loop, GPU resources, or lifecycle |
| **Full-stack application design** | Go REST API with a clean handler/repository split, stateless JWT auth, PostgreSQL — see [Backend](#backend-go) |
| **State & auth flows** | Protected/public/admin route guards in React Router, HttpOnly cookie sessions, role-based access (admin dashboard) |
| **Cloud deployment** | Three independently deployed services (Vercel, Google Cloud Run, Supabase) wired together via environment configuration, CORS, and TLS — see [Deployment](#deployment--infrastructure) |
| **Testing** | Go unit + Docker-backed integration tests for the backend; Vitest for frontend logic |

---

## Architecture

```
React (Vite)  →  world/*  (Three.js scenes)  →  Go REST API  →  PostgreSQL (Supabase)
   Vercel              client-side               Cloud Run        managed Postgres
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

**Backend:** Go 1.25 + Chi router, no ORM (raw `database/sql`).
Handlers use a closure/dependency-injection pattern — an outer function
captures its dependencies (a `UserRepository` interface, never a raw
`*sql.DB`) and returns an `http.HandlerFunc`. Auth is stateless JWT
(HS256, 1hr) carried in an HttpOnly cookie, with `SameSite=None; Secure`
in production for cross-origin auth between the Vercel frontend and the
Cloud Run API.

Full write-ups: [docs/architecture.md](docs/architecture.md) (frontend)
and [docs/backend-architecture.md](docs/backend-architecture.md) (backend).

---

## Scenes

Each folder under `world/` is a self-contained Three.js experience,
dynamically routed via `/experience/:slug`:

- **`animalWorld`** — GLTF model loading, environment/lighting setup (Fox, Rat)
- **`portalWorld`** — baked lighting, custom portal shader, Draco-compressed GLTF
- **`shaderTestWorld`** — a suite of standalone shader demos: procedural terrain, GPU particle flow fields, fireworks, galaxy, coffee smoke, wobbly sphere, hologram, halftone, post-processing pipeline, and more
- **`flowerWorld`** — GPU particle simulation driving a text/point-cloud effect
- **`forestWorld`**, **`sineWorld`**, **`pointCloudWorld`**, **`asciiWorld`**, **`rectPerception`** — further shader and procedural-geometry experiments

A debug panel (lil-gui) is available on any scene via `?debug=true` for
live-tweaking uniforms and parameters.

---

## Backend (Go)

- Go 1.25, Chi v5 router, PostgreSQL 16
- Stateless JWT sessions, HttpOnly + `Secure` cookies
- Handlers depend on interfaces (`UserRepository`), not concrete DB types — enables the Docker-backed integration test suite to run against a real Postgres without mocking the DB
- Consistent JSON error envelope (`{"error": "..."}`), sentinel errors (`ErrNotFound`) checked via `errors.Is`
- Admin endpoints (list/update/delete users, password reset) gated behind an `is_admin` claim, surfaced in a React-admin-style dashboard on the frontend

See [docs/backend-architecture.md](docs/backend-architecture.md) and
[docs/phase2-backend.md](docs/phase2-backend.md) (auth flow walkthrough).

---

## Deployment & infrastructure

Three independently managed services, each doing one job:

| Layer | Service | Why |
|---|---|---|
| Frontend | **Vercel** | Auto-deploys on push to `main`, zero-config Vite build |
| Backend | **Google Cloud Run** | Scale-to-zero, Docker-native, free tier at this traffic level |
| Database | **Supabase** | Managed Postgres, free tier with no expiry |

The backend ships as a multi-stage Docker build
([`server/Dockerfile`](server/Dockerfile)), built and deployed straight
from source via Cloud Build (`gcloud run deploy --source .`) — no manual
image push step. Secrets (`JWT_SECRET`, `DATABASE_URL`) live in Google
Secret Manager, never in the image or the repo. CORS on the API is
locked to a single exact origin (the Vercel domain) — no wildcards,
required for cookie-based cross-origin auth.

Deploys are triggered by pushing to `main` (Vercel) or by an explicit
`gcloud run deploy` (Cloud Run) — there's no GitHub Actions pipeline
gating either on the test suite yet; that's the next piece to add if
this were taken further toward a "real" CI/CD setup.

Full runbook: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Local development

```bash
npm run dev                              # frontend only (port 5173)
cd server && make docker-up && make dev  # backend only (port 8080, local Postgres via Docker)
npm run full-stack                       # everything together
npm run full-stack-down                  # stop everything
```

`.env.local` at the repo root holds local config (not committed):

```
PORT=8080
DATABASE_URL=postgres://threejs_user:threejs_password@localhost:5433/threejs_database?sslmode=disable
JWT_SECRET=<any string, local only>
FRONTEND_URL=http://localhost:5173
```

## Testing

```bash
npm run test                                    # Vitest — frontend
cd server && go test ./...                      # Go unit tests
cd server && go test -tags integration ./cmd/    # integration tests (requires Docker)
```

## Linting

```bash
npm run lint
```

---

## Tech stack

**Frontend:** React 19, React Router 7, Vite 7, Tailwind CSS 3.4, Three.js 0.180, GSAP, Zustand, GLSL (via `vite-plugin-glsl`) — no TypeScript, pure JSX.

**Backend:** Go 1.25, Chi v5, PostgreSQL 16, `lib/pq`, `golang-jwt`.

**Infra:** Vercel, Google Cloud Run, Google Secret Manager, Supabase.

---

## Key docs

| Doc | Contents |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Three.js + React frontend architecture |
| [docs/backend-architecture.md](docs/backend-architecture.md) | Go backend reference |
| [docs/phase2-backend.md](docs/phase2-backend.md) | Auth flow walkthrough |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel + Cloud Run + Supabase deployment runbook |
| [docs/admin-plan.md](docs/admin-plan.md) | Admin dashboard plan (react-admin + Go endpoints) |


superficial edit - need to add better gcloud config instructions to understand deployment flow
