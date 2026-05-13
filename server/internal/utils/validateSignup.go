package utils

import (
	"fmt"
	"log/slog"
	"regexp"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

var (
	usernameRegex = regexp.MustCompile(`^[a-z0-9]+$`)
	emailRegex    = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	lowerRegex    = regexp.MustCompile(`[a-z]`)
	upperRegex    = regexp.MustCompile(`[A-Z]`)
	digitRegex    = regexp.MustCompile(`\d`)
	specialRegex  = regexp.MustCompile(`[@$!%*?&]`)
)

func ValidateUsername(username string) (string, string) {
	cleaned := strings.ToLower(username)
	if !usernameRegex.MatchString(cleaned) {
		return "", "Username must only contain lowercase letters and numbers"
	}
	return cleaned, ""
}

func ValidateEmail(email string) (string, string) {
	if !emailRegex.MatchString(email) {
		return "", "Invalid email format"
	}
	return email, ""
}

// ValidatePasswordRules checks password complexity without hashing.
// Returns an empty string on success, or a human-readable error message on failure.
// This is separated from HashPassword so validation logic can be tested without
// paying the bcrypt cost.
func ValidatePasswordRules(password string) string {
	if len(password) < 8 {
		return "Password must be at least 8 characters"
	}
	if !lowerRegex.MatchString(password) {
		return "Password must contain a lowercase letter"
	}
	if !upperRegex.MatchString(password) {
		return "Password must contain an uppercase letter"
	}
	if !digitRegex.MatchString(password) {
		return "Password must contain a number"
	}
	if !specialRegex.MatchString(password) {
		return "Password must contain a special character (@$!%*?&)"
	}
	return ""
}

// HashPassword bcrypt-hashes a plaintext password at DefaultCost.
// The caller must validate the password with ValidatePasswordRules before calling.
func HashPassword(password string) ([]byte, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hashing password: %w", err)
	}
	return hashed, nil
}

// ValidatePassword validates the password rules and hashes it in one step.
// Returns (hash, "") on success, (nil, errMsg) on any failure.
// Prefer calling ValidatePasswordRules + HashPassword separately in new code.
func ValidatePassword(password string) ([]byte, string) {
	if msg := ValidatePasswordRules(password); msg != "" {
		return nil, msg
	}
	hashed, err := HashPassword(password)
	if err != nil {
		slog.Error("Error hashing password", "error", err)
		return nil, "Internal error hashing password"
	}
	return hashed, ""
}

// CheckPasswordHash compares a plaintext password against a bcrypt hash.
func CheckPasswordHash(password, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}
