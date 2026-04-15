package utils

import (
	"fmt"
	"log/slog"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// GenerateJwtToken creates a signed HS256 JWT containing the user's ID.
// The token expires in 1 hour.
func GenerateJwtToken(secret string, userID string) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID,
		"iat": time.Now().Unix(),                // issued at
		"exp": time.Now().Add(time.Hour).Unix(), // expires at
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		slog.Error("Error signing JWT", "error", err)
	}
	return signed, err
}

// ParseJwtToken validates a JWT string and returns the userID stored in the "sub" claim.
// Returns an error if the token is invalid, expired, or tampered with.
func ParseJwtToken(tokenStr string, secret string) (string, error) {
	// jwt.Parse validates the signature AND the standard claims (exp, iat, etc.)
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		// This callback is called by the library to get the signing key.
		// We must check that the algorithm is what we expect - otherwise an attacker
		// could send a token signed with "none" or a different algorithm.
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return "", err
	}

	// token.Claims is an interface{} - we assert it to jwt.MapClaims to read values
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return "", fmt.Errorf("invalid token claims")
	}

	// "sub" is stored as a string (the user UUID we put in during generation)
	userID, ok := claims["sub"].(string)
	if !ok || userID == "" {
		return "", fmt.Errorf("missing sub claim")
	}

	return userID, nil
}
