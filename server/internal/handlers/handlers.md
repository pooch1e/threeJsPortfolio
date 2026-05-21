# Handlers

HTTP request handlers for the ThreeJS Portfolio API. All handlers use the **closure / dependency injection** pattern — an outer function captures dependencies (repo, jwtSecret) and returns the actual `http.HandlerFunc`. This avoids global state and makes unit testing straightforward via mock repos.

## Files

| File | Handler | Route | Auth |
|------|---------|-------|------|
| `signup.go` | `SignupHandler` | `POST /api/signup` | Public |
| `login.go` | `LoginHandler` | `POST /api/login` | Public |
| `me.go` | `MeHandler` | `GET /api/me` | RequireAuth |
| `logout.go` | `LogoutHandler` | `POST /api/logout` | RequireAuth |

## Pattern

```go
func LoginHandler(repo repos.UserRepository, jwtSecret string) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // repo and jwtSecret are captured from the outer scope (closure)
    }
}
```

## SignupHandler
1. Decode `{username, email, password}` from JSON body
2. Validate all three fields (see `internal/utils/validateSignup.go`)
3. `repo.CheckUserExists` — reject duplicate email with `409 Conflict`
4. Hash password with bcrypt
5. `repo.InsertNewUser` — persist to DB
6. Return `201 Created` with the full user object

## LoginHandler
1. Decode `{username, password}`
2. `repo.GetUserByUsername` — fetch user record (includes `password_hash`)
3. `bcrypt.CompareHashAndPassword` — verify password
4. `utils.GenerateJwtToken` — create HS256 JWT (1-hour expiry, `sub` = userID)
5. Set `session` HttpOnly cookie:
   - Dev: `SameSite=Lax`, `Secure=false`
   - Production (`APP_ENV=production`): `SameSite=None`, `Secure=true`
6. Return `200 OK` with `{"username": "..."}`

## MeHandler
1. Read `userID` from request context (set by `RequireAuth` middleware)
2. `repo.GetUserByID` — fetch user (no `password_hash` loaded)
3. Return `200 OK` with `{"username": "..."}`

## LogoutHandler
1. Overwrite `session` cookie: `Value=""`, `Expires=Unix(0,0)`, `MaxAge=-1`
   - Both `Expires` (legacy) and `MaxAge` (modern) set for full browser compatibility
2. Return `200 OK`

## Error Responses

All errors are returned as JSON `{"error": "..."}` via `json.WriteError`. Never plain text.
