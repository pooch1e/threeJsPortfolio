package models

// handles user/session structs and models

import "time"

type NewUser struct {
	Username string
	Email    string
	Password string
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

func InsertNewUser(user NewUser) (ResultType, error) {

}
