# Claude Code — threeJsPortfolio

Creative portfolio: React + Three.js frontend with a Hono REST API on Cloudflare Workers (D1). The earlier Go backend in `server/` is deprecated and kept for reference.

---

## Running locally

```bash
npm run dev                                   # frontend only (port 5173)
cd worker && npm install
npm run db:migrate && npm run db:seed         # local D1
npm run dev                                   # API (port 8787)
npm run lint                                  # ESLint
cd worker && npm test                         # Worker tests (workerd, in-memory D1)
```

The `server` / `full-stack` scripts in the root `package.json` still target the deprecated Go server.

---

## Project layout

```
src/          React app (pages, hooks, components, store, utils)
world/        Three.js world implementations (one folder per scene)
worker/       Hono API on Cloudflare Workers + D1
server/       DEPRECATED Go REST API (historical, learning project)
docs/         Architecture and deployment docs
static/       GLTF models, HDR textures, videos
```

---

## Code comments

- No single-line comments explaining what a piece of code does. Well-named identifiers should make that self-evident.
- Every file gets a JSDoc-style header comment at the top summarizing what the file does:
  ```js
  /**
   * ComputerPage — renders the Three.js computer scene with video texture,
   * presentation controls, and GSAP-driven zoom transitions.
   */
  ```
- Inline comments are only acceptable to explain non-obvious *why* (a workaround, a hidden constraint, a subtle invariant) — never *what*.

---

## Frontend (React + Three.js)

- React 19, React Router 7, Vite 7, Tailwind CSS 3.4
- Three.js 0.180, p5.js 2.2, GSAP, Zustand
- **No TypeScript** — pure JSX
- GLSL shaders imported via `vite-plugin-glsl`

**Architecture:** `src/main.jsx` → `App.jsx` (routes) → page → `useWorld.jsx` hook → `Experience` class → `World` → objects/components

Full details: [docs/architecture.md](docs/architecture.md)

**Three.js pattern:** Every scene follows `Experience → World → Objects`. Core utilities (`Time`, `Sizes`, `Mouse`, `Debug`, `Resources`, `EventEmitter`) live in `world/utils/`.

**In progress:** `world/computer/` — ComputerPage with video texture, presentation controls, GSAP zoom. See [world/computer/PLAN.md](world/computer/PLAN.md).

---

## Backend (Cloudflare Worker)

- Hono 4, TypeScript, Cloudflare D1 (SQLite) bound as `DB`, zod validation
- Stateless JWT (HS256, 1hr) in HttpOnly cookie named `session`; `bcryptjs` hashing
- Feature folders under `worker/features/` (`*.routes.ts`, `*.queries.ts`, `*.schemas.ts`); queries take `db` as an argument
- Errors always JSON `{"error": "..."}` via one `app.onError`
- Production cookies: `SameSite=None + Secure=true` when `APP_ENV=production`
- CORS: exact `FRONTEND_URL` origin only (no wildcards — required for credentials)

Plan and layout: [worker/PLAN.md](worker/PLAN.md). Deployment: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

**Deprecated Go server (`server/`):** Go + Chi + Postgres on Cloud Run, built to learn Go and replaced by the Worker. Don't extend it. Why: [docs/adr/0002-move-to-cloudflare.md](docs/adr/0002-move-to-cloudflare.md).

---

## Environment

Secrets are never committed. Worker local config goes in `worker/.dev.vars` (gitignored):

```
JWT_SECRET=<any string, local only>
APP_ENV=development
FRONTEND_URL=http://localhost:5173
```

In production `JWT_SECRET` is a Cloudflare Worker Secret; `APP_ENV` and `FRONTEND_URL` come from `[vars]` in `worker/wrangler.toml`.

---

## Key docs

| Doc | Contents |
|-----|----------|
| [docs/architecture.md](docs/architecture.md) | Three.js + React frontend architecture |
| [worker/PLAN.md](worker/PLAN.md) | Worker backend plan and build order |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Cloudflare Workers + D1 deployment |
| [docs/adr/0002-move-to-cloudflare.md](docs/adr/0002-move-to-cloudflare.md) | Why Go/Cloud Run was replaced by Cloudflare |
| [docs/admin-frontend-epic.md](docs/admin-frontend-epic.md) | Admin frontend epic (API contract still valid) |
| [world/computer/PLAN.md](world/computer/PLAN.md) | Computer scene implementation plan |
| Historical (Go, deprecated) | [docs/backend-architecture.md](docs/backend-architecture.md), [docs/phase2-backend.md](docs/phase2-backend.md), [docs/admin-plan.md](docs/admin-plan.md), [docs/admin-endpoints-review.md](docs/admin-endpoints-review.md) |
