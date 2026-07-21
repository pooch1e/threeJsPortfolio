package handlers_test

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"threejsPortfolioServer/internal/handlers"
	"threejsPortfolioServer/internal/models"
	"threejsPortfolioServer/internal/repos"
	"threejsPortfolioServer/internal/testutil"
	"threejsPortfolioServer/internal/utils"
)

const loginTestSecret = "login-handler-test-secret"

// newUserWithPassword builds a models.User whose Password_hash is a real
// bcrypt hash of password, so CheckPasswordHash works correctly.
func newUserWithPassword(t *testing.T, username, email, password string) *models.User {
	t.Helper()
	hash, err := utils.HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}
	return &models.User{
		ID:            "user-uuid",
		Name:          username,
		Email:         email,
		Password_hash: hash,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
}

func TestLoginHandler_BadJSON(t *testing.T) {
	h := handlers.LoginHandler(&testutil.MockUserRepo{}, loginTestSecret)
	req := httptest.NewRequest(http.MethodPost, "/api/login", strings.NewReader("bad"))
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestLoginHandler_InvalidUsername(t *testing.T) {
	h := handlers.LoginHandler(&testutil.MockUserRepo{}, loginTestSecret)
	body := mustMarshal(t, map[string]string{"username": "jo@el", "password": "Test1ng@"})
	req := httptest.NewRequest(http.MethodPost, "/api/login", body)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestLoginHandler_UserNotFound(t *testing.T) {
	repo := &testutil.MockUserRepo{
		GetUserByUsernameFn: func(username string) (*models.User, error) {
			return nil, repos.ErrNotFound
		},
	}
	h := handlers.LoginHandler(repo, loginTestSecret)
	body := mustMarshal(t, map[string]string{"username": "joel", "password": "Test1ng@"})
	req := httptest.NewRequest(http.MethodPost, "/api/login", body)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

func TestLoginHandler_DBError(t *testing.T) {
	// DB failures must also return 401, not 500 — don't leak system state.
	repo := &testutil.MockUserRepo{
		GetUserByUsernameFn: func(username string) (*models.User, error) {
			return nil, errors.New("connection refused")
		},
	}
	h := handlers.LoginHandler(repo, loginTestSecret)
	body := mustMarshal(t, map[string]string{"username": "joel", "password": "Test1ng@"})
	req := httptest.NewRequest(http.MethodPost, "/api/login", body)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

func TestLoginHandler_WrongPassword(t *testing.T) {
	user := newUserWithPassword(t, "joel", "joel@example.com", "Test1ng@123")
	repo := &testutil.MockUserRepo{
		GetUserByUsernameFn: func(username string) (*models.User, error) { return user, nil },
	}
	h := handlers.LoginHandler(repo, loginTestSecret)
	body := mustMarshal(t, map[string]string{"username": "joel", "password": "WrongPass1@"})
	req := httptest.NewRequest(http.MethodPost, "/api/login", body)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

func TestLoginHandler_HappyPath(t *testing.T) {
	const password = "Test1ng@123"
	user := newUserWithPassword(t, "joel", "joel@example.com", password)
	repo := &testutil.MockUserRepo{
		GetUserByUsernameFn: func(username string) (*models.User, error) { return user, nil },
	}
	h := handlers.LoginHandler(repo, loginTestSecret)
	body := mustMarshal(t, map[string]string{"username": "joel", "password": password})
	req := httptest.NewRequest(http.MethodPost, "/api/login", body)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusOK)
	}

	// Session cookie must be set, HttpOnly, non-empty.
	var sessionCookie *http.Cookie
	for _, c := range w.Result().Cookies() {
		if c.Name == "session" {
			sessionCookie = c
			break
		}
	}
	if sessionCookie == nil {
		t.Fatal("session cookie not set")
	}
	if !sessionCookie.HttpOnly {
		t.Error("session cookie must be HttpOnly")
	}
	if sessionCookie.Value == "" {
		t.Error("session cookie value must not be empty")
	}
	if sessionCookie.Secure {
		t.Error("session cookie must not be Secure outside APP_ENV=production")
	}
	if sessionCookie.SameSite != http.SameSiteLaxMode {
		t.Errorf("SameSite: got %v, want SameSiteLaxMode outside APP_ENV=production", sessionCookie.SameSite)
	}
}

func TestLoginHandler_ProductionCookieFlags(t *testing.T) {
	t.Setenv("APP_ENV", "production")

	const password = "Test1ng@123"
	user := newUserWithPassword(t, "joel", "joel@example.com", password)
	repo := &testutil.MockUserRepo{
		GetUserByUsernameFn: func(username string) (*models.User, error) { return user, nil },
	}
	h := handlers.LoginHandler(repo, loginTestSecret)
	body := mustMarshal(t, map[string]string{"username": "joel", "password": password})
	req := httptest.NewRequest(http.MethodPost, "/api/login", body)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	var sessionCookie *http.Cookie
	for _, c := range w.Result().Cookies() {
		if c.Name == "session" {
			sessionCookie = c
			break
		}
	}
	if sessionCookie == nil {
		t.Fatal("session cookie not set")
	}
	if !sessionCookie.Secure {
		t.Error("session cookie must be Secure when APP_ENV=production")
	}
	if sessionCookie.SameSite != http.SameSiteNoneMode {
		t.Errorf("SameSite: got %v, want SameSiteNoneMode when APP_ENV=production", sessionCookie.SameSite)
	}

	// Body must contain the username.
	var respBody struct {
		Username string `json:"username"`
	}
	if err := json.NewDecoder(w.Body).Decode(&respBody); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if respBody.Username != "joel" {
		t.Errorf("username: got %q, want %q", respBody.Username, "joel")
	}
}
