package middleware_test

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"threejsPortfolioServer/internal/middleware"
	"threejsPortfolioServer/internal/models"
	"threejsPortfolioServer/internal/repos"
	"threejsPortfolioServer/internal/testutil"
)

// withUserID injects a userID into the request context the same way RequireAuth does.
func withUserID(r *http.Request, userID string) *http.Request {
	ctx := context.WithValue(r.Context(), middleware.UserIDKey, userID)
	return r.WithContext(ctx)
}

func newAdminReq() *http.Request {
	return httptest.NewRequest(http.MethodGet, "/admin", nil)
}

func TestRequireAdmin_NoUserIDInContext(t *testing.T) {
	mw := middleware.RequireAdmin(&testutil.MockUserRepo{})
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("next should not be called when userID is missing")
	})

	w := httptest.NewRecorder()
	mw(next).ServeHTTP(w, newAdminReq())
	if w.Code != http.StatusUnauthorized {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

func TestRequireAdmin_UserNotFound(t *testing.T) {
	repo := &testutil.MockUserRepo{
		GetUserByIDFn: func(id string) (*models.User, error) {
			return nil, repos.ErrNotFound
		},
	}
	mw := middleware.RequireAdmin(repo)
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("next should not be called when user does not exist")
	})

	req := withUserID(newAdminReq(), "ghost-id")
	w := httptest.NewRecorder()
	mw(next).ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

func TestRequireAdmin_DBError(t *testing.T) {
	repo := &testutil.MockUserRepo{
		GetUserByIDFn: func(id string) (*models.User, error) {
			return nil, errors.New("timeout")
		},
	}
	mw := middleware.RequireAdmin(repo)
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("next should not be called on DB error")
	})

	req := withUserID(newAdminReq(), "user-id")
	w := httptest.NewRecorder()
	mw(next).ServeHTTP(w, req)
	if w.Code != http.StatusInternalServerError {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusInternalServerError)
	}
}

func TestRequireAdmin_NotAdmin(t *testing.T) {
	repo := &testutil.MockUserRepo{
		GetUserByIDFn: func(id string) (*models.User, error) {
			return &models.User{ID: id, IsAdmin: false}, nil
		},
	}
	mw := middleware.RequireAdmin(repo)
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("next should not be called for non-admin user")
	})

	req := withUserID(newAdminReq(), "regular-user-id")
	w := httptest.NewRecorder()
	mw(next).ServeHTTP(w, req)
	if w.Code != http.StatusForbidden {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusForbidden)
	}
}

func TestRequireAdmin_IsAdmin(t *testing.T) {
	repo := &testutil.MockUserRepo{
		GetUserByIDFn: func(id string) (*models.User, error) {
			return &models.User{ID: id, IsAdmin: true}, nil
		},
	}
	mw := middleware.RequireAdmin(repo)
	nextCalled := false
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		nextCalled = true
		w.WriteHeader(http.StatusOK)
	})

	req := withUserID(newAdminReq(), "admin-user-id")
	w := httptest.NewRecorder()
	mw(next).ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status: got %d, want %d", w.Code, http.StatusOK)
	}
	if !nextCalled {
		t.Error("next handler must be called for admin user")
	}
}
