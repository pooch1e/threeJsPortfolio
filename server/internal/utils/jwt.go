package utils

import (
	"log/slog"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
  t   *jwt.Token
  s   string
)


func GenerateJwtToken(secret string, userID string) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	s, err := token.SignedString([]byte(secret))
	if err != nil {
		slog.Error("Error in signing token", "error", err)
	}
	return s, err
}
