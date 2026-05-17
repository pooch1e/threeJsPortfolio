# User Story: `GET /api/admin/users` — Paginated User List

## Story

**As an** admin user  
**I want** to call `GET /api/admin/users` and receive a paginated, ordered list of all registered users  
**So that** I can view and manage platform users from an admin dashboard

---

## Background & Current State

The scaffolding for this feature is already in place. Do not rebuild what exists — pick up from exactly where the stubs are.

| File | Current state |
|---|---|
| `internal/repos/interface.go` | `GetAllUsers` and `GetUserCount` declared on `UserRepository` |
| `internal/repos/user.go` | `GetAllUsers` and `GetUserCount` are stub methods on `PostgresUserRepo` — return zero values |
| `internal/handlers/admin.go` | `ListUsersHandler` stub — always returns `501 Not Implemented` |
| `internal/testutil/mock_user_repo.go` | `GetAllUsers` and `GetUserCount` are bare stubs — no `Fn` fields yet |
| `cmd/api.go` | Route `GET /api/admin/users` is registered inside the `RequireAuth` + `RequireAdmin` group |

---

## Acceptance Criteria

- `GET /api/admin/users` returns `200` with the response shape below for an authenticated admin
- Returns `401` when no session cookie is present
- Returns `403` when the session belongs to a non-admin user
- `page` defaults to `1` when absent or invalid; `limit` defaults to `20`, max `100`
- `users` is always an array (never JSON `null`) — empty array when no users exist
- `total_pages` is calculated correctly for any combination of `total` and `limit`
- All new code follows the patterns established in the existing handlers, repo methods, and tests

---

## Response Shape

```json
{
  "users": [
    {
      "id": "uuid",
      "name": "alice",
      "email": "alice@example.com",
      "avatar_url": "",
      "is_admin": false,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 85,
    "total_pages": 5
  }
}
```

---

## Tickets

---

### ADMIN-1 — Add `Fn` fields to `MockUserRepo` for `GetAllUsers` and `GetUserCount`

**File:** `internal/testutil/mock_user_repo.go`

**Why first:** Every handler test ticket that follows depends on a configurable mock. Unblock those before writing any logic.

**What to do:**

1. Add two `Fn` fields to the `MockUserRepo` struct, following the exact naming pattern of the existing fields:
   ```go
   GetAllUsersFn  func(limit, offset int) ([]models.User, error)
   GetUserCountFn func() (int, error)
   ```

2. Update the two stub method bodies to delegate to the `Fn` field when set, falling back to the zero-value return when nil — identical to how `GetUserByIDFn` is implemented:
   ```go
   func (m *MockUserRepo) GetAllUsers(limit, offset int) ([]models.User, error) {
       if m.GetAllUsersFn != nil {
           return m.GetAllUsersFn(limit, offset)
       }
       return nil, nil
   }

   func (m *MockUserRepo) GetUserCount() (int, error) {
       if m.GetUserCountFn != nil {
           return m.GetUserCountFn()
       }
       return 0, nil
   }
   ```

**Definition of done:** `go build ./...` passes. No test changes required in this ticket.

---

### ADMIN-2 — Implement `GetAllUsers` on `PostgresUserRepo`

**File:** `internal/repos/user.go`

**What to do:**

Replace the stub body of `(r *PostgresUserRepo) GetAllUsers` with a real SQL query. The query must:

- Select `id, name, email, avatar_url, is_admin, created_at, updated_at` from `users`
- Order by `created_at DESC` so newest users appear first
- Apply `LIMIT $1 OFFSET $2` for pagination
- Iterate `rows.Next()`, scan each row into a `models.User`, and append to a slice
- Return an empty `[]models.User{}` (not `nil`) when no rows are found — this prevents the JSON encoder from serialising the field as `null`
- Close `rows` with `defer rows.Close()`
- Return `rows.Err()` after the loop

**Schema reference** (from `internal/testutil/testdb.go`):
```sql
id UUID, github_id TEXT, name TEXT, email TEXT,
avatar_url TEXT, created_at TIMESTAMP, updated_at TIMESTAMP,
password_hash TEXT, is_admin BOOLEAN
```

**Scan order must exactly match the SELECT column list.** Look at how `GetUserByID` scans into `models.User` for the field names to use.

**Hint:** `avatar_url` is nullable in the DB (`TEXT` with no `NOT NULL`). `models.User.AvatarURL` is a plain `string`. You may need `sql.NullString` as an intermediary when scanning, then assign `.String` to the model field.

**Definition of done:** `go build ./...` passes. The integration test in ADMIN-6 will validate this at runtime.

---

### ADMIN-3 — Implement `GetUserCount` on `PostgresUserRepo`

**File:** `internal/repos/user.go`

**What to do:**

Replace the stub body of `(r *PostgresUserRepo) GetUserCount` with a single `SELECT COUNT(*)` query:

```sql
SELECT COUNT(*) FROM users
```

Scan the result into an `int` and return it. Follow the same error-logging pattern used in `CheckUserExists`.

**Definition of done:** `go build ./...` passes. The integration test in ADMIN-6 will validate this at runtime.

---

### ADMIN-4 — Implement `ListUsersHandler`

**File:** `internal/handlers/admin.go`

**What to do:**

Replace the `501` stub body with a real implementation. Work through these steps in order:

**Step 1 — Parse and clamp query params**

Read `page` and `limit` from the URL query string using `r.URL.Query().Get(...)` and `strconv.Atoi`. Apply defaults and guards:

| Param | Default | Constraint |
|---|---|---|
| `page` | `1` | must be `>= 1`; reset to `1` if missing, zero, or negative |
| `limit` | `20` | must be `>= 1`; reset to `20` if missing or invalid; cap at `100` |

**Step 2 — Calculate offset**

```go
offset := (page - 1) * limit
```

**Step 3 — Call the repo**

Call `repo.GetAllUsers(limit, offset)` and `repo.GetUserCount()`. Handle errors from both calls with `json.WriteError(w, http.StatusInternalServerError, "...")` and `return`.

**Step 4 — Build the response**

Define two local response structs inside the file (not in a shared package — keep them handler-local, matching how `LoginResponse` is defined in `login.go`):

```go
type paginationMeta struct {
    Page       int `json:"page"`
    Limit      int `json:"limit"`
    Total      int `json:"total"`
    TotalPages int `json:"total_pages"`
}

type listUsersResponse struct {
    Users      []models.User  `json:"users"`
    Pagination paginationMeta `json:"pagination"`
}
```

Calculate `TotalPages` as `int(math.Ceil(float64(total) / float64(limit)))`. Add `"math"` to your imports.

Ensure `users` is never `nil` before building the response — if `repo.GetAllUsers` returns `nil`, replace it with `[]models.User{}`.

**Step 5 — Write the response**

```go
json.WriteJson(w, http.StatusOK, listUsersResponse{ ... })
```

**Import paths to use** (match existing handlers exactly):

```go
import (
    "math"
    "net/http"
    "strconv"

    "threejsPortfolioServer/internal/json"
    "threejsPortfolioServer/internal/models"
    "threejsPortfolioServer/internal/repos"
)
```

**Definition of done:** `go build ./...` passes.

---

### ADMIN-5 — Unit tests for `ListUsersHandler`

**File:** `internal/handlers/admin_test.go` _(create this file)_

**Package:** `package handlers_test` — matches all other handler test files.

**Setup pattern:** Use `&testutil.MockUserRepo{...}` with `Fn` fields set per test case, pass it to `handlers.ListUsersHandler(repo)`, call `h.ServeHTTP(w, req)` — identical to `login_test.go` and `me_logout_test.go`.

**Imports you will need:**

```go
import (
    "encoding/json"
    "errors"
    "net/http"
    "net/http/httptest"
    "testing"
    "time"

    "threejsPortfolioServer/internal/handlers"
    "threejsPortfolioServer/internal/models"
    "threejsPortfolioServer/internal/testutil"
)
```

**Helper for decoding the paginated response** — define once at the top of the file and reuse across cases:

```go
type paginatedUsersResponse struct {
    Users      []models.User `json:"users"`
    Pagination struct {
        Page       int `json:"page"`
        Limit      int `json:"limit"`
        Total      int `json:"total"`
        TotalPages int `json:"total_pages"`
    } `json:"pagination"`
}

func decodeListUsers(t *testing.T, w *httptest.ResponseRecorder) paginatedUsersResponse {
    t.Helper()
    var body paginatedUsersResponse
    if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
        t.Fatalf("decode body: %v", err)
    }
    return body
}
```

**Test cases to cover:**

| Test name | Setup | Expected status | Extra assertions |
|---|---|---|---|
| `TestListUsersHandler_HappyPath` | `GetAllUsersFn` returns 2 users; `GetUserCountFn` returns `2` | `200` | `len(users) == 2`, `pagination.total == 2`, `pagination.page == 1`, `pagination.limit == 20` |
| `TestListUsersHandler_EmptyDB` | `GetAllUsersFn` returns `nil, nil`; `GetUserCountFn` returns `0, nil` | `200` | Raw JSON body contains `"users":[]` not `"users":null`; `pagination.total == 0`, `pagination.total_pages == 0` |
| `TestListUsersHandler_PageAndLimitParams` | `GetAllUsersFn` returns 1 user; `GetUserCountFn` returns `50` | `200` | Request with `?page=3&limit=10`; `pagination.page == 3`, `pagination.limit == 10`, `pagination.total_pages == 5` |
| `TestListUsersHandler_InvalidPageDefaultsTo1` | `GetAllUsersFn` returns `nil, nil`; `GetUserCountFn` returns `0, nil` | `200` | Request with `?page=abc`; `pagination.page == 1` |
| `TestListUsersHandler_LimitCappedAt100` | Capture args in `GetAllUsersFn` closure | `200` | Request with `?limit=999`; assert the `limit` arg received by the mock is `100` |
| `TestListUsersHandler_GetAllUsersDBError` | `GetAllUsersFn` returns `nil, errors.New("db down")` | `500` | Body contains `"error"` key |
| `TestListUsersHandler_GetUserCountDBError` | `GetAllUsersFn` returns valid users; `GetUserCountFn` returns `0, errors.New("db down")` | `500` | Body contains `"error"` key |

**Tip for `TestListUsersHandler_LimitCappedAt100`:** capture the received args using a closure variable:

```go
var gotLimit int
repo := &testutil.MockUserRepo{
    GetAllUsersFn: func(limit, offset int) ([]models.User, error) {
        gotLimit = limit
        return []models.User{}, nil
    },
    GetUserCountFn: func() (int, error) { return 0, nil },
}
// ... make request with ?limit=999 ...
if gotLimit != 100 {
    t.Errorf("limit: got %d, want 100", gotLimit)
}
```

**Tip for raw JSON null check in `TestListUsersHandler_EmptyDB`:**

```go
if !strings.Contains(w.Body.String(), `"users":[]`) {
    t.Errorf("expected users to be empty array, got: %s", w.Body.String())
}
```

**Definition of done:** `go test ./internal/handlers/...` passes with all cases green.

---

### ADMIN-6 — Integration tests for `GET /api/admin/users`

**File:** `cmd/integration_test.go` _(append to existing file — do not add the build tag again)_

**Run command:** `go test -tags integration ./cmd/...`

**Helpers already available in the file:** `newTestServer(t)`, `get(t, url, cookies)`, `post(t, url, body, cookies)`, `cookie(resp, name)`.

**New helper you will need to write** — `makeAdminSession` — to get a session cookie for an admin user. The signup endpoint does not expose `is_admin`, so you must set it directly in the DB after signup. `newTestServer` currently does not expose the `*sql.DB`, so write a separate local helper that:

1. Calls `testutil.NewTestDB(t)` directly to get a `*sql.DB`
2. Builds an `application` with `repos.NewPostgresUserRepo(db)` — the same pattern as the existing `newTestServer`
3. Starts an `httptest.NewServer`
4. Signs up a user via the server
5. Executes `UPDATE users SET is_admin = true WHERE name = $1` directly on the `*sql.DB`
6. Logs in and returns the session cookie, the server, and the cleanup func

```go
func makeAdminServer(t *testing.T) (*httptest.Server, *http.Cookie, func()) {
    t.Helper()
    // your implementation here
}
```

**Test cases to cover:**

| Test name | Setup | Expected status | Extra assertions |
|---|---|---|---|
| `TestIntegration_ListUsers_Unauthenticated` | No cookie | `401` | — |
| `TestIntegration_ListUsers_NonAdmin` | Valid session for a regular (non-admin) user | `403` | — |
| `TestIntegration_ListUsers_Admin` | Admin session; 3 additional users seeded via signup | `200` | `pagination.total >= 3`; `len(users) > 0`; response decodes without error |
| `TestIntegration_ListUsers_Pagination` | Admin session; 5 users seeded | `200` | Request `?page=1&limit=2`; `len(users) == 2`; `pagination.total_pages == ceil(total/2)` |
| `TestIntegration_ListUsers_EmptyDB` | Admin session only (no other users) | `200` | `users` field is an empty array, not null; `pagination.total >= 1` (the admin themselves) |

**Decoding the response in integration tests:**

```go
var body struct {
    Users      []map[string]interface{} `json:"users"`
    Pagination struct {
        Page       int `json:"page"`
        Limit      int `json:"limit"`
        Total      int `json:"total"`
        TotalPages int `json:"total_pages"`
    } `json:"pagination"`
}
if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
    t.Fatalf("decode body: %v", err)
}
```

**Definition of done:** `go test -tags integration ./cmd/...` passes with all cases green.

---

## Implementation Order

```
ADMIN-1  →  ADMIN-2  →  ADMIN-3  →  ADMIN-4  →  ADMIN-5  →  ADMIN-6
 mock Fn     GetAll     GetCount    handler      unit tests   integration
```

Each ticket leaves the build green before the next begins. ADMIN-2 and ADMIN-3 can be done in either order as they are independent of each other.

---

## Reference: How to run tests

```bash
# Unit tests (no DB required)
go test ./...

# Integration tests (requires Docker)
go test -tags integration ./...
```
