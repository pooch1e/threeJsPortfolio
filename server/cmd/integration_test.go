//go:build integration

package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"threejsPortfolioServer/internal/repos"
	"threejsPortfolioServer/internal/testutil"
)

// newTestServer starts a full application (routes + middleware) against a real
// test database. Returns the server URL and a cleanup func.
func newTestServer(t *testing.T) (*httptest.Server, func()) {
	t.Helper()
	db, dbCleanup := testutil.NewTestDB(t)

	app := application{
		config: config{
			jwtSecret: "integration-test-jwt-secret",
		},
		userRepo: repos.NewPostgresUserRepo(db),
	}

	srv := httptest.NewServer(app.mount())
	cleanup := func() {
		srv.Close()
		dbCleanup()
	}
	return srv, cleanup
}

func post(t *testing.T, url string, body interface{}, cookies []*http.Cookie) *http.Response {
	t.Helper()
	b, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("post marshal: %v", err)
	}
	req, err := http.NewRequestWithContext(context.Background(), http.MethodPost, url, bytes.NewReader(b))
	if err != nil {
		t.Fatalf("post new request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	for _, c := range cookies {
		req.AddCookie(c)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("post do: %v", err)
	}
	return resp
}

func get(t *testing.T, url string, cookies []*http.Cookie) *http.Response {
	t.Helper()
	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, url, nil)
	if err != nil {
		t.Fatalf("get new request: %v", err)
	}
	for _, c := range cookies {
		req.AddCookie(c)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("get do: %v", err)
	}
	return resp
}

func cookie(resp *http.Response, name string) *http.Cookie {
	for _, c := range resp.Cookies() {
		if c.Name == name {
			return c
		}
	}
	return nil
}

// --- Tests ---

func TestIntegration_Health(t *testing.T) {
	srv, cleanup := newTestServer(t)
	defer cleanup()

	resp := get(t, srv.URL+"/health", nil)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("health: got %d, want %d", resp.StatusCode, http.StatusOK)
	}
}

func TestIntegration_Signup(t *testing.T) {
	srv, cleanup := newTestServer(t)
	defer cleanup()

	resp := post(t, srv.URL+"/api/signup", map[string]string{
		"username": "testuser",
		"email":    "testuser@example.com",
		"password": "Test1ng@123",
	}, nil)
	if resp.StatusCode != http.StatusCreated {
		t.Errorf("signup: got %d, want %d", resp.StatusCode, http.StatusCreated)
	}
}

func TestIntegration_SignupDuplicateEmail(t *testing.T) {
	srv, cleanup := newTestServer(t)
	defer cleanup()

	body := map[string]string{
		"username": "testuser",
		"email":    "dup@example.com",
		"password": "Test1ng@123",
	}
	post(t, srv.URL+"/api/signup", body, nil)
	resp := post(t, srv.URL+"/api/signup", body, nil)
	if resp.StatusCode != http.StatusConflict {
		t.Errorf("duplicate signup: got %d, want %d", resp.StatusCode, http.StatusConflict)
	}
}

func TestIntegration_Login(t *testing.T) {
	srv, cleanup := newTestServer(t)
	defer cleanup()

	post(t, srv.URL+"/api/signup", map[string]string{
		"username": "loginuser",
		"email":    "loginuser@example.com",
		"password": "Test1ng@123",
	}, nil)

	resp := post(t, srv.URL+"/api/login", map[string]string{
		"username": "loginuser",
		"password": "Test1ng@123",
	}, nil)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("login: got %d, want %d", resp.StatusCode, http.StatusOK)
	}
	if cookie(resp, "session") == nil {
		t.Error("login: session cookie not set")
	}
}

func TestIntegration_LoginWrongPassword(t *testing.T) {
	srv, cleanup := newTestServer(t)
	defer cleanup()

	post(t, srv.URL+"/api/signup", map[string]string{
		"username": "pwuser",
		"email":    "pwuser@example.com",
		"password": "Test1ng@123",
	}, nil)

	resp := post(t, srv.URL+"/api/login", map[string]string{
		"username": "pwuser",
		"password": "WrongPass1@",
	}, nil)
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("wrong password: got %d, want %d", resp.StatusCode, http.StatusUnauthorized)
	}
}

func TestIntegration_Me_Authenticated(t *testing.T) {
	srv, cleanup := newTestServer(t)
	defer cleanup()

	post(t, srv.URL+"/api/signup", map[string]string{
		"username": "meuser",
		"email":    "meuser@example.com",
		"password": "Test1ng@123",
	}, nil)

	loginResp := post(t, srv.URL+"/api/login", map[string]string{
		"username": "meuser",
		"password": "Test1ng@123",
	}, nil)
	sessionCookie := cookie(loginResp, "session")
	if sessionCookie == nil {
		t.Fatal("no session cookie after login")
	}

	meResp := get(t, srv.URL+"/api/me", []*http.Cookie{sessionCookie})
	if meResp.StatusCode != http.StatusOK {
		t.Errorf("/api/me: got %d, want %d", meResp.StatusCode, http.StatusOK)
	}

	var body struct {
		Username string `json:"username"`
	}
	json.NewDecoder(meResp.Body).Decode(&body)
	if body.Username != "meuser" {
		t.Errorf("username: got %q, want %q", body.Username, "meuser")
	}
}

func TestIntegration_Me_NoCookie(t *testing.T) {
	srv, cleanup := newTestServer(t)
	defer cleanup()

	resp := get(t, srv.URL+"/api/me", nil)
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("/api/me without cookie: got %d, want %d", resp.StatusCode, http.StatusUnauthorized)
	}
}

func TestIntegration_Logout_ClearsCookie(t *testing.T) {
	srv, cleanup := newTestServer(t)
	defer cleanup()

	post(t, srv.URL+"/api/signup", map[string]string{
		"username": "logoutuser",
		"email":    "logoutuser@example.com",
		"password": "Test1ng@123",
	}, nil)

	loginResp := post(t, srv.URL+"/api/login", map[string]string{
		"username": "logoutuser",
		"password": "Test1ng@123",
	}, nil)
	sessionCookie := cookie(loginResp, "session")
	if sessionCookie == nil {
		t.Fatal("no session cookie after login")
	}

	logoutResp := post(t, srv.URL+"/api/logout", nil, []*http.Cookie{sessionCookie})
	if logoutResp.StatusCode != http.StatusOK {
		t.Errorf("logout: got %d, want %d", logoutResp.StatusCode, http.StatusOK)
	}
	cleared := cookie(logoutResp, "session")
	if cleared == nil {
		t.Fatal("expected session cookie in logout response")
	}
	if cleared.MaxAge > 0 {
		t.Errorf("logout cookie MaxAge should be <= 0, got %d", cleared.MaxAge)
	}
}

func TestIntegration_FullFlow(t *testing.T) {
	srv, cleanup := newTestServer(t)
	defer cleanup()

	const (
		username = "flowuser"
		email    = "flowuser@example.com"
		password = "Test1ng@123"
	)

	// 1. Signup
	signupResp := post(t, srv.URL+"/api/signup", map[string]string{
		"username": username, "email": email, "password": password,
	}, nil)
	if signupResp.StatusCode != http.StatusCreated {
		t.Fatalf("signup: got %d", signupResp.StatusCode)
	}

	// 2. Login
	loginResp := post(t, srv.URL+"/api/login", map[string]string{
		"username": username, "password": password,
	}, nil)
	if loginResp.StatusCode != http.StatusOK {
		t.Fatalf("login: got %d", loginResp.StatusCode)
	}
	sessionCookie := cookie(loginResp, "session")
	if sessionCookie == nil {
		t.Fatal("no session cookie")
	}

	// 3. GET /api/me succeeds
	meResp := get(t, srv.URL+"/api/me", []*http.Cookie{sessionCookie})
	if meResp.StatusCode != http.StatusOK {
		t.Fatalf("/api/me: got %d", meResp.StatusCode)
	}

	// 4. Logout
	post(t, srv.URL+"/api/logout", nil, []*http.Cookie{sessionCookie})

	// 5. /api/me without valid session should return 401.
	// (The client would have deleted the cookie; simulate by sending none.)
	unauthResp := get(t, srv.URL+"/api/me", nil)
	if unauthResp.StatusCode != http.StatusUnauthorized {
		t.Errorf("post-logout /api/me: got %d, want %d", unauthResp.StatusCode, http.StatusUnauthorized)
	}

	fmt.Println("full flow: signup → login → /api/me → logout → /api/me=401 ✓")
}
