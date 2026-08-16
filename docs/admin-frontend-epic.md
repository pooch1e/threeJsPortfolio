# Epic: Admin Dashboard Frontend

Branch: `feat/admin-dashboard-frontend`

## Context

This supersedes the frontend portion of `server/admin-dashboard-story.md` (DASH-8
through DASH-13), which was drafted before the backend landed and has since drifted
from the real API shapes and the real frontend route structure. Read the tables
below, not that doc's frontend code samples — the backend contracts and file layout
have both changed since it was written.

### Backend: already complete, verified against current code

| Endpoint | Auth | Request | Response |
|---|---|---|---|
| `GET /api/me` | session cookie | — | `{ username, is_admin }` |
| `GET /api/admin/users?page=&limit=` | admin | — | `{ users: User[], pagination: { page, limit, total, total_pages } }` |
| `GET /api/admin/users/{id}` | admin | — | raw `User` object |
| `PUT /api/admin/users/{id}` | admin | `{ name, email, is_admin }` | updated `User` object, `200` |
| `DELETE /api/admin/users/{id}` | admin | — | `200`, body is the JSON string `"Successfully deleted user"` (**not** `204`) |
| `POST /api/admin/users/{id}/passwordReset` | admin | `{ password }` | `200`, body is the JSON string `"Successfully updated password"` (**not** `204`, **not** `/reset-password`) |

`User` shape: `{ id, name, email, avatar_url, is_admin, created_at, updated_at }` (no `github_id`/password fields serialized).

Auth failures: `401` unauthenticated, `403` authenticated-but-not-admin — both via `RequireAuth` + `RequireAdmin(repo)` middleware, already wired in `server/cmd/api.go`.

**Known backend gap, out of scope here:** `server/cmd/integration_test.go` only has integration coverage for `ListUsers` (`TestIntegration_ListUsers_*`). `GetUser`/`UpdateUser`/`DeleteUser`/`passwordReset` have unit tests (mocked repo) but no integration tests against real Postgres. Worth a follow-up ticket, not blocking the UI.

### Frontend: not started

Verified current state — none of this exists yet:
- `src/store/user.js` has no `isAdmin`
- No `AdminRoute` component (only `ProtectedRoute` and `PublicOnlyRoute` exist)
- `react-admin` is not installed
- No `src/admin/` directory
- `src/App.jsx` routes are `HomePage` and `ExperienceView` (lazy) under `ProtectedRoute`, plus `SignUpPage`/`Login` under `PublicOnlyRoute` — no admin route

---

## Stories

### FE-1 — Add `isAdmin` to the session store

**Files:** `src/store/user.js`, `src/App.jsx`

- Add `isAdmin: false` to initial state.
- Add `setIsAdmin: (isAdmin) => set({ isAdmin })`.
- `logout()` also resets `isAdmin: false`.
- Confirm `partialize` still only persists `{ username: state.username }` — `isAdmin` must never hit `localStorage`, it's re-derived from the server every load.
- In `App.jsx`'s existing `/api/me` effect, pull `setIsAdmin` from the store and call `setIsAdmin(res.is_admin)` alongside the existing `setUsername` call.

**DoD:** logging in as an admin and inspecting the store (React devtools or a temporary console.log) shows `isAdmin: true`; logging out resets it.

---

### FE-2 — `AdminRoute` guard

**Files:** `src/components/AdminRoute.jsx` (new)

Model on `src/components/ProtectedRoute.jsx`:
- `isLoading` → `return null` (matches `PublicOnlyRoute`'s loading behavior; `ProtectedRoute` shows `<LoadingOverlay />` instead — either is fine, pick one and be consistent)
- `!isAuthenticated` → `<Navigate to="/" replace />`
- `isAuthenticated && !isAdmin` → `<Navigate to="/homepage" replace />`
- otherwise → `<Outlet />`

**DoD:** manually typing `/admin` while logged out redirects to `/`; while logged in as a non-admin redirects to `/homepage`.

---

### FE-3 — Install react-admin, scaffold `src/admin/`, wire the route

**Files:** `package.json`, `src/admin/AdminApp.jsx` (placeholder), `src/admin/authProvider.js` (placeholder), `src/admin/dataProvider.js` (placeholder), `src/App.jsx`

1. `npm install react-admin`
2. Placeholder `AdminApp.jsx` rendering `<div>Admin — coming soon</div>` to confirm wiring before building real views.
3. Empty-export placeholders for `authProvider`/`dataProvider`.
4. In `App.jsx`, add the admin branch as its **own** top-level `<Route>` guarded by `AdminRoute` — not nested inside the existing `ProtectedRoute` block, since `AdminRoute` does its own auth+role check:

   ```jsx
   const AdminApp = lazy(() => import("./admin/AdminApp"));

   <Route element={<AdminRoute />}>
     <Route
       path="/admin/*"
       element={
         <Suspense fallback={<LoadingOverlay />}>
           <AdminApp />
         </Suspense>
       }
     />
   </Route>
   ```

**DoD:** `npm run dev` starts clean; `/admin` as an admin shows the placeholder; as non-admin redirects to `/homepage`.

---

### FE-4 — `authProvider.js`

**File:** `src/admin/authProvider.js`

Use the existing `apiClient` from `src/utils/api.js` (already does `credentials: 'include'` and throws on non-2xx).

- `login({ username, password })` → `POST /api/login`
- `logout()` → `POST /api/logout`, swallow errors (clear local state regardless)
- `checkAuth()` → `GET /api/me`; throw if `!user.is_admin` (react-admin uses this to redirect to its login screen on every nav)
- `checkError({ status })` → reject on `401`/`403` (triggers react-admin logout)
- `getIdentity()` → `{ id: user.username, fullName: user.username }`
- `getPermissions()` → resolve `'admin'`

**DoD:** logged-out visit to `/admin` bounces to react-admin's login; logging in as non-admin bounces back out; logging in as admin lands on the dashboard.

---

### FE-5 — `dataProvider.js`

**File:** `src/admin/dataProvider.js`

Only the `users` resource. Map to the **actual** endpoint shapes from the table above — this is where the original draft doc is wrong (it assumed `/reset-password` and `204` responses for delete/reset):

- `getList(resource, { pagination })` → `GET /api/admin/users?page=&limit=` → `{ data: res.users, total: res.pagination.total }`
- `getOne(resource, { id })` → `GET /api/admin/users/{id}` → `{ data: res }` (already a raw user, no unwrapping needed)
- `update(resource, { id, data })` → `PUT /api/admin/users/{id}` with `{ name, email, is_admin }` → `{ data: res }`
- `delete(resource, { id })` → `DELETE /api/admin/users/{id}` → **ignore the response body** (it's a string, not the record) and return `{ data: { id } }` yourself
- `deleteMany(resource, { ids })` → `Promise.all` of individual deletes → `{ data: ids }`
- `getMany(resource, { ids })` → `Promise.all` of individual `getOne`s
- `create` → throw (`"Creating users via admin is not supported"` — users are created via `/api/signup`)
- `getManyReference`/`updateMany` → unused stubs (`{ data: [], total: 0 }` / `{ data: [] }`) — required by the interface, never called by the `users`-only UI

**DoD:** user list renders real DB data with correct total/pagination; editing and saving a user persists; deleting removes the row.

---

### FE-6 — `AdminApp.jsx`: List, Edit, Show views

**File:** `src/admin/AdminApp.jsx`

Standard `react-admin` `<Admin>` + `<Resource name="users">` with:
- **List**: `id`, `name` (label "Username"), `email`, `is_admin` (label "Admin"), `created_at` — datagrid, `rowClick="edit"`
- **Edit**: `name`, `email`, `is_admin` fields, `SimpleForm`
- **Show**: same fields plus `updated_at`

Pass `basename="/admin"` to `<Admin>` so react-admin's internal routing doesn't collide with the app's `react-router-dom` setup.

**Watch for:** react-admin v5 + the app's existing `react-router-dom` — if navigation inside `/admin` breaks or double-mounts a router, check react-admin's "custom routing" docs before reaching for a workaround.

**DoD:** list → edit → save → back to list round-trips against the real API; delete works from both the list row action and the edit page.

---

### FE-7 — Reset-password action

**File:** `src/admin/AdminApp.jsx` (or split into `src/admin/ResetPasswordButton.jsx`)

Out-of-band action, not part of the `dataProvider` — react-admin's `<Edit>` toolbar only knows how to `PUT`. Add a custom toolbar button:
- `useRecordContext()` for the current user's `id`
- inline password input + confirm/cancel
- `POST /api/admin/users/{id}/passwordReset` with `{ password }` — **note the exact path**, it is not `/reset-password`
- `useNotify()` for success/failure toasts; surface the server's validation message on `400` (weak password)

**DoD:** valid password shows a success toast and clears the field; a weak password (fails the same complexity rules as signup) shows the server's error message inline via the toast.

---

## Implementation order

```
FE-1 → FE-2 → FE-3 → FE-4 → FE-5 → FE-6 → FE-7
```

Mostly linear — FE-1/FE-2 (auth plumbing) and FE-3 (scaffolding) unblock everything else; FE-4/FE-5 (providers) unblock FE-6; FE-7 depends on FE-6's `Edit` view existing.

## Verification

Per `CLAUDE.md`, this is a frontend/UI change — after FE-7, actually run `npm run dev`, log in as an admin, and click through list → edit → save, delete, and reset-password before calling the epic done. Type-checking (there is none — no TypeScript) and lint aren't a substitute for exercising the UI.
