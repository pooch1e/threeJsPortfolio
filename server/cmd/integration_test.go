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

func makeAdminServer(t *testing.T) (*httptest.Server, *http.Cookie, func()) {
	t.Helper()

	db, dbCleanup := testutil.NewTestDB(t)
	app := application{
		config: config{
			jwtSecret: "integration-test-jwt-secret",
		},
		userRepo: repos.NewPostgresUserRepo(db),
	}
	srv := httptest.NewServer(app.mount())

	const (
		adminUsername = "adminuser"
		adminEmail    = "adminuser@example.com"
		adminPassword = "Admin1ng@123"
	)

	post(t, srv.URL+"/api/signup", map[string]string{
		"username": adminUsername,
		"email":    adminEmail,
		"password": adminPassword,
	}, nil)

	if _, err := db.Exec("UPDATE users SET is_admin = true WHERE name = $1", adminUsername); err != nil {
		t.Fatalf("makeAdminServer: set is_admin: %v", err)
	}

	loginResp := post(t, srv.URL+"/api/login", map[string]string{
		"username": adminUsername,
		"password": adminPassword,
	}, nil)
	sessionCookie := cookie(loginResp, "session")
	if sessionCookie == nil {
		t.Fatal("makeAdminServer: no session cookie after login")
	}

	cleanup := func() {
		srv.Close()
		dbCleanup()
	}
	return srv, sessionCookie, cleanup
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

func TestIntegration_ListUsers_Unauthenticated(t *testing.T) {
	srv, cleanup := newTestServer(t)
	defer cleanup()

	resp := get(t, srv.URL+"/api/admin/users", nil)
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("GET /api/users: got %d, want %d", resp.StatusCode, http.StatusUnauthorized)
	}
}

func TestIntegration_ListUsers_NonAdmin(t *testing.T) {
	srv, cleanup := newTestServer(t)
	defer cleanup()

	post(t, srv.URL+"/api/signup", map[string]string{
		"username": "regularuser",
		"email":    "regularuser@example.com",
		"password": "Test1ng@123",
	}, nil)
	loginResp := post(t, srv.URL+"/api/login", map[string]string{
		"username": "regularuser",
		"password": "Test1ng@123",
	}, nil)
	sessionCookie := cookie(loginResp, "session")
	if sessionCookie == nil {
		t.Fatal("no session cookie after login")
	}

	resp := get(t, srv.URL+"/api/admin/users", []*http.Cookie{sessionCookie})
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("GET /api/users non-admin: got %d, want %d", resp.StatusCode, http.StatusForbidden)
	}
}

func TestIntegration_ListUsers_Admin(t *testing.T) {
	srv, sessionCookie, cleanup := makeAdminServer(t)
	defer cleanup()

	for i := range 3 {
		post(t, srv.URL+"/api/signup", map[string]string{
			"username": fmt.Sprintf("seeduser%d", i),
			"email":    fmt.Sprintf("seeduser%d@example.com", i),
			"password": "Test1ng@123",
		}, nil)
	}

	resp := get(t, srv.URL+"/api/admin/users", []*http.Cookie{sessionCookie})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("GET /api/users admin: got %d, want %d", resp.StatusCode, http.StatusOK)
	}

	var body struct {
		Users      []map[string]interface{} `json:"users"`
		Pagination struct {
			Total int `json:"total"`
		} `json:"pagination"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if body.Pagination.Total < 3 {
		t.Errorf("pagination.total: got %d, want >= 3", body.Pagination.Total)
	}
	if len(body.Users) == 0 {
		t.Error("users: got empty slice, want non-empty")
	}
}

func TestIntegration_ListUsers_Pagination(t *testing.T) {
	srv, sessionCookie, cleanup := makeAdminServer(t)
	defer cleanup()

	for i := range 5 {
		post(t, srv.URL+"/api/signup", map[string]string{
			"username": fmt.Sprintf("pageuser%d", i),
			"email":    fmt.Sprintf("pageuser%d@example.com", i),
			"password": "Test1ng@123",
		}, nil)
	}

	resp := get(t, srv.URL+"/api/admin/users?page=1&limit=2", []*http.Cookie{sessionCookie})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("GET /api/users pagination: got %d, want %d", resp.StatusCode, http.StatusOK)
	}

	var body struct {
		Users      []map[string]interface{} `json:"users"`
		Pagination struct {
			Total      int `json:"total"`
			TotalPages int `json:"total_pages"`
		} `json:"pagination"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if len(body.Users) != 2 {
		t.Errorf("users: got %d, want 2", len(body.Users))
	}
	wantPages := (body.Pagination.Total + 1) / 2
	if body.Pagination.TotalPages != wantPages {
		t.Errorf("total_pages: got %d, want %d", body.Pagination.TotalPages, wantPages)
	}
}

func TestIntegration_ListUsers_EmptyDB(t *testing.T) {
	srv, sessionCookie, cleanup := makeAdminServer(t)
	defer cleanup()

	resp := get(t, srv.URL+"/api/admin/users", []*http.Cookie{sessionCookie})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("GET /api/users empty: got %d, want %d", resp.StatusCode, http.StatusOK)
	}

	var body struct {
		Users      []map[string]interface{} `json:"users"`
		Pagination struct {
			Total int `json:"total"`
		} `json:"pagination"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if body.Users == nil {
		t.Error("users: got null, want empty array")
	}
	if body.Pagination.Total < 1 {
		t.Errorf("pagination.total: got %d, want >= 1 (admin user)", body.Pagination.Total)
	}
}
