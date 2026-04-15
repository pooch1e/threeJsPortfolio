package models

// Package models defines the data structures used throughout the application.
// This package contains only type definitions - no database or business logic.

import "time"

// NewUser represents the data required to create a new user account
type NewUser struct {
	Username      string
	Email         string
	Password_hash []byte
}

// User represents a user in the system
type User struct {
	ID            string    `json:"id"`
	GithubID      string    `json:"github_id,omitempty"`
	Name          string    `json:"name"`
	Email         string    `json:"email,omitempty"`
	AvatarURL     string    `json:"avatar_url,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	Password_hash []byte    `json:"-"` // For database operations, never serialized to JSON
}

// Session represents an authenticated user session
type Session struct {
	ID        string    `json:"id"`
	Token     string    `json:"token"`
	UserId    string    `json:"user_id"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}
