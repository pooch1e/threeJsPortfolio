package repos

import (
	"database/sql"
	"errors"
	"log/slog"

	"threejsPortfolioServer/internal/models"
)

// ErrNotFound is returned when a requested record does not exist.
// Callers use errors.Is(err, repos.ErrNotFound) to distinguish "not found"
// from genuine database failures so they can return the correct HTTP status.
var ErrNotFound = errors.New("not found")

// PostgresUserRepo is the production implementation of UserRepository backed
// by a PostgreSQL database.
type PostgresUserRepo struct {
	db *sql.DB
}

// NewPostgresUserRepo creates a PostgresUserRepo. The caller retains ownership
// of db and is responsible for closing it.
func NewPostgresUserRepo(db *sql.DB) *PostgresUserRepo {
	return &PostgresUserRepo{db: db}
}

func (r *PostgresUserRepo) CheckUserExists(email string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`, email,
	).Scan(&exists)
	if err != nil {
		slog.Error("Error checking if user exists", "error", err)
		return false, err
	}
	return exists, nil
}

func (r *PostgresUserRepo) InsertNewUser(user models.NewUser) (*models.User, error) {
	var created models.User
	err := r.db.QueryRow(
		`INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
		 RETURNING id, name, email, is_admin, created_at, updated_at`,
		user.Username, user.Email, user.Password_hash,
	).Scan(
		&created.ID, &created.Name, &created.Email,
		&created.IsAdmin, &created.CreatedAt, &created.UpdatedAt,
	)
	if err != nil {
		slog.Error("Error inserting user", "error", err)
		return nil, err
	}
	return &created, nil
}

func (r *PostgresUserRepo) GetUserByID(id string) (*models.User, error) {
	var user models.User
	err := r.db.QueryRow(
		`SELECT id, name, email, is_admin, created_at, updated_at
		 FROM users WHERE id = $1`,
		id,
	).Scan(
		&user.ID, &user.Name, &user.Email,
		&user.IsAdmin, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		slog.Error("Error getting user by ID", "error", err)
		return nil, err
	}
	return &user, nil
}

func (r *PostgresUserRepo) GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	err := r.db.QueryRow(
		`SELECT id, name, email, password_hash, is_admin, created_at, updated_at
		 FROM users WHERE name = $1`,
		username,
	).Scan(
		&user.ID, &user.Name, &user.Email, &user.Password_hash,
		&user.IsAdmin, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		slog.Error("Error getting user by username", "error", err)
		return nil, err
	}
	return &user, nil
}
