package handlers_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"threejsPortfolioServer/internal/handlers"
	"threejsPortfolioServer/internal/middleware"
	"threejsPortfolioServer/internal/models"
	"threejsPortfolioServer/internal/repos"
	"threejsPortfolioServer/internal/testutil"
)

// requestWithUserID creates a GET request with userID already in context,
// simulating the state after RequireAuth middleware has run.
func requestWithUserID(userID string) *http.Request {
	r := httptest.NewRequest(http.MethodGet, "/api/me", nil)
	ctx := context.WithValue(r.Context(), middleware.UserIDKey, userID)
	return r.WithContext(ctx)
}

// --- MeHandler ---

func TestMeHandler_NoUserIDInContext(t *testing.T) {
	h := handlers.MeHandler(&testutil.MockUserRepo{})
	req := httptest.NewRequest(http.MethodGet, "/api/me", nil)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

func TestMeHandler_UserNotFound(t *testing.T) {
	repo := &testutil.MockUserRepo{
		GetUserByIDFn: func(id string) (*models.User, error) {
			return nil, repos.ErrNotFound
		},
	}
	h := handlers.MeHandler(repo)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, requestWithUserID("missing-id"))
	if w.Code != http.StatusNotFound {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusNotFound)
	}
}

func TestMeHandler_DBError(t *testing.T) {
	repo := &testutil.MockUserRepo{
		GetUserByIDFn: func(id string) (*models.User, error) {
			return nil, errors.New("connection reset")
		},
	}
	h := handlers.MeHandler(repo)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, requestWithUserID("some-id"))
	if w.Code != http.StatusInternalServerError {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusInternalServerError)
	}
}

func TestMeHandler_HappyPath(t *testing.T) {
	repo := &testutil.MockUserRepo{
		GetUserByIDFn: func(id string) (*models.User, error) {
			return &models.User{
				ID:        id,
				Name:      "alice",
				Email:     "alice@example.com",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}, nil
		},
	}
	h := handlers.MeHandler(repo)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, requestWithUserID("alice-uuid"))

	if w.Code != http.StatusOK {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusOK)
	}

	var body struct {
		Username string `json:"username"`
		IsAdmin bool `json:"is_admin"`
	}
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if body.Username != "alice" {
		t.Errorf("username: got %q, want %q", body.Username, "alice")
	}
	if body.IsAdmin != false {
		t.Errorf("isAdmin: got %v, want %q", body.IsAdmin, "false")
	}

}

// --- LogoutHandler ---

func TestLogoutHandler_ClearsCookie(t *testing.T) {
	h := handlers.LogoutHandler()
	req := httptest.NewRequest(http.MethodPost, "/api/logout", nil)
	req.AddCookie(&http.Cookie{Name: "session", Value: "some-jwt"})
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusOK)
	}

	var sessionCookie *http.Cookie
	for _, c := range w.Result().Cookies() {
		if c.Name == "session" {
			sessionCookie = c
			break
		}
	}
	if sessionCookie == nil {
		t.Fatal("expected session cookie in response")
	}
	if sessionCookie.MaxAge > 0 {
		t.Errorf("MaxAge should be <= 0 to clear cookie, got %d", sessionCookie.MaxAge)
	}
	if sessionCookie.Value != "" {
		t.Errorf("cookie value should be empty, got %q", sessionCookie.Value)
	}
}

func TestLogoutHandler_NoCookiePresent(t *testing.T) {
	// Logout must succeed even if the caller has no session cookie.
	h := handlers.LogoutHandler()
	req := httptest.NewRequest(http.MethodPost, "/api/logout", nil)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusOK)
	}
}

// Browsers reject a Set-Cookie that drops Secure/SameSite=None from a cookie
// previously set with them ("Leave Secure Cookies Alone", RFC 6265bis), so
// login and logout must agree on these flags in every APP_ENV mode.
func TestLogoutHandler_CookieFlags_Dev(t *testing.T) {
	h := handlers.LogoutHandler()
	req := httptest.NewRequest(http.MethodPost, "/api/logout", nil)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	c := w.Result().Cookies()[0]
	if c.Secure {
		t.Error("session cookie must not be Secure outside APP_ENV=production")
	}
	if c.SameSite != http.SameSiteLaxMode {
		t.Errorf("SameSite: got %v, want SameSiteLaxMode outside APP_ENV=production", c.SameSite)
	}
}

func TestLogoutHandler_CookieFlags_Production(t *testing.T) {
	t.Setenv("APP_ENV", "production")

	h := handlers.LogoutHandler()
	req := httptest.NewRequest(http.MethodPost, "/api/logout", nil)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	c := w.Result().Cookies()[0]
	if !c.Secure {
		t.Error("session cookie must be Secure when APP_ENV=production")
	}
	if c.SameSite != http.SameSiteNoneMode {
		t.Errorf("SameSite: got %v, want SameSiteNoneMode when APP_ENV=production", c.SameSite)
	}
}
