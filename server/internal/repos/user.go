package repos

import (
	"database/sql"
	"log/slog"
	"threejsPortfolioServer/internal/models"
)

// CheckUserExists checks if a user with the given email exists in the database
func CheckUserExists(db *sql.DB, email string) (bool, error) {
	var exists bool
	err := db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`, email).Scan(&exists)
	if err != nil {
		slog.Error("Error checking if user exists", "error", err)
		return false, err
	}
	return exists, nil
}

// InsertNewUser creates a new user in the database
func InsertNewUser(db *sql.DB, user models.NewUser) (*models.User, error) {
	var createdUser models.User
	err := db.QueryRow(
		`INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
		RETURNING id, name, email, created_at, updated_at`,
		user.Username, user.Email, user.Password_hash,
	).Scan(&createdUser.ID, &createdUser.Name, &createdUser.Email, &createdUser.CreatedAt, &createdUser.UpdatedAt)

	if err != nil {
		slog.Error("Error inserting into database", "error", err)
		return nil, err
	}
	return &createdUser, nil
}

// GetUserByID retrieves a user by their UUID (used by /api/me after JWT validation)
func GetUserByID(db *sql.DB, id string) (*models.User, error) {
	var user models.User
	err := db.QueryRow(
		`SELECT id, name, email, created_at, updated_at
		 FROM users WHERE id = $1`,
		id,
	).Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		slog.Error("Error getting user by ID", "error", err)
		return nil, err
	}
	return &user, nil
}

// GetUserByUsername retrieves a user by their username
func GetUserByUsername(db *sql.DB, username string) (*models.User, error) {
	var user models.User
	err := db.QueryRow(
		`SELECT id, name, email, password_hash, created_at, updated_at
		 FROM users WHERE name = $1`,
		username,
	).Scan(&user.ID, &user.Name, &user.Email, &user.Password_hash, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		slog.Error("Error getting user by username", "error", err)
		return nil, err
	}
	return &user, nil
}
