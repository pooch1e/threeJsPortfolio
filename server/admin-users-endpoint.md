# TODO: `GET /api/admin/users` — Steps 2 & 3

Step 1 (repo functions) is already done in `internal/repos/user.go`.

---

## Step 2 — Create `internal/handlers/admin.go`

Create a new file `server/internal/handlers/admin.go`:

```go
package handlers

import (
	"database/sql"
	"math"
	"net/http"
	"strconv"
	"threejsPortfolioServer/internal/repos"
	json "threejsPortfolioServer/internal/json"
)

type paginationMeta struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

type listUsersResponse struct {
	Users      interface{}    `json:"users"`
	Pagination paginationMeta `json:"pagination"`
}

func ListUsersHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Parse query params
		page, err := strconv.Atoi(r.URL.Query().Get("page"))
		if err != nil || page < 1 {
			page = 1
		}

		limit, err := strconv.Atoi(r.URL.Query().Get("limit"))
		if err != nil || limit < 1 {
			limit = 20
		}
		if limit > 100 {
			limit = 100
		}

		offset := (page - 1) * limit

		users, err := repos.GetAllUsers(db, limit, offset)
		if err != nil {
			json.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to fetch users"})
			return
		}

		total, err := repos.GetUserCount(db)
		if err != nil {
			json.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to count users"})
			return
		}

		// Return empty slice instead of null when no users found
		if users == nil {
			users = []models.User{}
		}

		resp := listUsersResponse{
			Users: users,
			Pagination: paginationMeta{
				Page:       page,
				Limit:      limit,
				Total:      total,
				TotalPages: int(math.Ceil(float64(total) / float64(limit))),
			},
		}

		json.WriteJSON(w, http.StatusOK, resp)
	}
}
```

> **Note:** Check what the JSON helper import path is in other handler files (e.g. `handlers/auth.go`) and match it exactly. The import alias above (`json "threejsPortfolioServer/internal/json"`) may need adjusting.
> Also add `"threejsPortfolioServer/internal/models"` to the import block for `models.User{}`.

---

## Step 3 — Register the route in `cmd/api.go`

In `api.go`, inside the `mount()` function, add an `/api/admin` route group **alongside** the existing protected group:

```go
// Admin-only routes
r.Route("/api/admin", func(r chi.Router) {
    r.Use(mw.RequireAuth)
    r.Use(mw.RequireAdmin(app.db))
    r.Get("/users", handlers.ListUsersHandler(app.db))
})
```

Make sure `handlers` is already imported; it should be since existing handlers are registered there.

---

## Expected Response

```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Alice",
      "email": "alice@example.com",
      "avatar_url": "",
      "is_admin": false,
      "CreatedAt": "2024-01-01T00:00:00Z",
      "UpdatedAt": "2024-01-01T00:00:00Z"
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

## Query Parameters

| Param   | Default | Max | Description        |
|---------|---------|-----|--------------------|
| `page`  | `1`     | —   | Page number (≥ 1)  |
| `limit` | `20`    | `100` | Results per page |

## Auth

Requires a valid JWT cookie (`session`) AND `is_admin = true` on the user record. Returns `401` if unauthenticated, `403` if not admin.
