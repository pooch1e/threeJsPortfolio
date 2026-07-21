package handlers_test

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"

	"threejsPortfolioServer/internal/handlers"
	"threejsPortfolioServer/internal/models"
	"threejsPortfolioServer/internal/repos"
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
			t.Errorf("got %d pages, want 1", body.Pagination.Page)
	}

	if body.Pagination.Limit != 20 {
			t.Errorf("got %d pagination limit, want 20", body.Pagination.Limit)
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

// -- UpdateUserHandler --

// route mounts a handler on a chi path pattern so tests exercise the same
// {id}-extraction path the real router (cmd/api.go) uses.
func route(method, pattern string, h http.HandlerFunc) *chi.Mux {
	r := chi.NewRouter()
	r.Method(method, pattern, h)
	return r
}

// The handler must forward the decoded request body to the repo.
func TestUpdateUserHandler_ForwardsDecodedInputToRepo(t *testing.T) {
	var gotInput models.UpdateUserInput
	name := "New Name"

	mock := &testutil.MockUserRepo{
		UpdateUserFn: func(id string, input models.UpdateUserInput) (*models.User, error) {
			gotInput = input
			return &models.User{ID: id}, nil
		},
	}

	r := route(http.MethodPut, "/api/admin/users/{id}", handlers.UpdateUserHandler(mock))
	body, _ := json.Marshal(models.UpdateUserInput{Name: &name})
	req := httptest.NewRequest(http.MethodPut, "/api/admin/users/1", bytes.NewReader(body))
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status: got %d, want %d, body=%s", w.Code, http.StatusOK, w.Body.String())
	}
	if gotInput.Name == nil || *gotInput.Name != name {
		t.Errorf("repo.UpdateUser received %+v, want Name=%q — handler is discarding the decoded body", gotInput, name)
	}
}

// repos.ErrNotFound must surface as 404, not a generic 500, so admin UIs can
// tell "bad id" apart from "server broke."
func TestUpdateUserHandler_NotFoundReturns404(t *testing.T) {
	mock := &testutil.MockUserRepo{
		UpdateUserFn: func(id string, input models.UpdateUserInput) (*models.User, error) {
			return nil, repos.ErrNotFound
		},
	}

	r := route(http.MethodPut, "/api/admin/users/{id}", handlers.UpdateUserHandler(mock))
	req := httptest.NewRequest(http.MethodPut, "/api/admin/users/999", strings.NewReader("{}"))
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("status: got %d, want %d (repos.ErrNotFound isn't checked with errors.Is)", w.Code, http.StatusNotFound)
	}
}

// id comes from the {id} chi path param (cmd/api.go registers the route that
// way), not a query string.
func TestUpdateUserHandler_ReadsIDFromRoutePath(t *testing.T) {
	var gotID string
	mock := &testutil.MockUserRepo{
		UpdateUserFn: func(id string, input models.UpdateUserInput) (*models.User, error) {
			gotID = id
			return &models.User{ID: id}, nil
		},
	}

	r := chi.NewRouter()
	r.Put("/api/admin/users/{id}", handlers.UpdateUserHandler(mock))

	req := httptest.NewRequest(http.MethodPut, "/api/admin/users/42", strings.NewReader("{}"))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status: got %d, want %d, body=%s", w.Code, http.StatusOK, w.Body.String())
	}
	if gotID != "42" {
		t.Errorf("repo.UpdateUser got id=%q, want %q — handler ignored the {id} path param", gotID, "42")
	}
}

// -- DeleteUser --

func TestDeleteUser_NotFoundReturns404(t *testing.T) {
	mock := &testutil.MockUserRepo{
		DeleteUserFn: func(id string) error {
			return repos.ErrNotFound
		},
	}

	r := route(http.MethodDelete, "/api/admin/users/{id}", handlers.DeleteUser(mock))
	req := httptest.NewRequest(http.MethodDelete, "/api/admin/users/999", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("status: got %d, want %d (repos.ErrNotFound isn't checked with errors.Is)", w.Code, http.StatusNotFound)
	}
}

func TestDeleteUser_ReadsIDFromRoutePath(t *testing.T) {
	var gotID string
	mock := &testutil.MockUserRepo{
		DeleteUserFn: func(id string) error {
			gotID = id
			return nil
		},
	}

	r := chi.NewRouter()
	r.Delete("/api/admin/users/{id}", handlers.DeleteUser(mock))

	req := httptest.NewRequest(http.MethodDelete, "/api/admin/users/42", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if gotID != "42" {
		t.Errorf("repo.DeleteUser got id=%q, want %q — handler ignored the {id} path param", gotID, "42")
	}
}

func TestDeleteUser_HappyPath(t *testing.T) {
	mock := &testutil.MockUserRepo{
		DeleteUserFn: func(id string) error { return nil },
	}

	r := route(http.MethodDelete, "/api/admin/users/{id}", handlers.DeleteUser(mock))
	req := httptest.NewRequest(http.MethodDelete, "/api/admin/users/1", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusOK)
	}
}

func TestDeleteUser_GenericErrorReturns500(t *testing.T) {
	mock := &testutil.MockUserRepo{
		DeleteUserFn: func(id string) error { return errors.New("db down") },
	}

	r := route(http.MethodDelete, "/api/admin/users/{id}", handlers.DeleteUser(mock))
	req := httptest.NewRequest(http.MethodDelete, "/api/admin/users/1", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusInternalServerError)
	}
}

// -- UpdateUserHandler: remaining branches --

func TestUpdateUserHandler_MalformedJSONReturns400(t *testing.T) {
	mock := &testutil.MockUserRepo{}
	r := route(http.MethodPut, "/api/admin/users/{id}", handlers.UpdateUserHandler(mock))
	req := httptest.NewRequest(http.MethodPut, "/api/admin/users/1", strings.NewReader("not json"))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestUpdateUserHandler_GenericErrorReturns500(t *testing.T) {
	mock := &testutil.MockUserRepo{
		UpdateUserFn: func(id string, input models.UpdateUserInput) (*models.User, error) {
			return nil, errors.New("db down")
		},
	}
	r := route(http.MethodPut, "/api/admin/users/{id}", handlers.UpdateUserHandler(mock))
	req := httptest.NewRequest(http.MethodPut, "/api/admin/users/1", strings.NewReader("{}"))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusInternalServerError)
	}
}

// -- GetUserHandler --

func TestGetUserHandler_HappyPath(t *testing.T) {
	mock := &testutil.MockUserRepo{
		GetUserByIDFn: func(id string) (*models.User, error) {
			return &models.User{ID: id, Name: "joel"}, nil
		},
	}
	r := route(http.MethodGet, "/api/admin/users/{id}", handlers.GetUserHandler(mock))
	req := httptest.NewRequest(http.MethodGet, "/api/admin/users/1", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status: got %d, want %d, body=%s", w.Code, http.StatusOK, w.Body.String())
	}
	var body models.User
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if body.Name != "joel" {
		t.Errorf("got name %q, want %q", body.Name, "joel")
	}
}

func TestGetUserHandler_NotFoundReturns404(t *testing.T) {
	mock := &testutil.MockUserRepo{
		GetUserByIDFn: func(id string) (*models.User, error) {
			return nil, repos.ErrNotFound
		},
	}
	r := route(http.MethodGet, "/api/admin/users/{id}", handlers.GetUserHandler(mock))
	req := httptest.NewRequest(http.MethodGet, "/api/admin/users/999", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusNotFound)
	}
}

func TestGetUserHandler_GenericErrorReturns500(t *testing.T) {
	mock := &testutil.MockUserRepo{
		GetUserByIDFn: func(id string) (*models.User, error) {
			return nil, errors.New("db down")
		},
	}
	r := route(http.MethodGet, "/api/admin/users/{id}", handlers.GetUserHandler(mock))
	req := httptest.NewRequest(http.MethodGet, "/api/admin/users/1", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusInternalServerError)
	}
}

// -- UpdatePasswordHashHandler --

func TestUpdatePasswordHashHandler_HappyPath(t *testing.T) {
	var gotID string
	var gotHash []byte
	mock := &testutil.MockUserRepo{
		UpdatePasswordHashFn: func(id string, passwordHash []byte) error {
			gotID = id
			gotHash = passwordHash
			return nil
		},
	}
	r := route(http.MethodPost, "/api/admin/users/{id}/passwordReset", handlers.UpdatePasswordHashHandler(mock))
	body, _ := json.Marshal(map[string]string{"password": "NewPass1@"})
	req := httptest.NewRequest(http.MethodPost, "/api/admin/users/1/passwordReset", bytes.NewReader(body))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status: got %d, want %d, body=%s", w.Code, http.StatusOK, w.Body.String())
	}
	if gotID != "1" {
		t.Errorf("repo.UpdatePasswordHash got id=%q, want %q", gotID, "1")
	}
	if len(gotHash) == 0 {
		t.Error("repo.UpdatePasswordHash got an empty hash — handler didn't hash the password")
	}
}

func TestUpdatePasswordHashHandler_WeakPasswordReturns400(t *testing.T) {
	mock := &testutil.MockUserRepo{}
	r := route(http.MethodPost, "/api/admin/users/{id}/passwordReset", handlers.UpdatePasswordHashHandler(mock))
	body, _ := json.Marshal(map[string]string{"password": "weak"})
	req := httptest.NewRequest(http.MethodPost, "/api/admin/users/1/passwordReset", bytes.NewReader(body))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestUpdatePasswordHashHandler_NotFoundReturns404(t *testing.T) {
	mock := &testutil.MockUserRepo{
		UpdatePasswordHashFn: func(id string, passwordHash []byte) error {
			return repos.ErrNotFound
		},
	}
	r := route(http.MethodPost, "/api/admin/users/{id}/passwordReset", handlers.UpdatePasswordHashHandler(mock))
	body, _ := json.Marshal(map[string]string{"password": "NewPass1@"})
	req := httptest.NewRequest(http.MethodPost, "/api/admin/users/999/passwordReset", bytes.NewReader(body))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusNotFound)
	}
}
