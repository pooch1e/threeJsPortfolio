# Repository

Data access layer for the ThreeJS Portfolio API. Handlers and middleware depend on the `UserRepository` **interface**, not `*sql.DB` directly. This keeps business logic decoupled from the database and enables mock-based unit testing.

## Interface (`interface.go`)

```go
type UserRepository interface {
    CheckUserExists(email string) (bool, error)
    InsertNewUser(user models.NewUser) (*models.User, error)
    GetUserByID(id string) (*models.User, error)
    GetUserByUsername(username string) (*models.User, error)
}
```

## Production Implementation: `PostgresUserRepo` (`user.go`)

Raw SQL queries via `database/sql` — no ORM.

| Method | SQL | Notes |
|--------|-----|-------|
| `CheckUserExists` | `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)` | Duplicate email guard on signup |
| `InsertNewUser` | `INSERT INTO users ... RETURNING ...` | Returns the full created user |
| `GetUserByID` | `SELECT id, name, email, ... FROM users WHERE id = $1` | **Does not select `password_hash`** — no reason to load it for profile display |
| `GetUserByUsername` | `SELECT id, name, email, password_hash, ... FROM users WHERE name = $1` | **Does select `password_hash`** — needed for bcrypt comparison at login |

## Error Handling

`ErrNotFound` is a sentinel error returned when a query returns no rows:

```go
var ErrNotFound = errors.New("record not found")
```

Callers distinguish missing records from DB failures:
```go
user, err := repo.GetUserByID(id)
if errors.Is(err, repos.ErrNotFound) {
    // 404 / 401 response
}
```

## Test Implementation: `MockUserRepo` (`testutil/`)

An in-memory mock implementing `UserRepository`. Used by all unit tests in `internal/handlers/` and `internal/middleware/`. No database required.

## Constructor

```go
func NewPostgresUserRepo(db *sql.DB) UserRepository {
    return &PostgresUserRepo{db: db}
}
```

Called once at startup in `cmd/main.go` and injected into all handlers and middleware via the `application` struct.
