# Backend Architecture

A Go REST API serving the ThreeJS Portfolio frontend. It handles user auth via HttpOnly JWT cookies, backed by PostgreSQL running in Docker.

---

## Directory Structure

```
server/
├── cmd/
│   ├── main.go              # Entry point: load env, connect DB, start server
│   ├── api.go               # application struct, router, global middleware
│   └── integration_test.go  # end-to-end tests (build tag: integration)
├── db/
│   └── seed/
│       ├── create-db.sql    # DROP/CREATE DATABASE
│       └── seed.sql         # users + sessions tables, uuid-ossp extension
├── internal/
│   ├── handlers/            # HTTP handlers (signup, login, me, logout)
│   ├── middleware/          # Auth and admin middleware
│   ├── models/              # Go structs (User, NewUser, Session)
│   ├── repos/               # Repository interface + PostgreSQL implementation
│   ├── json/                # WriteJson / WriteError helpers
│   └── utils/               # JWT generation/parsing, password hashing, validation
├── docker-compose.yml
├── go.mod
├── go.sum
└── Makefile
```

---

## Tech Stack

| Component | Choice | Notes |
|-----------|--------|-------|
| Language | Go 1.25.1 | |
| Router | chi v5.2.5 | lightweight, idiomatic |
| Database | PostgreSQL 16 | Docker container, port 5433 |
| DB driver | lib/pq v1.12.0 | raw `database/sql` — no ORM |
| Auth | JWT (HS256) | HttpOnly cookie, 1-hour expiry |
| Password hashing | bcrypt | `golang.org/x/crypto` |
| Env | godotenv | loads `.env.local` at startup |
| Integration tests | testcontainers-go | spins up a real Postgres container |

---

## Application Bootstrap

`cmd/main.go` wires everything together:

1. `godotenv.Load(".env.local")` — populate env vars
2. `sql.Open` + `db.Ping` — open and verify PostgreSQL connection
3. `repos.NewPostgresUserRepo(db)` — create the data-access layer
4. `app.mount()` — build the Chi router with all routes and middleware
5. `http.Server.ListenAndServe` — start serving with graceful shutdown (10s drain on SIGINT/SIGTERM)

The central dependency container is the `application` struct in `cmd/api.go`:

```go
type application struct {
    config   config            // adr, jwtSecret, db DSN, frontendURL, ...
    userRepo repos.UserRepository
}
```

HTTP server timeouts: `WriteTimeout` 30s · `ReadTimeout` 10s · `IdleTimeout` 60s · per-route `middleware.Timeout` 60s.

---

## Router & Global Middleware

Chi router with middleware applied in order:

| # | Middleware | Purpose |
|---|-----------|---------|
| 1 | `middleware.RequestID` | Attach unique request ID |
| 2 | `middleware.RealIP` | Extract real IP from proxy headers |
| 3 | `middleware.Logger` | Structured request logging |
| 4 | `middleware.Recoverer` | Panic recovery |
| 5 | `cors.Handler` | CORS (exact origin, `AllowCredentials: true`) |
| 6 | `middleware.Timeout(60s)` | Per-request timeout |

**CORS note:** `AllowedOrigins` is set to the exact value of `FRONTEND_URL` — wildcards are forbidden when `AllowCredentials: true` (browser spec requirement for cookies to work cross-origin).

---

## API Routes

| Method | Path | Auth | Handler |
|--------|------|------|---------|
| `GET` | `/` | No | `"hi"` |
| `GET` | `/health` | No | `{"status":"ok"}` |
| `POST` | `/api/signup` | No | `SignupHandler` |
| `POST` | `/api/login` | No | `LoginHandler` |
| `GET` | `/api/me` | `RequireAuth` | `MeHandler` |
| `POST` | `/api/logout` | `RequireAuth` | `LogoutHandler` |
| _(admin group)_ | — | `RequireAuth` + `RequireAdmin` | _(no routes yet)_ |

Protected routes live inside a `r.Group` that applies `RequireAuth` only to routes declared within it.

---

## Handlers (`internal/handlers/`)

All handlers use the **closure / dependency injection** pattern:

```go
// Outer function runs ONCE at startup — captures dependencies in a closure.
func LoginHandler(repo repos.UserRepository, jwtSecret string) http.HandlerFunc {
    // Inner function runs on EVERY request.
    return func(w http.ResponseWriter, r *http.Request) { ... }
}
```

### SignupHandler
1. Decode `{username, email, password}` JSON body
2. Validate: username (lowercase alphanumeric), email (regex), password (complexity)
3. `repo.CheckUserExists` — reject duplicate email
4. `bcrypt.GenerateFromPassword` — hash password
5. `repo.InsertNewUser` — persist user
6. Return `201 Created` with the created user object

### LoginHandler
1. Decode `{username, password}`
2. `repo.GetUserByUsername` — fetch user (includes `password_hash`)
3. `bcrypt.CompareHashAndPassword` — verify password
4. `utils.GenerateJwtToken` — HS256 JWT, 1-hour expiry, `sub` = userID
5. `http.SetCookie` — `session` cookie, `HttpOnly: true`
   - Dev: `SameSite=Lax`, `Secure=false`
   - Production (`APP_ENV=production`): `SameSite=None`, `Secure=true`
6. Return `200 OK` with `{"username": "..."}`

### MeHandler
1. Read `userID` from request context (placed there by `RequireAuth`)
2. `repo.GetUserByID` — fetch user (no `password_hash` selected)
3. Return `200 OK` with `{"username": "..."}`

### LogoutHandler
1. Overwrite `session` cookie: `Value=""`, `Expires=Unix(0,0)`, `MaxAge=-1`
2. Return `200 OK`

Both `Expires` (legacy) and `MaxAge` (modern) are set for full browser compatibility.

---

## Middleware (`internal/middleware/`)

### RequireAuth

```go
func RequireAuth(jwtSecret string) func(http.Handler) http.Handler
```

- Reads `session` cookie
- Parses and validates JWT via `utils.ParseJwtToken`
  - Explicitly checks signing method to prevent `alg:none` attacks
- On success: stores `userID` in request context using a typed key (`contextKey("userID")`)
- On failure: `401 Unauthorized`, stops the chain

The typed context key prevents key collisions with other packages:
```go
type contextKey string
const UserIDKey contextKey = "userID"
```

### RequireAdmin

```go
func RequireAdmin(repo UserRepository) func(http.Handler) http.Handler
```

- Reads `userID` from context (requires `RequireAuth` first)
- Fetches user from DB, checks `user.IsAdmin`
- `403 Forbidden` if not admin, `401` if user not found

---

## Data Access Layer (`internal/repos/`)

Handlers depend on the `UserRepository` **interface**, not `*sql.DB` directly. This enables mock-based unit testing without a real database.

```go
type UserRepository interface {
    CheckUserExists(email string) (bool, error)
    InsertNewUser(user models.NewUser) (*models.User, error)
    GetUserByID(id string) (*models.User, error)
    GetUserByUsername(username string) (*models.User, error)
}
```

`PostgresUserRepo` is the production implementation using raw SQL with `database/sql`.

Key SQL decisions:
- `GetUserByID` — does **not** select `password_hash` (no reason to load it for profile display)
- `GetUserByUsername` — **does** select `password_hash` (needed for bcrypt comparison at login)
- `ErrNotFound` sentinel — callers use `errors.Is(err, repos.ErrNotFound)` to distinguish missing records from DB failures

---

## Models (`internal/models/user.go`)

```go
type User struct {
    ID        string    `json:"id"`
    GithubID  string    `json:"github_id,omitempty"`
    Name      string    `json:"name"`
    Email     string    `json:"email,omitempty"`
    AvatarURL string    `json:"avatar_url,omitempty"`
    IsAdmin   bool      `json:"is_admin"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
    Password_hash []byte `json:"-"` // never serialized to JSON
}
```

`Password_hash` uses `json:"-"` so it can never leak into an API response.

The `Session` struct and `sessions` table exist but are currently unused — the auth system is stateless JWT. The table is reserved for future revocable-token support.

---

## JWT Utilities (`internal/utils/jwt.go`)

**`GenerateJwtToken(secret, userID)`**
- Claims: `sub` (userID), `iat` (issued-at), `exp` (now + 1 hour)
- Algorithm: HS256

**`ParseJwtToken(tokenStr, secret)`**
- Validates signature and standard claims (including `exp`)
- Checks signing method before trusting claims — prevents `alg:none` attacks
- Returns the `sub` claim (userID) on success

---

## Validation (`internal/utils/validateSignup.go`)

| Function | Rule |
|----------|------|
| `ValidateUsername` | Lowercase; must match `^[a-z0-9]+$` |
| `ValidateEmail` | Standard email regex |
| `ValidatePasswordRules` | Min 8 chars, lowercase, uppercase, digit, special char (`@$!%*?&`) |
| `HashPassword` | bcrypt at `DefaultCost` |
| `CheckPasswordHash` | `bcrypt.CompareHashAndPassword` wrapper |

---

## Database Schema

PostgreSQL 16 in Docker (`docker-compose.yml`, port `5433`).

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    github_id     TEXT UNIQUE,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    avatar_url    TEXT,
    password_hash TEXT,
    is_admin      BOOLEAN NOT NULL DEFAULT false,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reserved for future revocable-token support; not currently used.
CREATE TABLE IF NOT EXISTS sessions (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token      TEXT UNIQUE NOT NULL,
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

`seed.sql` is auto-mounted to `/docker-entrypoint-initdb.d/` and runs once on first container start.

---

## Auth Flow (End-to-End)

```
Browser                                    Go Server
  |                                             |
  |-- POST /api/signup (username,email,pw) ---> | validate → hash pw → INSERT users
  |<-- 201 Created {id, name, email} -----------|
  |                                             |
  |-- POST /api/login (username, pw) ---------> | validate → GetUserByUsername
  |                                             | → bcrypt compare
  |                                             | → GenerateJwtToken (HS256, 1hr)
  |<-- 200 OK + Set-Cookie: session=<JWT>  -----| (HttpOnly, SameSite=Lax)
  |                                             |
  |-- GET /api/me (cookie auto-sent) ---------> | RequireAuth:
  |                                             |   read cookie → ParseJwtToken
  |                                             |   → store userID in context
  |                                             | MeHandler:
  |                                             |   GetUserByID → return username
  |<-- 200 OK {"username": "joel"} -------------|
  |                                             |
  |-- POST /api/logout (cookie auto-sent) ----> | set expired cookie
  |<-- 200 OK + Set-Cookie: (expired) ----------|
```

---

## Testing

### Unit Tests (`go test ./...`)
Cover all packages without a database using `testutil.MockUserRepo`:
- `internal/handlers/` — login, signup, me, logout
- `internal/middleware/` — auth, requireAdmin
- `internal/repos/` — user repo
- `internal/utils/` — JWT, validation
- `internal/json/` — response helpers

### Integration Tests (`go test -tags integration ./cmd/`)
Uses `testcontainers-go` to spin up a real PostgreSQL container per test run.

Scenarios covered: health check, signup, duplicate email rejection, login, wrong password, `/api/me` authenticated, `/api/me` unauthenticated, logout cookie clearing, full signup → login → me → logout → me=401 flow.

---

## Environment Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server listen port |
| `DATABASE_URL` | `postgres://threejs_user:threejs_password@localhost:5433/threejs_database?sslmode=disable` | PostgreSQL DSN |
| `JWT_SECRET` | _(long random string)_ | HMAC signing secret |
| `FRONTEND_URL` | `http://localhost:5173` | Exact CORS allowed origin |
| `APP_ENV` | `production` | Set to enable `SameSite=None; Secure` cookies |

---

## Makefile Commands

| Command | Action |
|---------|--------|
| `make docker-up` | Start PostgreSQL container in background |
| `make docker-down` | Stop PostgreSQL container (data preserved) |
| `make db-create` | Run seed SQL inside the running container |
| `make dev` | `go run ./cmd/` — start the API server |

---

## Known Limitations / Future Work

| Item | Status |
|------|--------|
| Frontend protected routes | No `<ProtectedRoute>` in React — any URL is accessible without a cookie |
| Session hydration on refresh | `/api/me` exists but the frontend doesn't call it on mount; login state lost on page refresh |
| Token refresh | JWT expires after 1 hour with no renewal mechanism |
| `sessions` table | Created in schema but unused; reserved for revocable-token / multi-device logout support |
| Admin routes | Route group with `RequireAdmin` middleware exists but no routes are mounted inside it |
| GitHub OAuth | `githubClientID` / `gitHubClientSecret` fields in `config` struct; OAuth not yet implemented |
| Dead code | `store/db.go` duplicates `openDb` and has not been deleted |
