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
		RETURNING id, name, email, is_admin, created_at, updated_at`,
		user.Username, user.Email, user.Password_hash,
	).Scan(&createdUser.ID, &createdUser.Name, &createdUser.Email, &createdUser.IsAdmin, &createdUser.CreatedAt, &createdUser.UpdatedAt)

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
		`SELECT id, name, email, is_admin, created_at, updated_at
		 FROM users WHERE id = $1`,
		id,
	).Scan(&user.ID, &user.Name, &user.Email, &user.IsAdmin, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		slog.Error("Error getting user by ID", "error", err)
		return nil, err
	}
	return &user, nil
}

// GetAllUsers retrieves a paginated list of users ordered by creation date
func GetAllUsers(db *sql.DB, limit, offset int) ([]models.User, error) {
	rows, err := db.Query(
		`SELECT id, name, email, avatar_url, is_admin, created_at, updated_at
		 FROM users
		 ORDER BY created_at DESC
		 LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		slog.Error("Error getting all users", "error", err)
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.AvatarURL, &u.IsAdmin, &u.CreatedAt, &u.UpdatedAt); err != nil {
			slog.Error("Error scanning user row", "error", err)
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

// GetUserCount returns the total number of users in the database
func GetUserCount(db *sql.DB) (int, error) {
	var count int
	err := db.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&count)
	if err != nil {
		slog.Error("Error counting users", "error", err)
		return 0, err
	}
	return count, nil
}

// GetUserByUsername retrieves a user by their username
func GetUserByUsername(db *sql.DB, username string) (*models.User, error) {
	var user models.User
	err := db.QueryRow(
		`SELECT id, name, email, password_hash, is_admin, created_at, updated_at
		 FROM users WHERE name = $1`,
		username,
	).Scan(&user.ID, &user.Name, &user.Email, &user.Password_hash, &user.IsAdmin, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		slog.Error("Error getting user by username", "error", err)
		return nil, err
	}
	return &user, nil
}
