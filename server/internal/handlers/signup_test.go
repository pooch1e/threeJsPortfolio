package handlers_test

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"threejsPortfolioServer/internal/handlers"
	"threejsPortfolioServer/internal/models"
	"threejsPortfolioServer/internal/testutil"
)

// mustMarshal is a test helper that marshals v to a *bytes.Buffer.
func mustMarshal(t *testing.T, v interface{}) *bytes.Buffer {
	t.Helper()
	b, err := json.Marshal(v)
	if err != nil {
		t.Fatalf("mustMarshal: %v", err)
	}
	return bytes.NewBuffer(b)
}

func TestSignupHandler_BadJSON(t *testing.T) {
	h := handlers.SignupHandler(&testutil.MockUserRepo{})
	req := httptest.NewRequest(http.MethodPost, "/api/signup", bytes.NewBufferString("not-json"))
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestSignupHandler_InvalidUsername(t *testing.T) {
	h := handlers.SignupHandler(&testutil.MockUserRepo{})
	body := mustMarshal(t, map[string]string{
		"username": "jo@el",
		"email":    "joel@example.com",
		"password": "Test1ng@123",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/signup", body)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestSignupHandler_InvalidEmail(t *testing.T) {
	h := handlers.SignupHandler(&testutil.MockUserRepo{})
	body := mustMarshal(t, map[string]string{
		"username": "joel",
		"email":    "not-an-email",
		"password": "Test1ng@123",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/signup", body)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestSignupHandler_InvalidPassword(t *testing.T) {
	h := handlers.SignupHandler(&testutil.MockUserRepo{})
	body := mustMarshal(t, map[string]string{
		"username": "joel",
		"email":    "joel@example.com",
		"password": "weak",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/signup", body)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestSignupHandler_DuplicateEmail(t *testing.T) {
	repo := &testutil.MockUserRepo{
		CheckUserExistsFn: func(email string) (bool, error) { return true, nil },
	}
	h := handlers.SignupHandler(repo)
	body := mustMarshal(t, map[string]string{
		"username": "joel",
		"email":    "joel@example.com",
		"password": "Test1ng@123",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/signup", body)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusConflict {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusConflict)
	}
}

func TestSignupHandler_DBCheckError(t *testing.T) {
	repo := &testutil.MockUserRepo{
		CheckUserExistsFn: func(email string) (bool, error) {
			return false, errors.New("connection lost")
		},
	}
	h := handlers.SignupHandler(repo)
	body := mustMarshal(t, map[string]string{
		"username": "joel",
		"email":    "joel@example.com",
		"password": "Test1ng@123",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/signup", body)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusInternalServerError {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusInternalServerError)
	}
}

func TestSignupHandler_DBInsertError(t *testing.T) {
	repo := &testutil.MockUserRepo{
		CheckUserExistsFn: func(email string) (bool, error) { return false, nil },
		InsertNewUserFn: func(user models.NewUser) (*models.User, error) {
			return nil, errors.New("insert failed")
		},
	}
	h := handlers.SignupHandler(repo)
	body := mustMarshal(t, map[string]string{
		"username": "joel",
		"email":    "joel@example.com",
		"password": "Test1ng@123",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/signup", body)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	if w.Code != http.StatusInternalServerError {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusInternalServerError)
	}
}

func TestSignupHandler_HappyPath(t *testing.T) {
	created := &models.User{
		ID:        "uuid-abc",
		Name:      "joel",
		Email:     "joel@example.com",
		IsAdmin:   false,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	repo := &testutil.MockUserRepo{
		CheckUserExistsFn: func(email string) (bool, error) { return false, nil },
		InsertNewUserFn: func(user models.NewUser) (*models.User, error) {
			return created, nil
		},
	}
	h := handlers.SignupHandler(repo)
	body := mustMarshal(t, map[string]string{
		"username": "joel",
		"email":    "joel@example.com",
		"password": "Test1ng@123",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/signup", body)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusCreated)
	}

	var resp map[string]interface{}
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp["id"] != "uuid-abc" {
		t.Errorf("response id: got %v, want uuid-abc", resp["id"])
	}
	if _, ok := resp["password_hash"]; ok {
		t.Error("password_hash must not appear in response (json:\"-\" tag)")
	}
}
