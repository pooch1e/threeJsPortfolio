# User Story: Admin Dashboard — Full Feature Implementation

## Story

**As an** admin user  
**I want** a dedicated admin dashboard accessible at `/admin`  
**So that** I can view, edit, delete, and manage user accounts and reset passwords from a protected UI backed by the Go API

---

## Background & Current State

The following is already in place from prior work. Do not rebuild it.

| File | Current state |
|---|---|
| `server/internal/models/user.go` | `User` has `IsAdmin bool` field |
| `server/db/seed/seed.sql` | `is_admin BOOLEAN NOT NULL DEFAULT false` on `users` table |
| `server/internal/repos/interface.go` | `UserRepository` has `GetAllUsers`, `GetUserCount` |
| `server/internal/repos/user.go` | `GetAllUsers`, `GetUserCount` are stubs; all other methods implemented |
| `server/internal/middleware/requireAdmin.go` | `RequireAdmin(repo)` middleware — fetches user, checks `is_admin`, returns `403` |
| `server/internal/handlers/admin.go` | `ListUsersHandler` stub — returns `501` |
| `server/cmd/api.go` | `GET /api/admin/users` registered in `RequireAuth` + `RequireAdmin` group |
| `server/admin-users-story.md` | Covers ADMIN-1 through ADMIN-6 — implementation of the list endpoint |
| `src/store/user.js` | Zustand store with `username`, `isAuthenticated`, `isLoading` |
| `src/App.jsx` | Calls `GET /api/me` on mount; stores `username`; no `is_admin` yet |
| `src/components/ProtectedRoute.jsx` | Guards on `isAuthenticated` only |

**Known gap:** `MeHandler` in `server/internal/handlers/me.go` returns `{ username }` only via `LoginResponse`. The frontend has no way to know if the current user is an admin. This must be fixed in DASH-1 before any frontend admin gating can work.

---

## Acceptance Criteria

- Admin users can navigate to `/admin` and see a dashboard
- Non-admin authenticated users are redirected away from `/admin`
- Unauthenticated users are redirected to login from `/admin`
- Admin can view a paginated, searchable list of all users
- Admin can view a single user's detail
- Admin can update a user's name, email, and `is_admin` flag
- Admin can delete a user
- Admin can reset a user's password by typing a new one
- All admin API endpoints return `401` with no session and `403` for non-admin sessions
- All new backend code follows the `UserRepository` interface pattern
- All new Go code has unit tests following the patterns in `handlers/login_test.go` and `me_logout_test.go`

---

## API Endpoints Added by This Story

| Method | Path | Handler | Description |
|---|---|---|---|
| `GET` | `/api/me` | `MeHandler` (extended) | Now includes `is_admin` in response |
| `GET` | `/api/admin/users/{id}` | `GetUserHandler` | Single user detail |
| `PUT` | `/api/admin/users/{id}` | `UpdateUserHandler` | Update name, email, is_admin |
| `DELETE` | `/api/admin/users/{id}` | `DeleteUserHandler` | Delete a user |
| `POST` | `/api/admin/users/{id}/reset-password` | `ResetPasswordHandler` | Admin sets new password |

---

## Tickets

---

### DASH-1 — Extend `/api/me` response to include `is_admin`

**Files:**
- `server/internal/handlers/me.go`
- `server/internal/handlers/me_logout_test.go`

**Why first:** Every subsequent frontend ticket depends on the browser knowing whether the current user is an admin. This is the single change that unblocks all of DASH-8 onward.

**What to do:**

1. In `me.go`, find the `MeHandler` function. It currently responds with `LoginResponse{Username: user.Name}`. `LoginResponse` is defined in `login.go` as `{ Username string }`.

2. Define a new response struct local to `me.go` — do not modify `LoginResponse` in `login.go`, it is used by the login flow:
   ```go
   type MeResponse struct {
       Username string `json:"username"`
       IsAdmin  bool   `json:"is_admin"`
   }
   ```

3. Replace the `json.WriteJson(w, http.StatusOK, LoginResponse{...})` call with:
   ```go
   json.WriteJson(w, http.StatusOK, MeResponse{
       Username: user.Name,
       IsAdmin:  user.IsAdmin,
   })
   ```

4. In `me_logout_test.go`, find `TestMeHandler_HappyPath`. It currently decodes and asserts `body.Username`. Add an assertion for `body.IsAdmin` — update the anonymous decode struct to include `IsAdmin bool \`json:"is_admin"\``. The test user's `IsAdmin` defaults to `false`; assert it equals `false`.

**Definition of done:** `go test ./internal/handlers/...` passes.

---

### DASH-2 — Register `GET /api/admin/users/{id}` route and handler stub

**Files:**
- `server/internal/handlers/admin.go`
- `server/cmd/api.go`

**What to do:**

1. In `handlers/admin.go`, add a new stub handler below `ListUsersHandler`:
   ```go
   func GetUserHandler(repo repos.UserRepository) http.HandlerFunc {
       return func(w http.ResponseWriter, r *http.Request) {
           json.WriteError(w, http.StatusNotImplemented, "not implemented")
       }
   }
   ```

2. In `cmd/api.go`, inside the admin-only `r.Group`, add the new route below the existing list route:
   ```go
   r.Get("/api/admin/users/{id}", handlers.GetUserHandler(app.userRepo))
   ```

   Chi uses `{id}` for URL parameters. You will read it in the handler with `chi.URLParam(r, "id")` — import `"github.com/go-chi/chi/v5"` in `admin.go` when you implement it in DASH-7.

**Definition of done:** `go build ./...` passes.

---

### DASH-3 — Add `UpdateUser` to `UserRepository` interface, stub, mock, and route

**Files:**
- `server/internal/models/user.go`
- `server/internal/repos/interface.go`
- `server/internal/repos/user.go`
- `server/internal/testutil/mock_user_repo.go`
- `server/internal/handlers/admin.go`
- `server/cmd/api.go`

**What to do:**

1. In `models/user.go`, add a new input struct below the existing types:
   ```go
   // UpdateUserInput holds the fields an admin may change on a user record.
   type UpdateUserInput struct {
       Name    string `json:"name"`
       Email   string `json:"email"`
       IsAdmin bool   `json:"is_admin"`
   }
   ```

2. In `repos/interface.go`, add to `UserRepository`:
   ```go
   UpdateUser(id string, input models.UpdateUserInput) (*models.User, error)
   ```

3. In `repos/user.go`, add a stub method on `PostgresUserRepo`:
   ```go
   func (r *PostgresUserRepo) UpdateUser(id string, input models.UpdateUserInput) (*models.User, error) {
       return nil, nil
   }
   ```

4. In `testutil/mock_user_repo.go`, add the `Fn` field to the struct and a delegating method body — follow the exact pattern of `GetUserByIDFn`:
   ```go
   UpdateUserFn func(id string, input models.UpdateUserInput) (*models.User, error)

   func (m *MockUserRepo) UpdateUser(id string, input models.UpdateUserInput) (*models.User, error) {
       if m.UpdateUserFn != nil {
           return m.UpdateUserFn(id, input)
       }
       return nil, nil
   }
   ```

5. In `handlers/admin.go`, add an `UpdateUserHandler` stub returning `501`.

6. In `cmd/api.go`, inside the admin group:
   ```go
   r.Put("/api/admin/users/{id}", handlers.UpdateUserHandler(app.userRepo))
   ```

**Definition of done:** `go build ./...` passes.

---

### DASH-4 — Add `DeleteUser` to `UserRepository` interface, stub, mock, and route

**Files:**
- `server/internal/repos/interface.go`
- `server/internal/repos/user.go`
- `server/internal/testutil/mock_user_repo.go`
- `server/internal/handlers/admin.go`
- `server/cmd/api.go`

**What to do:**

1. In `repos/interface.go`, add to `UserRepository`:
   ```go
   DeleteUser(id string) error
   ```

2. In `repos/user.go`, add a stub:
   ```go
   func (r *PostgresUserRepo) DeleteUser(id string) error {
       return nil
   }
   ```

3. In `testutil/mock_user_repo.go`, add `Fn` field and delegating method:
   ```go
   DeleteUserFn func(id string) error

   func (m *MockUserRepo) DeleteUser(id string) error {
       if m.DeleteUserFn != nil {
           return m.DeleteUserFn(id)
       }
       return nil
   }
   ```

4. In `handlers/admin.go`, add a `DeleteUserHandler` stub returning `501`.

5. In `cmd/api.go`:
   ```go
   r.Delete("/api/admin/users/{id}", handlers.DeleteUserHandler(app.userRepo))
   ```

**Definition of done:** `go build ./...` passes.

---

### DASH-5 — Add `UpdatePasswordHash` to `UserRepository` interface, stub, mock, and route

**Files:**
- `server/internal/repos/interface.go`
- `server/internal/repos/user.go`
- `server/internal/testutil/mock_user_repo.go`
- `server/internal/handlers/admin.go`
- `server/cmd/api.go`

**What to do:**

1. In `repos/interface.go`, add to `UserRepository`:
   ```go
   UpdatePasswordHash(id string, hash []byte) error
   ```

2. In `repos/user.go`, add a stub:
   ```go
   func (r *PostgresUserRepo) UpdatePasswordHash(id string, hash []byte) error {
       return nil
   }
   ```

3. In `testutil/mock_user_repo.go`, add `Fn` field and delegating method:
   ```go
   UpdatePasswordHashFn func(id string, hash []byte) error

   func (m *MockUserRepo) UpdatePasswordHash(id string, hash []byte) error {
       if m.UpdatePasswordHashFn != nil {
           return m.UpdatePasswordHashFn(id, hash)
       }
       return nil
   }
   ```

4. In `handlers/admin.go`, add a `ResetPasswordHandler` stub returning `501`.

5. In `cmd/api.go`:
   ```go
   r.Post("/api/admin/users/{id}/reset-password", handlers.ResetPasswordHandler(app.userRepo))
   ```

**Definition of done:** `go build ./...` passes.

---

### DASH-6 — Implement `UpdateUser`, `DeleteUser`, and `UpdatePasswordHash` on `PostgresUserRepo`

**File:** `server/internal/repos/user.go`

**What to do:**

Replace the three stub bodies added in DASH-3, DASH-4, and DASH-5 with real SQL.

---

**`UpdateUser`**

```sql
UPDATE users
SET name = $1, email = $2, is_admin = $3, updated_at = NOW()
WHERE id = $4
RETURNING id, name, email, is_admin, created_at, updated_at
```

- Use `db.QueryRow(...).Scan(...)` — same pattern as `InsertNewUser`.
- If the query returns `sql.ErrNoRows`, return `nil, ErrNotFound`.
- Log errors with `slog.Error` — match the pattern of other methods.
- Return the updated `*models.User`.

---

**`DeleteUser`**

```sql
DELETE FROM users WHERE id = $1
```

- Use `db.Exec(...)`. It does not return rows.
- Call `.RowsAffected()` on the result. If `0`, return `ErrNotFound` — the ID did not exist.
- Log unexpected DB errors with `slog.Error`.

---

**`UpdatePasswordHash`**

```sql
UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2
```

- Use `db.Exec(...)`.
- Check `RowsAffected()` — return `ErrNotFound` if `0`.

---

**Definition of done:** `go build ./...` passes. Integration tests in DASH-14 validate at runtime.

---

### DASH-7 — Implement `GetUserHandler`, `UpdateUserHandler`, `DeleteUserHandler`, `ResetPasswordHandler` and their unit tests

**Files:**
- `server/internal/handlers/admin.go`
- `server/internal/handlers/admin_test.go` _(extend from ADMIN-5)_

**Imports you will need in `admin.go`:**
```go
import (
    "encoding/json"
    "errors"
    "math"
    "net/http"
    "strconv"

    "github.com/go-chi/chi/v5"
    appJSON "threejsPortfolioServer/internal/json"
    "threejsPortfolioServer/internal/models"
    "threejsPortfolioServer/internal/repos"
    "threejsPortfolioServer/internal/utils"
)
```

---

**`GetUserHandler`**

1. Read `id := chi.URLParam(r, "id")`. If empty, return `400`.
2. Call `repo.GetUserByID(id)`.
3. On `repos.ErrNotFound` → `404 "user not found"`.
4. On other error → `500`.
5. On success → `200` with the full `*models.User` as JSON.

---

**`UpdateUserHandler`**

1. Read `id := chi.URLParam(r, "id")`.
2. Decode request body into `models.UpdateUserInput` using `json.NewDecoder(r.Body).Decode(...)`. On decode error → `400`.
3. Validate: `Name` and `Email` must not be empty. Use `utils.ValidateUsername` for name and the existing email regex pattern from `validateSignup.go` for email. On validation failure → `400` with the specific error message.
4. Call `repo.UpdateUser(id, input)`.
5. On `repos.ErrNotFound` → `404`.
6. On other error → `500`.
7. On success → `200` with the updated `*models.User`.

---

**`DeleteUserHandler`**

1. Read `id := chi.URLParam(r, "id")`.
2. Call `repo.DeleteUser(id)`.
3. On `repos.ErrNotFound` → `404`.
4. On other error → `500`.
5. On success → `204 No Content`. Do not write a body.

---

**`ResetPasswordHandler`**

1. Read `id := chi.URLParam(r, "id")`.
2. Decode body into an anonymous or named struct `{ Password string \`json:"password"\` }`. On decode error → `400`.
3. Validate the password using `utils.ValidatePassword(input.Password)` — this already enforces the complexity rules used at signup. On failure → `400` with the validation error message.
4. Hash with `utils.HashPassword(input.Password)`. On error → `500`.
5. Call `repo.UpdatePasswordHash(id, hash)`.
6. On `repos.ErrNotFound` → `404`.
7. On other error → `500`.
8. On success → `204 No Content`.

**Reference for validation functions:** `server/internal/utils/validateSignup.go`.

---

**Unit test cases to add to `admin_test.go`:**

For each handler, follow the `httptest.NewRequest` + `MockUserRepo` Fn pattern. For handlers that use `chi.URLParam`, you must inject the chi context — see below.

**Injecting chi URL params in tests:**

```go
import "github.com/go-chi/chi/v5"

func requestWithID(method, path, id string, body io.Reader) *http.Request {
    r := httptest.NewRequest(method, path, body)
    rctx := chi.NewRouteContext()
    rctx.URLParams.Add("id", id)
    return r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, rctx))
}
```

| Test name | Handler | Setup | Expected status |
|---|---|---|---|
| `TestGetUserHandler_HappyPath` | `GetUserHandler` | `GetUserByIDFn` returns a user | `200` + assert `id` in body |
| `TestGetUserHandler_NotFound` | `GetUserHandler` | `GetUserByIDFn` returns `repos.ErrNotFound` | `404` |
| `TestGetUserHandler_DBError` | `GetUserHandler` | `GetUserByIDFn` returns generic error | `500` |
| `TestUpdateUserHandler_HappyPath` | `UpdateUserHandler` | Valid body; `UpdateUserFn` returns updated user | `200` |
| `TestUpdateUserHandler_BadJSON` | `UpdateUserHandler` | Body is `"not-json"` | `400` |
| `TestUpdateUserHandler_EmptyName` | `UpdateUserHandler` | Body has `name: ""` | `400` |
| `TestUpdateUserHandler_NotFound` | `UpdateUserHandler` | `UpdateUserFn` returns `repos.ErrNotFound` | `404` |
| `TestUpdateUserHandler_DBError` | `UpdateUserHandler` | `UpdateUserFn` returns generic error | `500` |
| `TestDeleteUserHandler_HappyPath` | `DeleteUserHandler` | `DeleteUserFn` returns `nil` | `204` |
| `TestDeleteUserHandler_NotFound` | `DeleteUserHandler` | `DeleteUserFn` returns `repos.ErrNotFound` | `404` |
| `TestDeleteUserHandler_DBError` | `DeleteUserHandler` | `DeleteUserFn` returns generic error | `500` |
| `TestResetPasswordHandler_HappyPath` | `ResetPasswordHandler` | Valid password; `UpdatePasswordHashFn` returns nil | `204` |
| `TestResetPasswordHandler_WeakPassword` | `ResetPasswordHandler` | Password `"abc"` (fails complexity) | `400` |
| `TestResetPasswordHandler_BadJSON` | `ResetPasswordHandler` | Body is `"not-json"` | `400` |
| `TestResetPasswordHandler_NotFound` | `ResetPasswordHandler` | `UpdatePasswordHashFn` returns `repos.ErrNotFound` | `404` |

**Definition of done:** `go test ./internal/handlers/...` passes with all cases green.

---

### DASH-8 — Update frontend session check to store and use `is_admin`

**Files:**
- `src/store/user.js`
- `src/App.jsx`
- `src/components/AdminRoute.jsx` _(create this file)_

**What to do:**

**`src/store/user.js`**

Add `isAdmin: false` to the initial state. Add `setIsAdmin: (isAdmin) => set({ isAdmin })` action. Update `logout` to also reset `isAdmin: false`. Do NOT persist `isAdmin` to localStorage — it must always be re-validated from the server on load. The `partialize` option already handles this: confirm `isAdmin` is not included in the persisted slice.

**`src/App.jsx`**

In the `useEffect` that calls `GET /api/me`, the backend now returns `{ username, is_admin }` (from DASH-1). Read `res.is_admin` and call `setIsAdmin(res.is_admin)`. You will need to pull `setIsAdmin` from the store alongside `setUsername`.

**`src/components/AdminRoute.jsx`** _(new file)_

Model this on `ProtectedRoute.jsx`. It must:
1. Read `isAuthenticated`, `isAdmin`, and `isLoading` from `userLoginStore`
2. If `isLoading` → return `null` (same as `ProtectedRoute`)
3. If `!isAuthenticated` → `<Navigate to="/" replace />`
4. If `!isAdmin` → `<Navigate to="/homepage" replace />`
5. Otherwise → `<Outlet />`

```jsx
import { Navigate, Outlet } from "react-router-dom";
import { userLoginStore } from "../store/user";

function AdminRoute() {
  const isAuthenticated = userLoginStore((s) => s.isAuthenticated);
  const isAdmin = userLoginStore((s) => s.isAdmin);
  const isLoading = userLoginStore((s) => s.isLoading);

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/homepage" replace />;

  return <Outlet />;
}

export default AdminRoute;
```

**Definition of done:** Existing frontend tests pass. Navigate to `/homepage` as a non-admin and confirm you are not redirected to `/admin` when you manually type that URL.

---

### DASH-9 — Install `react-admin` and scaffold `src/admin/` directory

**Files:**
- `package.json` (via npm install)
- `src/admin/AdminApp.jsx` _(create — placeholder)_
- `src/admin/authProvider.js` _(create — placeholder)_
- `src/admin/dataProvider.js` _(create — placeholder)_
- `src/App.jsx`

**What to do:**

1. Install the dependency:
   ```bash
   npm install react-admin
   ```

2. Create `src/admin/AdminApp.jsx` as a placeholder that renders a loading state — enough to confirm the route wires up:
   ```jsx
   export default function AdminApp() {
     return <div>Admin — coming soon</div>;
   }
   ```

3. Create empty-export placeholders for `authProvider.js` and `dataProvider.js`:
   ```js
   // src/admin/authProvider.js
   export const authProvider = {};

   // src/admin/dataProvider.js
   export const dataProvider = {};
   ```

4. In `src/App.jsx`, add the `/admin/*` lazy route wrapped in `AdminRoute`. Place it **outside** the existing `<Route element={<ProtectedRoute />}>` block — `AdminRoute` handles its own auth checks:
   ```jsx
   const AdminApp = lazy(() => import("./admin/AdminApp"));

   // Inside <Routes>:
   <Route element={<AdminRoute />}>
     <Route
       path="/admin/*"
       element={
         <Suspense fallback={null}>
           <AdminApp />
         </Suspense>
       }
     />
   </Route>
   ```
   Import `AdminRoute` at the top alongside the other route guard imports.

**Definition of done:** `npm run dev` starts without errors. Navigating to `/admin` as an admin user shows "Admin — coming soon". Navigating as a non-admin redirects to `/homepage`.

---

### DASH-10 — Implement `authProvider.js`

**File:** `src/admin/authProvider.js`

**What to do:**

The `authProvider` is the contract between `react-admin` and your backend auth system. Replace the placeholder with a real implementation. Use `apiClient` from `src/utils/api.js` for all requests — it already handles `credentials: 'include'` and JSON parsing.

```js
import { apiClient } from '../utils/api';

export const authProvider = {
  login: async ({ username, password }) => {
    await apiClient('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    // apiClient throws on non-2xx, so reaching here means success
  },

  logout: async () => {
    try {
      await apiClient('/api/logout', { method: 'POST' });
    } catch (_) {
      // Ignore logout errors — clear local state regardless
    }
  },

  checkAuth: async () => {
    const user = await apiClient('/api/me');
    if (!user?.is_admin) {
      throw new Error('Not an admin');
    }
  },

  checkError: ({ status }) => {
    if (status === 401 || status === 403) {
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getIdentity: async () => {
    const user = await apiClient('/api/me');
    return {
      id: user.username,
      fullName: user.username,
    };
  },

  getPermissions: () => Promise.resolve('admin'),
};
```

**Key notes:**
- `checkAuth` is called by react-admin on every navigation inside the admin area. It must reject (throw) if the user is not an admin — this triggers a redirect to the login page.
- `checkError` tells react-admin when an API error means the session has expired. `401` and `403` both trigger a logout.
- `apiClient` throws on non-2xx responses, so you do not need to check `response.ok` manually.

**Definition of done:** Navigating to `/admin` when not logged in redirects to the react-admin login page. Logging in as a non-admin redirects away. Logging in as an admin lands on the admin dashboard.

---

### DASH-11 — Implement `dataProvider.js`

**File:** `src/admin/dataProvider.js`

**What to do:**

The `dataProvider` maps react-admin's generic CRUD methods to your specific API endpoints. Only the `users` resource is supported.

react-admin calls these methods automatically when rendering list, show, and edit views. The return values must match the shapes below exactly — react-admin will break silently if `data` or `total` are missing or wrongly named.

```js
import { apiClient } from '../utils/api';

export const dataProvider = {
  // Called by <List> — renders the user table
  getList: async (resource, { pagination, sort }) => {
    const { page, perPage } = pagination;
    const data = await apiClient(
      `/api/admin/users?page=${page}&limit=${perPage}`
    );
    return {
      data: data.users,          // array of records, each must have an `id` field
      total: data.pagination.total,
    };
  },

  // Called by <Show> and <Edit> on load
  getOne: async (resource, { id }) => {
    const data = await apiClient(`/api/admin/users/${id}`);
    return { data };
  },

  // Called by <Edit> on save
  update: async (resource, { id, data }) => {
    const updated = await apiClient(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        is_admin: data.is_admin,
      }),
    });
    return { data: updated };
  },

  // Called by <List> delete button and <Edit> delete button
  delete: async (resource, { id }) => {
    await apiClient(`/api/admin/users/${id}`, { method: 'DELETE' });
    return { data: { id } };
  },

  // Not supported — users are created via /api/signup
  create: async () => {
    throw new Error('Creating users via admin is not supported');
  },

  // Bulk delete — delegate to single delete
  deleteMany: async (resource, { ids }) => {
    await Promise.all(
      ids.map((id) =>
        apiClient(`/api/admin/users/${id}`, { method: 'DELETE' })
      )
    );
    return { data: ids };
  },

  // Not used but required by react-admin interface
  getMany: async (resource, { ids }) => {
    const users = await Promise.all(
      ids.map((id) => apiClient(`/api/admin/users/${id}`))
    );
    return { data: users };
  },

  getManyReference: async () => ({ data: [], total: 0 }),
  updateMany: async () => ({ data: [] }),
};
```

**Key notes:**
- react-admin expects every record to have an `id` field. Your `User` model already has `id` as a UUID string — this matches.
- The `apiClient` in `src/utils/api.js` throws on non-2xx. react-admin will catch these and display error notifications automatically.
- `DELETE` returns `204 No Content` from the server — `apiClient` returns `null` for 204. The dataProvider must still return `{ data: { id } }` for react-admin to update its local cache.

**Definition of done:** The user list renders in the admin UI showing real data from the database.

---

### DASH-12 — Build `AdminApp.jsx` with User List, Edit, and Show views

**File:** `src/admin/AdminApp.jsx`

**What to do:**

Replace the placeholder with a real `react-admin` `<Admin>` setup.

```jsx
import { Admin, Resource, List, Datagrid, TextField, EmailField,
         BooleanField, DateField, Edit, SimpleForm, TextInput,
         BooleanInput, Show, SimpleShowLayout } from 'react-admin';
import { authProvider } from './authProvider';
import { dataProvider } from './dataProvider';

// --- User List view ---
const UserList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <TextField source="name" label="Username" />
      <EmailField source="email" />
      <BooleanField source="is_admin" label="Admin" />
      <DateField source="created_at" label="Created" />
    </Datagrid>
  </List>
);

// --- User Edit view ---
const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" label="Username" required />
      <TextInput source="email" type="email" required />
      <BooleanInput source="is_admin" label="Admin" />
    </SimpleForm>
  </Edit>
);

// --- User Show view ---
const UserShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" label="Username" />
      <EmailField source="email" />
      <BooleanField source="is_admin" label="Admin" />
      <DateField source="created_at" label="Created" />
      <DateField source="updated_at" label="Updated" />
    </SimpleShowLayout>
  </Show>
);

// --- Root Admin app ---
export default function AdminApp() {
  return (
    <Admin
      authProvider={authProvider}
      dataProvider={dataProvider}
      basename="/admin"
    >
      <Resource
        name="users"
        list={UserList}
        edit={UserEdit}
        show={UserShow}
      />
    </Admin>
  );
}
```

**Key note — `basename`:** react-admin needs to know it is mounted at `/admin` so its internal routing does not conflict with the portfolio's router. Pass `basename="/admin"` to `<Admin>`.

**Key note — react-admin and react-router:** react-admin v5 ships its own internal router. Because your app already uses `react-router-dom`, you may need to pass `<Admin disableTelemetry>` and potentially wrap with `<BrowserRouter>` inside `AdminApp` if conflicts arise. Check the react-admin docs for "Custom routing" if you hit issues.

**Definition of done:** User list renders, clicking a row opens the edit form, saving updates the record, and the delete button removes a user. All actions reflect in the database.

---

### DASH-13 — Add Reset Password custom action to `UserEdit`

**File:** `src/admin/AdminApp.jsx`

**What to do:**

React-admin's `<Edit>` form handles the standard `PUT` update. Reset password is a separate out-of-band action — it does not go through the dataProvider. Implement it as a custom toolbar button that opens an inline form.

**Step 1 — Create a `ResetPasswordButton` component** inside `AdminApp.jsx` (or in a separate `src/admin/ResetPasswordButton.jsx` if you prefer):

```jsx
import { useState } from 'react';
import { useRecordContext, useNotify } from 'react-admin';
import { apiClient } from '../utils/api';

const ResetPasswordButton = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiClient(`/api/admin/users/${record.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      notify('Password updated', { type: 'success' });
      setOpen(false);
      setPassword('');
    } catch (err) {
      notify(err.message || 'Failed to reset password', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return <button onClick={() => setOpen(true)}>Reset Password</button>;
  }

  return (
    <div>
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleSubmit} disabled={loading || !password}>
        {loading ? 'Saving…' : 'Confirm'}
      </button>
      <button onClick={() => setOpen(false)}>Cancel</button>
    </div>
  );
};
```

**Step 2 — Add a custom toolbar to `UserEdit`:**

```jsx
import { Toolbar, SaveButton } from 'react-admin';

const UserEditToolbar = () => (
  <Toolbar>
    <SaveButton />
    <ResetPasswordButton />
  </Toolbar>
);

const UserEdit = () => (
  <Edit>
    <SimpleForm toolbar={<UserEditToolbar />}>
      <TextInput source="name" label="Username" required />
      <TextInput source="email" type="email" required />
      <BooleanInput source="is_admin" label="Admin" />
    </SimpleForm>
  </Edit>
);
```

**Key notes:**
- `useRecordContext()` gives access to the currently loaded user record, including its `id`. This hook only works inside a react-admin `<Edit>` or `<Show>` context.
- `useNotify()` is react-admin's toast notification system — use it for success and error feedback instead of `alert()`.
- The password input here is intentionally minimal — no custom styling. You can improve the UX once it's working.

**Definition of done:** On the user edit page, a "Reset Password" button is visible. Entering a valid password and confirming calls `POST /api/admin/users/{id}/reset-password` and shows a success notification. An invalid password (too weak) shows the server error message.

---

### DASH-14 — Integration tests for new admin API endpoints

**File:** `server/cmd/integration_test.go` _(append to existing file — do not add the build tag again)_

**Run command:** `go test -tags integration ./cmd/...`

**Setup:** Use the `makeAdminServer` helper pattern described in `admin-users-story.md` (ADMIN-6). You will need both an admin session cookie and a regular user session cookie for the auth enforcement tests.

**Test cases:**

**`GET /api/admin/users/{id}`**

| Test name | Setup | Expected status |
|---|---|---|
| `TestIntegration_GetUser_Unauthenticated` | No cookie | `401` |
| `TestIntegration_GetUser_NonAdmin` | Regular user session | `403` |
| `TestIntegration_GetUser_Found` | Admin session; seed a user; use their ID | `200` + assert `id` and `name` in body |
| `TestIntegration_GetUser_NotFound` | Admin session; use a random UUID | `404` |

**`PUT /api/admin/users/{id}`**

| Test name | Setup | Expected status |
|---|---|---|
| `TestIntegration_UpdateUser_HappyPath` | Admin session; seed a user; send valid body | `200` + assert updated `name` in response |
| `TestIntegration_UpdateUser_NotFound` | Admin session; random UUID | `404` |
| `TestIntegration_UpdateUser_BadBody` | Admin session; body is `"not-json"` | `400` |

**`DELETE /api/admin/users/{id}`**

| Test name | Setup | Expected status |
|---|---|---|
| `TestIntegration_DeleteUser_HappyPath` | Admin session; seed a user; delete them | `204` + confirm subsequent GET returns `404` |
| `TestIntegration_DeleteUser_NotFound` | Admin session; random UUID | `404` |

**`POST /api/admin/users/{id}/reset-password`**

| Test name | Setup | Expected status |
|---|---|---|
| `TestIntegration_ResetPassword_HappyPath` | Admin session; seed a user; send valid password | `204` + confirm user can log in with new password |
| `TestIntegration_ResetPassword_WeakPassword` | Admin session; send `"abc"` as password | `400` |
| `TestIntegration_ResetPassword_NotFound` | Admin session; random UUID | `404` |

**Confirm login after reset pattern:**

```go
// After calling reset-password, confirm the new credentials work:
loginResp := post(t, srv.URL+"/api/login", map[string]string{
    "username": seededUsername,
    "password": "NewValidP@ss1",
}, nil)
if loginResp.StatusCode != http.StatusOK {
    t.Errorf("login after reset: got %d, want %d", loginResp.StatusCode, http.StatusOK)
}
```

**Definition of done:** `go test -tags integration ./cmd/...` passes with all cases green.

---

## Implementation Order

```
DASH-1                                         ← fix /api/me response first; unblocks DASH-8
  └─ DASH-8  → DASH-9  → DASH-10 → DASH-11    ← frontend chain
               → DASH-12 → DASH-13             ← admin UI

DASH-2  → DASH-3  → DASH-4  → DASH-5          ← interface + stubs (can run in parallel with frontend)
  └─ DASH-6  → DASH-7  → DASH-14              ← implement + test backend
```

DASH-2 through DASH-7 (backend) and DASH-8 through DASH-9 (frontend scaffolding) can be worked in parallel once DASH-1 is merged.

---

## Reference: How to run tests

```bash
# Unit tests (no DB required)
go test ./...

# Integration tests (requires Docker)
go test -tags integration ./cmd/...

# Frontend dev
npm run dev
```
