package handlers_test

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"threejsPortfolioServer/internal/handlers"
	"threejsPortfolioServer/internal/models"
	"threejsPortfolioServer/internal/testutil"
)

type paginatedUsersResponse struct {
    Users      []models.User `json:"users"`
    Pagination struct {
        Page       int `json:"page"`
        Limit      int `json:"limit"`
        Total      int `json:"total"`
        TotalPages int `json:"total_pages"`
    } `json:"pagination"`
}

func decodeListUsers(t *testing.T, w *httptest.ResponseRecorder) paginatedUsersResponse {
    t.Helper()
    var body paginatedUsersResponse
    if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
        t.Fatalf("decode body: %v", err)
    }
    return body
}

func TestListUsersHandler_HappyPath(t *testing.T) {
	// Arrange
	mock := &testutil.MockUserRepo{
		GetAllUsersFn:func(limit int, offset int) ([]models.User, error) {
			return []models.User{{ID: "1"}, {ID: "2"}}, nil
		},
		GetUserCountFn: func() (int, error) {
			return 2, nil
		},
	}

	h := handlers.ListUsersHandler(mock)
	req := httptest.NewRequest(http.MethodGet, "/api/admin/users", strings.NewReader("userlist"))
	w := httptest.NewRecorder()

	// ACT
	h.ServeHTTP(w, req)

	// ASSERT

	// Status: 200
	if w.Code != http.StatusOK {
		t.Errorf("list: got %d, want %d", w.Code, http.StatusOK)
	}

	// Returns 2 users in body
	body := decodeListUsers(t, w)
	if len(body.Users) != 2 {
		t.Errorf("got %d users, want 2", len(body.Users))
	}

	// returns pagination total to be 2
	if body.Pagination.Total != 2 {
		t.Errorf("got %d pages total, want 2", body.Pagination.Total)
	}

	// pagination to be 1
	if body.Pagination.Page != 1 {
			t.Errorf("got %d pages, want 1", body.Pagination)
	}

	if body.Pagination.Limit != 20 {
			t.Errorf("got %d pagination limit, want 20", body.Pagination.Total)
	}
}
func TestListUsersHandler_EmptyDb(t *testing.T) {
	mock := &testutil.MockUserRepo{
		GetAllUsersFn: func(limit int, offset int) ([]models.User, error) {
			return []models.User{}, nil
		},
		GetUserCountFn: func() (int, error) {
			return 0, nil
		},
	}

	h := handlers.ListUsersHandler(mock)
	req := httptest.NewRequest(http.MethodGet, "/api/admin/users", strings.NewReader("userlist"))
	w := httptest.NewRecorder()

	// ACT
	h.ServeHTTP(w, req)

	// ASSERT
	if w.Code != http.StatusOK {
		t.Errorf("list: got %d, want %d", w.Code, http.StatusOK)
	}
	raw := w.Body.String()
	if !strings.Contains(raw, `"users":[]`) {
		t.Errorf("expected users to be empty array, got: %s", raw)
	}
	body := decodeListUsers(t, w)
	if len(body.Users) != 0 {
		t.Errorf("got %d users, want 0", len(body.Users))
	}
	if body.Pagination.Total != 0 {
		t.Errorf("got %d pages total, want 0", body.Pagination.Total)
	}

}
func TestListUsersHandler_PageAndLimitParams(t *testing.T) {
	mock := &testutil.MockUserRepo{
		GetAllUsersFn: func(limit int, offset int) ([]models.User, error) {
			return []models.User{{ID: "1"}}, nil
		},
		GetUserCountFn: func() (int, error) {
			return 50, nil
		},
	}

	h := handlers.ListUsersHandler(mock)
	req := httptest.NewRequest(http.MethodGet, "/api/admin/users?page=3&limit=10", nil)
	w := httptest.NewRecorder()

	// ACT
	h.ServeHTTP(w, req)

	// ASSERT
	if w.Code != http.StatusOK {
		t.Errorf("list: got %d, want %d", w.Code, http.StatusOK)
	}
	body := decodeListUsers(t, w)
	if len(body.Users) != 1 {
		t.Errorf("got %d users, want 0", len(body.Users))
	}
	if body.Pagination.TotalPages != 5 {
		t.Errorf("got %d pages total, want 5", body.Pagination.Total)
	}
	if body.Pagination.Page != 3 {
		t.Errorf("got %d page, want 3", body.Pagination.Page)
	}
	if body.Pagination.Limit != 10 {
		t.Errorf("got %d limit, want 10", body.Pagination.Limit)
	}
}
func TestListUsersHandler_GetAllUsersDBError(t *testing.T) {
	mock := &testutil.MockUserRepo{
		GetAllUsersFn: func(limit int, offset int) ([]models.User, error) {
			return nil, errors.New("db down")
		},
		GetUserCountFn: func() (int, error) {
			return 0, nil
		},
	}

	h := handlers.ListUsersHandler(mock)
	req := httptest.NewRequest(http.MethodGet, "/api/admin/users", nil)
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("got %d, want %d", w.Code, http.StatusInternalServerError)
	}
	if !strings.Contains(w.Body.String(), `"error"`) {
		t.Errorf("expected error key in body, got: %s", w.Body.String())
	}
}

func TestListUsersHandler_GetUserCountDBError(t *testing.T) {
	mock := &testutil.MockUserRepo{
		GetAllUsersFn: func(limit int, offset int) ([]models.User, error) {
			return []models.User{{ID: "1"}}, nil
		},
		GetUserCountFn: func() (int, error) {
			return 0, errors.New("db down")
		},
	}

	h := handlers.ListUsersHandler(mock)
	req := httptest.NewRequest(http.MethodGet, "/api/admin/users", nil)
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("got %d, want %d", w.Code, http.StatusInternalServerError)
	}
	if !strings.Contains(w.Body.String(), `"error"`) {
		t.Errorf("expected error key in body, got: %s", w.Body.String())
	}
}

func TestListUsersHandler_InvalidPageDefaultsTo1(t *testing.T) {
	mock := &testutil.MockUserRepo{
		GetAllUsersFn: func(limit int, offset int) ([]models.User, error) {
			return []models.User{{ID: "1"}}, nil
		},
		GetUserCountFn: func() (int, error) {
			return 50, nil
		},
	}

	h := handlers.ListUsersHandler(mock)
	req := httptest.NewRequest(http.MethodGet, "/api/admin/users?page=abc&limit=10", nil)
	w := httptest.NewRecorder()

	// ACT
	h.ServeHTTP(w, req)

	// ASSERT
	if w.Code != http.StatusOK {
		t.Errorf("list: got %d, want %d", w.Code, http.StatusOK)
	}
	body := decodeListUsers(t, w)
	if len(body.Users) != 1 {
		t.Errorf("got %d users, want 0", len(body.Users))
	}
	if body.Pagination.TotalPages != 5 {
		t.Errorf("got %d pages total, want 5", body.Pagination.TotalPages)
	}
	if body.Pagination.Page != 1 {
		t.Errorf("got %d page, want 1", body.Pagination.Page)
	}
	if body.Pagination.Limit != 10 {
		t.Errorf("got %d limit, want 10", body.Pagination.Limit)
	}
}
