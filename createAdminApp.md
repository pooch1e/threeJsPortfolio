# Plan: Admin frontend for Go backend

**Session ID:** ses_236d7c8aeffeh9DQdln2EIkEbq
**Created:** 4/26/2026, 10:39:09 AM
**Updated:** 4/26/2026, 10:42:06 AM

---

## User

plan - setting up an admin frontend for go backend. Can be a simple static react app - or react admin app. 

---

## Assistant (Plan · Claude Sonnet 4.6 · 79.2s)

**Tool: task**

**Input:**
```json
{
  "description": "Explore backend structure",
  "prompt": "Explore the codebase at /Users/joelkram/Documents/repos/threejsPortfolio. I need to understand: 1) The overall project structure, 2) Any existing Go backend - its API endpoints, routes, data models, and auth mechanism, 3) Any existing frontend setup. Return a concise summary of all findings including file paths and key details.",
  "subagent_type": "explore"
}
```

**Output:**
```
task_id: ses_236d7b88cffe3bR9bwNCD6qbVx (for resuming to continue this task if needed)

<task_result>
Here is a comprehensive summary of the entire codebase:

---

## Project Overview

This is a **Three.js / React portfolio application** with a **Go REST API backend** and a **PostgreSQL database**. The frontend showcases interactive 3D and shader demos, gated behind a login system.

---

## 1. Project Structure

```
/threejsPortfolio
├── index.html               # SPA entry point
├── package.json             # Frontend dependencies
├── vite.config.js           # Vite bundler config
├── tailwind.config.js       # Tailwind CSS config
├── postcss.config.js
├── eslint.config.js
├── .env.local               # Environment variables (VITE_API_BASE_URL, PORT, JWT_SECRET, DATABASE_URL, FRONTEND_URL)
├── src/                     # React frontend source
├── public/                  # Static assets
├── static/
├── dist/                    # Build output
├── world/                   # (additional 3D assets/scenes)
├── resources/
├── docs/
└── server/                  # Go backend
```

---

## 2. Go Backend (`/server`)

### Entry Points
- **`server/cmd/main.go`** — Loads `.env.local`, builds a `config` struct (address, JWT secret, DB DSN), opens the PostgreSQL connection, creates the `application` struct, and starts the HTTP server.
- **`server/cmd/api.go`** — Defines the `application` struct, `config` struct, `mount()` (router setup), and `run()` (HTTP server start).

### Framework & Dependencies
- **Router:** `go-chi/chi v5`
- **CORS:** `go-chi/cors`
- **Database driver:** `lib/pq` (PostgreSQL)
- **JWT:** `golang-jwt/jwt v5`
- **Password hashing:** `golang.org/x/crypto/bcrypt`
- **Env loading:** `joho/godotenv`

### API Routes (`server/cmd/api.go`)

| Method | Path | Auth Required | Handler | Description |
|--------|------|---------------|---------|-------------|
| `POST` | `/api/signup` | No | `SignupHandler` | Register a new user |
| `POST` | `/api/login` | No | `LoginHandler` | Authenticate and set session cookie |
| `GET` | `/api/me` | Yes | `MeHandler` | Return current user's profile |
| `POST` | `/api/logout` | Yes | `LogoutHandler` | Clear session cookie |

### Authentication Mechanism
- **Strategy:** `httpOnly` cookie-based JWT (cookie name: `"session"`).
- **Token:** HS256-signed JWT with claims `sub` (user UUID), `iat`, `exp` (1 hour expiry). Generated in `server/internal/utils/jwt.go`.
- **Middleware:** `server/internal/middleware/auth.go` — `RequireAuth(jwtSecret)` reads the `"session"` cookie, validates and parses the JWT, and injects `userID` into the request context via a typed context key (`UserIDKey`). Returns `401` if missing or invalid.
- **Environment switching:** `SameSite=Lax` + `Secure=false` in dev; `SameSite=None` + `Secure=true` in production (controlled by `APP_ENV=production`).
- **Password hashing:** bcrypt with `DefaultCost` (`server/internal/utils/validateSignup.go`).

### Data Models (`server/internal/models/user.go`)

**`User`**
| Field | Type | Notes |
|-------|------|-------|
| `ID` | `string` | UUID |
| `GithubID` | `string` | Optional, omitempty |
| `Name` | `string` | Username |
| `Email` | `string` | omitempty in JSON |
| `AvatarURL` | `string` | omitempty |
| `CreatedAt` | `time.Time` | |
| `UpdatedAt` | `time.Time` | |
| `Password_hash` | `[]byte` | Never serialized (`json:"-"`) |

**`NewUser`** — `{Username, Email, Password_hash}` (used for inserts only)

**`Session`** — `{ID, Token, UserId, ExpiresAt, CreatedAt}` (defined in models but sessions table exists in DB; JWT is used for auth in practice)

### Database Layer (`server/internal/repos/user.go`)
- `CheckUserExists(db, email)` — `SELECT EXISTS` by email
- `InsertNewUser(db, user)` — `INSERT INTO users ... RETURNING ...`
- `GetUserByID(db, id)` — `SELECT` by UUID
- `GetUserByUsername(db, username)` — `SELECT` by name (includes `password_hash` for login)

### Database Schema (`server/db/seed/seed.sql`)
- **`users`** table: `id (UUID PK)`, `github_id (TEXT UNIQUE)`, `name (TEXT NOT NULL)`, `email (TEXT NOT NULL UNIQUE)`, `avatar_url (TEXT)`, `created_at`, `updated_at`, `password_hash (TEXT)`
- **`sessions`** table: `id (UUID PK)`, `token (TEXT UNIQUE NOT NULL)`, `user_id (UUID FK → users.id CASCADE)`, `expires_at`, `created_at`

### Infrastructure
- **`server/docker-compose.yml`** — Postgres 16 container (`threejs_database`, user `threejs_user`, password `threejs_password`, host port `5433`)
- **`server/Makefile`** — `make docker-up/down`, `make db-create`, `make dev` (`go run cmd/*.go`)

### Input Validation (`server/internal/utils/validateSignup.go`)
- Username: lowercase alphanumeric only (`^[a-z0-9]+$`), forced to lowercase
- Email: standard regex format check
- Password: min 8 chars, requires lowercase + uppercase + digit + special char (`@$!%*?&`)

---

## 3. Frontend (`/src`)

### Tech Stack
- **Framework:** React 19 with JSX
- **Bundler:** Vite 7
- **Routing:** `react-router-dom v7`
- **State management:** Zustand v5 (with `persist` middleware → `localStorage` key `"user-storage"`)
- **3D rendering:** Three.js v0.180, custom GLSL shaders via `vite-plugin-glsl`
- **Animation:** GSAP 3
- **Creative coding:** p5.js v2
- **Forms:** `react-hook-form`
- **Styling:** Tailwind CSS v3, `@tailwindplus/elements`
- **Testing:** Vitest

### Routing (`src/App.jsx`)

| Path | Component | Auth | Notes |
|------|-----------|------|-------|
| `/` | `LoginPage` | Public | Eager loaded |
| `/signup` | `SignUpPage` | Public | Eager loaded |
| `/homepage` | `HomePage` | In layout | Lazy loaded |
| `/pointCloud` | `PointCloudPage` | In layout | Lazy loaded |
| `/animalPage` | `AnimalRenderPage` | In layout | Lazy loaded |
| `/shaders` | `ShaderPage` | In layout | Lazy loaded |
| `/sineWave` | `SineWavePage` | In layout | Lazy loaded |
| `/portalblend` | `PortalPage` | In layout | Lazy loaded |
| `/ascii` | `AsciiPage` | In layout | Lazy loaded |

All Three.js-heavy pages are **lazily loaded** via `React.lazy()` + `Suspense`.

### Session Persistence
- On app mount, `App.jsx` calls `GET /api/me` with credentials. If the session cookie is still valid, the returned `username` is stored in Zustand.
- Zustand store (`src/store/user.js`) persists `username` to `localStorage` and derives `isAuthenticated` from it.

### API Client (`src/utils/api.js`)
- Base URL: `VITE_API_BASE_URL` env var, defaults to `http://localhost:8080`
- All requests use `credentials: 'include'` to send the `httpOnly` session cookie cross-origin.

### Utility Files (`src/utils/`)
- `api.js` — Shared `apiClient` fetch wrapper
- `postLogin.js` — Login request helper
- `postLogout.js` — Logout request helper
- `postSignup.js` — Signup request helper
- `validateSession.js` — Session validation helper

### Layout
- `src/layout/MainLayout.jsx` — Wraps all portfolio pages (likely includes nav/header)
- `src/layout/HomeStyle.jsx` — Style wrapper for home page

### Components (`src/components/`)
- `ProjectCard.jsx`, `LoadingBar.jsx`, `DebugButton.jsx`, `ShaderSwitchListButton.jsx`

---

## Key Configuration Notes

- **Frontend dev server:** `http://localhost:5173` (Vite default)
- **Backend dev server:** `http://localhost:8080` (configurable via `PORT` env var)
- **CORS:** Strictly set to `FRONTEND_URL` env var (defaults to `http://localhost:5173`), with `AllowCredentials: true`
- **`.env.local`** at repo root is shared — the Go server loads it via `godotenv.Load("../.env.local")` from the `server/` directory; Vite auto-loads it for the frontend.
</task_result>
```

---

## Assistant (Plan · Claude Sonnet 4.6 · 77.2s)

Now I have a thorough picture of the codebase. Let me ask a few clarifying questions before finalizing the plan.

**Tool: question**

**Input:**
```json
{
  "questions": [
    {
      "question": "What should the admin panel be able to manage? (select all that apply)",
      "header": "Admin features",
      "multiple": true,
      "options": [
        {
          "label": "View/manage users",
          "description": "List, search, delete, or edit user accounts"
        },
        {
          "label": "Create/reset passwords",
          "description": "Admin-set passwords or send reset links"
        },
        {
          "label": "View sessions",
          "description": "See active sessions and revoke them"
        },
        {
          "label": "Site content/config",
          "description": "Manage portfolio content, settings, or feature flags"
        },
        {
          "label": "Analytics/stats",
          "description": "Basic usage stats, signups over time, etc."
        }
      ]
    },
    {
      "question": "How should admin authentication work?",
      "header": "Admin auth",
      "multiple": false,
      "options": [
        {
          "label": "Role on existing user (Recommended)",
          "description": "Add an `is_admin` flag to the users table; admins log in with the existing /api/login endpoint"
        },
        {
          "label": "Separate hardcoded admin credentials",
          "description": "A fixed admin username/password defined in .env, separate from user accounts"
        },
        {
          "label": "Separate admin user table",
          "description": "A dedicated admins table in the DB"
        }
      ]
    },
    {
      "question": "Where should the admin app live?",
      "header": "App location",
      "multiple": false,
      "options": [
        {
          "label": "Same repo, /admin route (Recommended)",
          "description": "A new /admin/* route in the existing Vite/React app — minimal setup overhead"
        },
        {
          "label": "Same repo, separate /admin folder",
          "description": "A standalone Vite app inside /admin — separate build, separate dev server"
        },
        {
          "label": "New separate repo",
          "description": "Completely separate project"
        }
      ]
    },
    {
      "question": "UI framework preference for the admin panel?",
      "header": "UI framework",
      "multiple": false,
      "options": [
        {
          "label": "react-admin (Recommended)",
          "description": "Purpose-built for CRUD admin UIs, works great with REST APIs — more features out of the box"
        },
        {
          "label": "Plain React + Tailwind",
          "description": "Custom UI using the existing Tailwind setup — more control, more work"
        },
        {
          "label": "shadcn/ui + Tailwind",
          "description": "Component library built on Radix UI — polished but still custom"
        }
      ]
    }
  ]
}
```

**Output:**
```
User has answered your questions: "What should the admin panel be able to manage? (select all that apply)"="View/manage users, Create/reset passwords", "How should admin authentication work?"="Role on existing user (Recommended)", "Where should the admin app live?"="Same repo, /admin route (Recommended)", "UI framework preference for the admin panel?"="react-admin (Recommended)". You can now continue with the user's answers in mind.
```

---

## Assistant (Plan · Claude Sonnet 4.6 · 20.5s)

Here is the full plan:

---

## Plan: Admin Frontend + Backend

### Overview
Add an `/admin` route to the existing Vite/React app using **react-admin**, backed by new admin-gated Go API endpoints. Authentication uses an `is_admin` boolean on the existing `users` table.

---

### Phase 1 — Backend: DB & Auth

**1.1 — DB migration**
- Add `is_admin BOOLEAN NOT NULL DEFAULT false` column to the `users` table.
- Update `server/db/seed/seed.sql` to include the column.

**1.2 — Update User model**
- Add `IsAdmin bool` field to `server/internal/models/user.go`.
- Update all `SELECT` queries in `server/internal/repos/user.go` to include `is_admin`.

**1.3 — Admin middleware**
- Create `server/internal/middleware/requireAdmin.go`.
- Reads `userID` from context (set by existing `RequireAuth`), fetches user, checks `is_admin`, returns `403` if false.

**1.4 — New admin API endpoints**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/users` | List all users (paginated) |
| `GET` | `/api/admin/users/{id}` | Get single user |
| `PUT` | `/api/admin/users/{id}` | Update user (name, email, is_admin) |
| `DELETE` | `/api/admin/users/{id}` | Delete user |
| `POST` | `/api/admin/users/{id}/reset-password` | Set new password for a user |

All routes wrapped in `RequireAuth` + `RequireAdmin` middleware chain.

- New handler file: `server/cmd/adminHandlers.go`
- New repo functions: `ListUsers`, `UpdateUser`, `DeleteUser`, `UpdatePasswordHash` in `server/internal/repos/user.go`

---

### Phase 2 — Frontend: react-admin Integration

**2.1 — Install dependency**
```
npm install react-admin
```

**2.2 — Custom data provider**
- Create `src/admin/dataProvider.js` — translates react-admin resource calls (`getList`, `getOne`, `update`, `delete`, `create`) to the Go REST API above.
- Uses existing `apiClient` from `src/utils/api.js` (preserves `credentials: 'include'`).

**2.3 — Custom auth provider**
- Create `src/admin/authProvider.js` — maps react-admin's `login`, `logout`, `checkAuth`, `getIdentity` to the existing `/api/login`, `/api/logout`, `/api/me` endpoints.
- `checkAuth` checks the `is_admin` flag from `/api/me`; rejects if not admin.

**2.4 — Admin app component**
- Create `src/admin/AdminApp.jsx` — a self-contained `<Admin>` component with the custom providers and a `<Resource name="users" />` with list, edit, and show views.

**2.5 — Route wiring**
- Add `/admin/*` route in `src/App.jsx` that lazy-loads `AdminApp`.
- This route should **not** be wrapped in the existing `MainLayout` (admin has its own react-admin layout).

---

### Phase 3 — User Management UI

- **User List**: table with columns: ID, name, email, is_admin, created_at; with search/filter.
- **User Edit**: form to update name, email, is_admin toggle.
- **Delete**: with confirmation.
- **Reset Password**: custom action button on the edit page that POSTs to `/api/admin/users/{id}/reset-password` with a new password input.

---

### File Changes Summary

| File | Action |
|------|--------|
| `server/db/seed/seed.sql` | Add `is_admin` column |
| `server/internal/models/user.go` | Add `IsAdmin` field |
| `server/internal/repos/user.go` | Add `ListUsers`, `UpdateUser`, `DeleteUser`, `UpdatePasswordHash`; update SELECT queries |
| `server/internal/middleware/requireAdmin.go` | New file |
| `server/cmd/adminHandlers.go` | New file |
| `server/cmd/api.go` | Register `/api/admin/*` routes |
| `src/admin/dataProvider.js` | New file |
| `src/admin/authProvider.js` | New file |
| `src/admin/AdminApp.jsx` | New file |
| `src/App.jsx` | Add `/admin/*` lazy route |
| `package.json` | Add `react-admin` |

---

### Open Questions Before Implementation

1. **Password reset UX**: should the admin type in the new plaintext password, or should it be auto-generated and displayed once?
2. **DB migration strategy**: do you want a proper migration file (e.g. using `golang-migrate`) or just a manual `ALTER TABLE` SQL snippet you run once?
3. **CORS**: the admin frontend will be served from the same origin as the portfolio (`/admin` route), so no CORS changes needed — does that sound right?

---

