package utils

import (
	"log/slog"
	"regexp"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

var usernameRegex = regexp.MustCompile(`^[a-z0-9]+$`)
var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

func ValidateUsername(username string) (string, string) {
	// username must contain lowercase characters
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

func ValidatePassword(password string) ([]byte, string) {
	if len(password) < 8 {
		return nil, "Password must be at least 8 characters"
	}

	lower := regexp.MustCompile(`[a-z]`)
	upper := regexp.MustCompile(`[A-Z]`)
	digit := regexp.MustCompile(`\d`)
	special := regexp.MustCompile(`[@$!%*?&]`)

	if !lower.MatchString(password) {
		return nil, "Password must contain a lowercase letter"
	}
	if !upper.MatchString(password) {
		return nil, "Password must contain an uppercase letter"
	}
	if !digit.MatchString(password) {
		return nil, "Password must contain a number"
	}
	if !special.MatchString(password) {
		return nil, "Password must contain a special character (@$!%*?&)"
	}

	return hashPassword(password), ""
}

func hashPassword(password string) []byte {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		slog.Error("Error in hashing password", "error", err)
	}
	return hashed
}

// CheckPasswordHash compares a plain text password with a hashed password
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
