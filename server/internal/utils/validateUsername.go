package utils

import (
	"regexp"
	"strings"
)

var usernameRegex = regexp.MustCompile(`^[a-z0-9]+$`)

func ValidateUsername(username string) (string, bool) {
	// username must contain lowercase characters
	cleaned := strings.ToLower(username)
	if !usernameRegex.MatchString(cleaned) {
		return "", false
	}
	return cleaned, true
}
