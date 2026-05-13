package utils_test

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"threejsPortfolioServer/internal/utils"
)

const jwtTestSecret = "test-secret-key-for-jwt"

func TestGenerateAndParseJwtToken_RoundTrip(t *testing.T) {
	userID := "user-abc-123"
	token, err := utils.GenerateJwtToken(jwtTestSecret, userID)
	if err != nil {
		t.Fatalf("GenerateJwtToken: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}

	got, err := utils.ParseJwtToken(token, jwtTestSecret)
	if err != nil {
		t.Fatalf("ParseJwtToken: %v", err)
	}
	if got != userID {
		t.Errorf("sub claim: got %q, want %q", got, userID)
	}
}

func TestParseJwtToken_WrongSecret(t *testing.T) {
	token, err := utils.GenerateJwtToken(jwtTestSecret, "user-123")
	if err != nil {
		t.Fatalf("GenerateJwtToken: %v", err)
	}
	_, err = utils.ParseJwtToken(token, "wrong-secret")
	if err == nil {
		t.Fatal("expected error with wrong secret, got nil")
	}
}

func TestParseJwtToken_TamperedToken(t *testing.T) {
	token, err := utils.GenerateJwtToken(jwtTestSecret, "user-123")
	if err != nil {
		t.Fatalf("GenerateJwtToken: %v", err)
	}
	_, err = utils.ParseJwtToken(token+"tamper", jwtTestSecret)
	if err == nil {
		t.Fatal("expected error for tampered token, got nil")
	}
}

func TestParseJwtToken_ExpiredToken(t *testing.T) {
	// Construct a token that expired 1 second ago directly via the jwt library.
	claims := jwt.MapClaims{
		"sub": "user-123",
		"iat": time.Now().Add(-2 * time.Hour).Unix(),
		"exp": time.Now().Add(-time.Second).Unix(),
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := tok.SignedString([]byte(jwtTestSecret))
	if err != nil {
		t.Fatalf("sign expired token: %v", err)
	}
	_, err = utils.ParseJwtToken(signed, jwtTestSecret)
	if err == nil {
		t.Fatal("expected error for expired token, got nil")
	}
}

func TestParseJwtToken_EmptyToken(t *testing.T) {
	_, err := utils.ParseJwtToken("", jwtTestSecret)
	if err == nil {
		t.Fatal("expected error for empty token, got nil")
	}
}

func TestParseJwtToken_NoneAlgorithm(t *testing.T) {
	// "alg:none" tokens must be rejected by the algorithm check in ParseJwtToken.
	noneToken := "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6OTk5OTk5OTk5OX0."
	_, err := utils.ParseJwtToken(noneToken, jwtTestSecret)
	if err == nil {
		t.Fatal("expected error for none-algorithm token, got nil")
	}
}

func TestGenerateJwtToken_DifferentSecretsDifferentTokens(t *testing.T) {
	t1, _ := utils.GenerateJwtToken("secret-a", "user-1")
	t2, _ := utils.GenerateJwtToken("secret-b", "user-1")
	if t1 == t2 {
		t.Error("tokens signed with different secrets should not be equal")
	}
}
