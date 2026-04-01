package utils

import (
	"regexp"
	"strings"
)

var usernameRegex = regexp.MustCompile(`^[a-z0-9]+$`)
var emailRegex = regexp.MustCompile(`/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/`)


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
	if len(password) < 8 {
		return  "", false
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
	return password, pCheck
}
