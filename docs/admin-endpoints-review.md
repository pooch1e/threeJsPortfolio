# Admin endpoints review

Audit of `server/internal/handlers/admin.go` on `feat/admin-endpoints`, done before wiring the admin frontend. Kept for the Go concepts it surfaced, not just as a changelog.

## Fixed

| Issue | Where | Fix |
|---|---|---|
| `UpdateUserHandler` decoded the request body into `input` but called `repo.UpdateUser(id, models.UpdateUserInput{})` — passed a blank struct, silently dropping every field the client sent. | `admin.go` | Pass `input`, not a zero-value literal. |
| Routes register `id` as a **path param** (`/api/admin/users/{id}` in `cmd/api.go`), but handlers read `r.URL.Query().Get("id")` — a **query string** lookup. Through the real router `id` was always `""`, so update/delete/get-by-id 400'd on every real request. | `UpdateUserHandler`, `DeleteUser`, `GetUserHandler` | Read with `chi.URLParam(r, "id")` instead. |
| `GetUserHandler` read a `username` query param and called `GetUserByUsername`, unrelated to the `{id}` the route actually provides. | `GetUserHandler` | Switched to `id` / `repo.GetUserByID(id)`. |
| `repos.ErrNotFound` wasn't checked — update/delete/get always returned a generic 500 for a missing user, never 404. | `UpdateUserHandler`, `DeleteUser`, `GetUserHandler` | Added `errors.Is(err, repos.ErrNotFound)` branch → 404, before the generic 500. |
| `GetUserHandler` had a dead `if user == nil` 404 check — unreachable, since the repo returns `(nil, ErrNotFound)` on no rows, never `(nil, nil)`. | `GetUserHandler` | Replaced by the `errors.Is` branch above. |
| Unused `net/url` import broke `go build`. | `admin.go` | Removed. |
| `PostgresUserRepo.DeleteUser` never checked rows-affected, so it couldn't actually produce `ErrNotFound` against a real DB — deleting a nonexistent id just succeeded silently, even though the handler's `errors.Is` 404 branch was already in place. | `repos/user.go` | Now checks `RowsAffected()`; returns `ErrNotFound` when zero rows matched. |
| `PostgresUserRepo.UpdateUser`'s SQL unconditionally set `name`, `email`, `is_admin` from the input's pointer fields. A partial payload like `{"name": "Bob"}` left `Email`/`IsAdmin` as nil `*string`/`*bool`, which `database/sql` sends as SQL `NULL` — silently wiping those columns instead of leaving them untouched. | `repos/user.go` | SQL now uses `COALESCE($n, column)` per field, so a nil pointer leaves the existing value in place. |
| `UpdatePasswordHashHandler` and `PostgresUserRepo.UpdatePasswordHash` were stubs; the route was also missing a `/` before `{id}` and never matched a real URL. | `cmd/api.go`, `admin.go`, `repos/user.go` | Route fixed to `/api/admin/users/{id}/passwordReset`. Handler validates the new password with `utils.ValidatePasswordRules`, hashes it with `utils.HashPassword`, and calls the repo; repo runs the `UPDATE` and maps zero-rows-affected to `ErrNotFound`, same pattern as `DeleteUser`. |
| Duplicate model: unexported `updateUserInput` sat unused next to the exported `UpdateUserInput`. | `models/user.go` | Deleted. |
| Typo in delete success message ("Succesfully"). | `admin.go` | Fixed. |
| `slog.Error` calls for update/delete/get-by-id DB failures didn't include the `id` being operated on, making them hard to correlate to a request. | `repos/user.go` | Added `"id", id` to each. |

Verified with `go build ./... && go vet ./... && go test ./...` — all green, including 5 new tests in `admin_test.go` that failed before the fix and pass after (`TestUpdateUserHandler_ForwardsDecodedInputToRepo`, `TestUpdateUserHandler_NotFoundReturns404`, `TestUpdateUserHandler_ReadsIDFromRoutePath`, `TestDeleteUser_NotFoundReturns404`, `TestDeleteUser_ReadsIDFromRoutePath`).

## Still open

| Issue | Where | Why it's left |
|---|---|---|
| `DeleteUser` handler name breaks the `XxxHandler` convention every sibling follows. | `admin.go` | Cosmetic, low priority. |
| No integration tests (against a real Postgres instance) for `UpdateUser`'s `COALESCE` behavior or `DeleteUser`/`UpdatePasswordHash`'s rows-affected → `ErrNotFound` mapping — only mock-based handler tests, which can't catch a repo-layer regression in these specific behaviors. | `repos/user_test.go` | Needs the `-tags integration` DB-backed suite extended; not done yet. |
| No test coverage for `GetUserHandler`, or for `sessionCookieFlags()` / logout's cookie attributes in either `APP_ENV` mode. | `admin_test.go`, `login_test.go`/missing `logout_test.go` | Flagged in PR review; not yet added. |

## Concepts this surfaced

**Path params vs. query params.** A path param (`{id}` → `/users/42`) identifies *which* resource; a query param (`?page=2`) is optional metadata about the request. Chi doesn't cross-wire them — registering a route with `{id}` and then reading `r.URL.Query().Get("id")` compiles fine and just returns `""` forever. A handler that reads the wrong one looks correct in an isolated unit test (you can stuff `id` into the query string yourself) and only breaks once real routing is involved — which is why the fix tests route requests through an actual `chi.Router`, not just `httptest.NewRequest` straight into the handler.

**Sentinel errors + `errors.Is`.** Go has no exceptions, so "this specific thing went wrong" is usually signaled by a predeclared `error` value (`var ErrNotFound = errors.New("not found")`) that callers compare against with `errors.Is` — not `==`, since `errors.Is` unwraps wrapped errors (`fmt.Errorf("...: %w", err)`) and `==` won't. Order matters: check the specific sentinel first, then fall through to a generic error branch — checking generic-then-specific means the specific branch is dead code (as `GetUserHandler`'s `user == nil` check was).

**Nil pointers as "don't touch" vs. NULL.** `*string`/`*bool` fields are a common way to express "field not supplied" in a partial-update struct, but `database/sql` doesn't know that convention — a nil pointer becomes SQL `NULL` on the wire. Distinguishing "leave this column alone" from "set this column to NULL" needs the query itself to handle it (`COALESCE`), not just the Go struct shape.
