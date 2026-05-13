package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"threejsPortfolioServer/internal/middleware"
	"threejsPortfolioServer/internal/utils"
)

const authSecret = "auth-unit-test-secret"

func makeSessionCookie(t *testing.T, userID string) *http.Cookie {
	t.Helper()
	token, err := utils.GenerateJwtToken(authSecret, userID)
	if err != nil {
		t.Fatalf("GenerateJwtToken: %v", err)
	}
	return &http.Cookie{Name: "session", Value: token}
}

func TestRequireAuth_ValidCookie(t *testing.T) {
	userID := "user-abc"
	mw := middleware.RequireAuth(authSecret)

	var gotID string
	nextCalled := false
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		nextCalled = true
		gotID = middleware.GetUserID(r)
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/api/me", nil)
	req.AddCookie(makeSessionCookie(t, userID))
	w := httptest.NewRecorder()
	mw(next).ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusOK)
	}
	if !nextCalled {
		t.Error("next handler was not called for valid cookie")
	}
	if gotID != userID {
		t.Errorf("context userID: got %q, want %q", gotID, userID)
	}
}

func TestRequireAuth_MissingCookie(t *testing.T) {
	mw := middleware.RequireAuth(authSecret)
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("next should not be called when cookie is missing")
	})

	req := httptest.NewRequest(http.MethodGet, "/api/me", nil)
	w := httptest.NewRecorder()
	mw(next).ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

func TestRequireAuth_TamperedToken(t *testing.T) {
	cookie := makeSessionCookie(t, "user-123")
	cookie.Value += "x"

	mw := middleware.RequireAuth(authSecret)
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("next should not be called for tampered token")
	})

	req := httptest.NewRequest(http.MethodGet, "/api/me", nil)
	req.AddCookie(cookie)
	w := httptest.NewRecorder()
	mw(next).ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

func TestRequireAuth_WrongSecret(t *testing.T) {
	cookie := makeSessionCookie(t, "user-123") // signed with authSecret

	mw := middleware.RequireAuth("different-secret")
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("next should not be called for wrong-secret token")
	})

	req := httptest.NewRequest(http.MethodGet, "/api/me", nil)
	req.AddCookie(cookie)
	w := httptest.NewRecorder()
	mw(next).ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

func TestRequireAuth_ExpiredToken(t *testing.T) {
	claims := jwt.MapClaims{
		"sub": "user-123",
		"iat": time.Now().Add(-2 * time.Hour).Unix(),
		"exp": time.Now().Add(-time.Second).Unix(),
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := tok.SignedString([]byte(authSecret))
	if err != nil {
		t.Fatalf("sign expired token: %v", err)
	}

	mw := middleware.RequireAuth(authSecret)
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("next should not be called for expired token")
	})

	req := httptest.NewRequest(http.MethodGet, "/api/me", nil)
	req.AddCookie(&http.Cookie{Name: "session", Value: signed})
	w := httptest.NewRecorder()
	mw(next).ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

func TestGetUserID_PresentAfterRequireAuth(t *testing.T) {
	mw := middleware.RequireAuth(authSecret)
	var got string
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got = middleware.GetUserID(r)
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.AddCookie(makeSessionCookie(t, "expected-user-id"))
	mw(next).ServeHTTP(httptest.NewRecorder(), req)

	if got != "expected-user-id" {
		t.Errorf("GetUserID: got %q, want %q", got, "expected-user-id")
	}
}

func TestGetUserID_AbsentReturnsEmpty(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	got := middleware.GetUserID(req)
	if got != "" {
		t.Errorf("GetUserID with no context: got %q, want empty string", got)
	}
}
