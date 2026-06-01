# Middleware

HTTP middleware for the ThreeJS Portfolio API. Middleware functions follow Chi's expected signature:

```go
func(next http.Handler) http.Handler
```

Applied via `r.Use(...)` either globally on the root router or scoped to a route group.

## Files

| File | Middleware | Applied to |
|------|-----------|-----------|
| `auth.go` | `RequireAuth` | Protected route group (`/api/me`, `/api/logout`) |
| `requireAdmin.go` | `RequireAdmin` | Admin route group (mounted, no routes yet) |

## RequireAuth

```go
func RequireAuth(jwtSecret string) func(http.Handler) http.Handler
```

**What it does:**
1. Reads the `session` HttpOnly cookie from the request
2. Parses and validates the JWT using `utils.ParseJwtToken`
   - Verifies HS256 signing method before trusting claims (prevents `alg:none` attacks)
   - Validates `exp` claim automatically via the jwt library
3. On success: stores `userID` in request context and calls `next.ServeHTTP`
4. On failure: returns `401 Unauthorized` and stops the chain

**Context key:**

A custom type is used for the context key to prevent collisions with other packages:

```go
type contextKey string
const UserIDKey contextKey = "userID"
```

**Reading the value downstream:**

```go
userID := middleware.GetUserID(r) // returns the string userID from context
```

## RequireAdmin

```go
func RequireAdmin(repo UserRepository) func(http.Handler) http.Handler
```

**Requires `RequireAuth` to have run first** (reads `userID` from context).

1. Reads `userID` from request context
2. `repo.GetUserByID` — fetches full user record from DB
3. Checks `user.IsAdmin` boolean
4. Returns `403 Forbidden` if not admin
5. Returns `401 Unauthorized` if user not found in DB

## Global Middleware (from `cmd/api.go`)

These are applied to every request before route-specific middleware:

| Order | Middleware | Purpose |
|-------|-----------|---------|
| 1 | `chi/middleware.RequestID` | Attach unique request ID |
| 2 | `chi/middleware.RealIP` | Extract real IP from proxy headers |
| 3 | `chi/middleware.Logger` | Structured request logging |
| 4 | `chi/middleware.Recoverer` | Panic recovery |
| 5 | `cors.Handler` | CORS — exact origin, credentials enabled |
| 6 | `chi/middleware.Timeout(60s)` | Per-request timeout |
