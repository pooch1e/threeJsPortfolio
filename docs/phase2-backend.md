# Phase 2 Backend: Auth Flow Explained

A walkthrough of every change made in Phase 2, written for someone learning Go.

---

## The Big Picture: What Did We Build?

Before Phase 2, the server could log a user in and hand back a JWT string in the JSON response body. But it never validated that token again — any endpoint was reachable by anyone.

After Phase 2, the flow looks like this:

```
Browser                          Go Server
  |                                  |
  |-- POST /api/login -------------->|
  |                                  | validate credentials
  |                                  | generate JWT
  |<-- 200 OK + Set-Cookie: session -|
  |   (cookie is httpOnly:           |
  |    JS cannot read it)            |
  |                                  |
  |-- GET /api/me ------------------>|
  |   (browser sends cookie          |
  |    automatically)                |
  |                                  | RequireAuth middleware:
  |                                  |   read cookie → parse JWT → put userID in context
  |                                  | MeHandler:
  |                                  |   read userID from context → DB lookup → return user
  |<-- 200 { username: "joel" } -----|
  |                                  |
  |-- POST /api/logout ------------->|
  |                                  | overwrite cookie with expired one
  |<-- 200 OK + Set-Cookie: expired -|
  |   (browser deletes the cookie)   |
```

---

## Concepts Used

### Functions as values (handlers)

In Go, functions are first-class values — you can assign them to variables, pass them as arguments, and return them from other functions.

Chi routes expect a value of type `http.HandlerFunc`, which is just:
```go
type HandlerFunc func(ResponseWriter, *Request)
```

Our handlers use a pattern called a **closure**: an outer function that receives dependencies (like `db`) and returns the actual handler function. This is how we inject dependencies without global variables.

```go
// The outer function runs ONCE at startup, when wiring up routes.
// It captures `db` and `jwtSecret` in a closure.
func LoginHandler(db *sql.DB, jwtSecret string) http.HandlerFunc {

    // This inner function runs on EVERY request.
    return func(w http.ResponseWriter, r *http.Request) {
        // `db` and `jwtSecret` are available here via the closure
    }
}
```

### Receivers

Go doesn't have classes, but you can attach functions to types using a **receiver**:

```go
// `app` is the receiver. This function "belongs to" the application type.
// The * means we're working with a pointer to app, not a copy.
func (app *application) mount() http.Handler { ... }
```

This is similar to a class method in JS: `app.mount()`.

### Pointers (`*` and `&`)

```go
var user models.User        // user is a value (copy lives on the stack)
var userPtr *models.User    // userPtr is a pointer (holds a memory address)

userPtr = &user             // & means "give me the address of user"
name := userPtr.Name        // Go auto-dereferences: no need for (*userPtr).Name
```

When a function returns `*models.User` it returns a pointer. This is efficient (no copying the whole struct) and also lets the caller distinguish between "found a user" and "no rows" by checking if the pointer is `nil`.

---

## File-by-File Walkthrough

### `internal/utils/jwt.go`

**What changed:** Added `ParseJwtToken`. Removed unused package-level variables. Added `iat` claim.

**`GenerateJwtToken`** — called on login to create a token:
```go
claims := jwt.MapClaims{
    "sub": userID,          // "subject" — standard JWT claim for who the token is about
    "iat": time.Now().Unix(), // "issued at" — Unix timestamp (seconds since epoch)
    "exp": time.Now().Add(time.Hour).Unix(), // "expires at"
}
```
`jwt.MapClaims` is just `map[string]interface{}`. The library knows to validate `exp` automatically.

**`ParseJwtToken`** — called by the auth middleware on every protected request:
```go
token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
    // This callback lets us verify the algorithm before trusting the claims.
    // Without this check, an attacker could craft a token with alg:"none"
    // and it would pass validation even without a secret key.
    if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
        return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
    }
    return []byte(secret), nil
})
```

The type assertion `token.Method.(*jwt.SigningMethodHMAC)` checks: "is this value a pointer to a `SigningMethodHMAC`?". The two-value form `value, ok := x.(T)` is safe — `ok` is `false` instead of panicking if the assertion fails.

---

### `internal/middleware/auth.go` (new file)

**What it does:** Sits in front of protected routes. Reads and validates the session cookie. If valid, passes the request along with the userID attached to the context. If invalid, returns 401 and stops.

**Key Go concept — `context.WithValue`:**

The request context (`r.Context()`) is an immutable key-value store that travels with the request through the middleware chain. Each call to `WithValue` returns a *new* context (the original is unchanged):

```go
ctx := context.WithValue(r.Context(), UserIDKey, userID)
next.ServeHTTP(w, r.WithContext(ctx))
//                  ^^ shallow copy of r with the new context
```

The downstream handler then reads it back:
```go
userID, _ := r.Context().Value(UserIDKey).(string)
```

**Why a custom type for the key (`contextKey`)?**

If you used a plain string as a key, any package could accidentally collide with it:
```go
// BAD — any other package using "userID" as a string key collides
ctx = context.WithValue(ctx, "userID", id)

// GOOD — only this package's contextKey type can match
type contextKey string
const UserIDKey contextKey = "userID"
```

**The middleware signature:**

```go
func RequireAuth(jwtSecret string) func(http.Handler) http.Handler
```

Chi's `r.Use(...)` expects a function of type `func(http.Handler) http.Handler` — a function that *wraps* a handler. Our outer function returns exactly that:

```
RequireAuth(secret)  →  func(next http.Handler) http.Handler
                                      ↓
                        func(w, r) { validate → next.ServeHTTP(w, r) }
```

---

### `internal/handlers/login.go`

**What was broken:**
1. `type LoginJsonResponse {` — missing the `struct` keyword. Go struct declarations require it.
2. The handler referenced `LoginResponse` (undefined). The declared type was `LoginJsonResponse`.
3. The response struct had an unexported field (`user string`). In Go, only exported identifiers (starting with a capital letter) are visible outside the package — and `encoding/json` only serializes exported fields. The JSON response would have been `{}`.

**What was fixed:**
```go
// Before (broken):
type LoginJsonResponse {
    user string
}
authRes := LoginResponse{ user: user }

// After:
type LoginResponse struct {
    Username string `json:"username"`
}
json.WriteJson(w, http.StatusOK, LoginResponse{Username: user.Name})
```

**`json` struct tags** control how a field is serialized:
- `` `json:"username"` `` → key in JSON is `"username"` (not `"Username"`)
- `` `json:"-"` `` → never include this field in JSON output
- `` `json:"email,omitempty"` `` → omit the field if it's the zero value

**Cookie `SameSite` attribute:**
```go
sameSite := http.SameSiteLaxMode   // dev: same host, different port is fine
secure := false
if os.Getenv("APP_ENV") == "production" {
    sameSite = http.SameSiteNoneMode  // prod: different domains need None
    secure = true                      // SameSite=None requires Secure=true
}
```

`SameSite` controls when the browser includes the cookie on cross-site requests:
- `Lax` — sent on same-site requests and top-level navigation. Good for localhost dev.
- `None` — sent on all cross-origin requests. Required when frontend and backend are on different domains. Must be paired with `Secure=true` (HTTPS only).
- `Strict` — never sent on cross-site requests. Too restrictive for an API.

---

### `internal/handlers/me.go` and `internal/handlers/logout.go` (new files)

**`MeHandler`** reads the userID the middleware stored in context, queries the DB, and returns the user's name. It reuses `LoginResponse` because we only want to expose the same minimal data.

**`LogoutHandler`** clears the cookie using two mechanisms (belt-and-suspenders):
```go
http.SetCookie(w, &http.Cookie{
    Name:    "session",
    Value:   "",
    Expires: time.Unix(0, 0), // Set expiry to Unix epoch (Jan 1 1970) = already expired
    MaxAge:  -1,              // MaxAge=-1 explicitly tells the browser to delete it
})
```
`MaxAge` is the modern way; `Expires` is for older browsers. Using both covers all cases.

---

### `internal/repos/user.go` — `GetUserByID`

Same pattern as `GetUserByUsername`, but queries by `id` (UUID). This is needed by `/api/me` — we get the userID from the JWT, then look up the full user record.

Note the `SELECT` only fetches the columns we actually need. We deliberately don't select `password_hash` since this function is used to serve the user profile — there is no reason to load the hash.

---

### `internal/models/user.go`

**Removed a latent security issue:**
```go
// Before — this field had json:"password_hash,omitempty"
// If it were ever populated (e.g. by a future developer scanning the wrong column),
// the hash would appear in API responses.
PasswordHash string `json:"password_hash,omitempty"`

// After — removed entirely. Only the []byte field with json:"-" remains.
Password_hash []byte `json:"-"`
```

---

### `cmd/api.go`

**CORS fix — the single most important change for cookies to work:**

```go
// Before:
AllowedOrigins:   []string{"https://*", "http://*"},
AllowCredentials: false,

// After:
AllowedOrigins:   []string{frontendURL}, // exact origin, no wildcards
AllowCredentials: true,
```

Why? The CORS spec explicitly forbids wildcards when `AllowCredentials: true`. The browser checks: if the response has `Access-Control-Allow-Credentials: true`, the `Access-Control-Allow-Origin` header must be an exact origin string — not `*`. If it's a wildcard, the browser refuses to expose the response to JavaScript and discards the `Set-Cookie` header.

**Protected route group:**

```go
r.Group(func(r chi.Router) {
    r.Use(appMiddleware.RequireAuth(app.config.jwtSecret))

    r.Get("/api/me", handlers.MeHandler(app.db))
    r.Post("/api/logout", handlers.LogoutHandler())
})
```

`r.Group` creates a sub-router that inherits the parent's middleware but can add its own. `r.Use` inside the group applies `RequireAuth` only to routes declared within the group. Routes outside the group (signup, login) are unaffected.

---

## Route Table

| Method | Path | Auth required | What it does |
|--------|------|---------------|--------------|
| `POST` | `/api/signup` | No | Create a new account |
| `POST` | `/api/login` | No | Validate credentials, set session cookie |
| `GET` | `/api/me` | Yes | Return current user's username |
| `POST` | `/api/logout` | Yes | Clear the session cookie |

---

## What Is Still Not Done (Future Work)

- **Frontend protected routes**: The React app has no `<ProtectedRoute>` component. Any URL is reachable by anyone, even without a cookie.
- **`/api/me` for session hydration**: The endpoint exists now but the frontend doesn't call it on startup, so the login state is lost on refresh.
- **Sessions table**: The DB schema has a `sessions` table that is never used. With stateless JWTs there is no need for it unless you want revocable tokens (e.g. force-logout from all devices).
- **Token refresh**: The JWT expires after 1 hour with no mechanism to renew it. The user will be silently logged out.
- **`store/db.go`**: Dead code (duplicate of `openDb`), not deleted yet.
