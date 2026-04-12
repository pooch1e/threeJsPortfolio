package utils

import (
	"log/slog"
	"regexp"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

var usernameRegex = regexp.MustCompile(`^[a-z0-9]+$`)
var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

func ValidateUsername(username string) (string, bool) {
	// username must contain lowercase characters
	cleaned := strings.ToLower(username)
	if !usernameRegex.MatchString(cleaned) {
		return "", false
	}
	return cleaned, true
}

func ValidateEmail(email string) (string, bool) {
	if !emailRegex.MatchString(email) {
		return "", false
	}
	return email, true
}

func ValidatePassword(password string) ([]byte, bool) {
	if len(password) < 8 {
		return nil, false
	}
	lower := regexp.MustCompile(`[a-z]`)
	upper := regexp.MustCompile(`[A-Z]`)
	digit := regexp.MustCompile(`\d`)
	special := regexp.MustCompile(`[@$!%*?&]`)

	var pCheck bool = false

	if lower.MatchString(password) &&
		upper.MatchString(password) &&
		digit.MatchString(password) &&
		special.MatchString(password) {
		pCheck = true
	}
	hPassword := hashPassword(password)
	return hPassword, pCheck
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
