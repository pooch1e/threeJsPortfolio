# Claude Code — threeJsPortfolio

Creative portfolio: React + Three.js frontend with a Go REST API backend.

---

## Running locally

```bash
npm run dev              # frontend only (port 5173)
cd server && make docker-up && make dev  # backend only (port 8080)
npm run full-stack       # everything together
npm run full-stack-down  # stop everything
npm run lint             # ESLint
```

Integration tests (requires Docker):
```bash
cd server && go test -tags integration ./cmd/
```

---

## Project layout

```
src/          React app (pages, hooks, components, store, utils)
world/        Three.js world implementations (one folder per scene)
server/       Go REST API
docs/         Architecture and deployment docs
static/       GLTF models, HDR textures, videos
```

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

## Backend (Go)

- Go 1.25.1, Chi v5, PostgreSQL 16 (Docker, port 5433)
- Stateless JWT (HS256, 1hr) in HttpOnly cookie named `session`
- No ORM — raw `database/sql`

**Entry:** `server/cmd/main.go` + `server/cmd/api.go`

**Conventions:**
- Handlers use closure/DI pattern — outer fn captures deps, returns `http.HandlerFunc`
- All handlers depend on `UserRepository` interface, not `*sql.DB`
- Errors always JSON: `{"error": "..."}` via `json.WriteError`
- `ErrNotFound` sentinel — callers use `errors.Is(err, repos.ErrNotFound)`
- Context key for userID is a typed `contextKey` string
- Production cookies: `SameSite=None + Secure=true` when `APP_ENV=production`
- CORS: exact `FRONTEND_URL` origin only (no wildcards — required for `AllowCredentials: true`)

Full details: [docs/backend-architecture.md](docs/backend-architecture.md)

---

## Environment

`.env.local` at the repo root (not committed). Required variables:

```
PORT=8080
DATABASE_URL=postgres://threejs_user:threejs_password@localhost:5433/threejs_database?sslmode=disable
JWT_SECRET=<long random string>
FRONTEND_URL=http://localhost:5173
```

---

## Key docs

| Doc | Contents |
|-----|----------|
| [docs/architecture.md](docs/architecture.md) | Three.js + p5.js frontend architecture |
| [docs/backend-architecture.md](docs/backend-architecture.md) | Go backend reference |
| [docs/phase2-backend.md](docs/phase2-backend.md) | Auth flow walkthrough (Go learning notes) |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Cloudflare Pages + Fly.io + Supabase |
| [docs/admin-plan.md](docs/admin-plan.md) | Admin frontend plan (react-admin + Go endpoints) |
| [world/computer/PLAN.md](world/computer/PLAN.md) | Computer scene implementation plan |
