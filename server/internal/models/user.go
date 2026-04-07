package models

// handles user/session structs and models

import (
	"database/sql"
	"log/slog"
	"time"
)

type NewUser struct {
	Username      string
	Email         string
	Password_hash []byte
}

type User struct {
	ID           string    `json:"id"`
	GithubID     string    `json:"github_id,omitempty"`
	Name         string    `json:"name"`
	Email        string    `json:"email,omitempty"`
	AvatarURL    string    `json:"avatar_url,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	PasswordHash string    `json:"password_hash"`
}

type Session struct {
	ID        string    `json:"id"`
	Token     string    `json:"token"`
	UserId    string    `json:"user_id"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

func CheckUserExists(db *sql.DB, email string) (bool, error) {
	var exists bool
	err := db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`, email).Scan(&exists)
	if err != nil {
		slog.Error("Error checking if user exists", "error", err)
		return false, err
	}
	return exists, nil
}

func InsertNewUser(db *sql.DB, user NewUser) (sql.Result, error) {
	insertedNewUser, err := db.Exec(`INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)`, user.Username, user.Email, user.Password_hash)
	if err != nil {
		slog.Error("Error inserting into database", "error", err)
	}
	return insertedNewUser, err
}
