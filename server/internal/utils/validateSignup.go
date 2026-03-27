package utils

import (
	"regexp"
	"strings"
)

var usernameRegex = regexp.MustCompile(`^[a-z0-9]+$`)
var emailRegex = regexp.MustCompile(`/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/`)

// must contain 8 chars, one upper case, one special
var passwordRegex = regexp.MustCompile(`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$`)

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

func ValidatePassword(password string) (string, bool) {
	if !passwordRegex.MatchString(password) {
		return "", false
	}
	return password, true
}
