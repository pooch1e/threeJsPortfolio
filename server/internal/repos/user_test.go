//go:build integration

package repos_test

import (
	"errors"
	"testing"

	"threejsPortfolioServer/internal/models"
	"threejsPortfolioServer/internal/repos"
	"threejsPortfolioServer/internal/testutil"
)

// The package-level db is set once in TestMain and shared across tests.
// Each test calls TruncateTables to start with a clean slate.

func setupRepo(t *testing.T) (repos.UserRepository, func()) {
	t.Helper()
	db, cleanup := testutil.NewTestDB(t)
	return repos.NewPostgresUserRepo(db), cleanup
}

// --- CheckUserExists ---

func TestCheckUserExists_False(t *testing.T) {
	repo, cleanup := setupRepo(t)
	defer cleanup()

	exists, err := repo.CheckUserExists("nobody@example.com")
	if err != nil {
		t.Fatalf("CheckUserExists: %v", err)
	}
	if exists {
		t.Error("expected false for non-existent email")
	}
}

func TestCheckUserExists_True(t *testing.T) {
	repo, cleanup := setupRepo(t)
	defer cleanup()

	insertTestUser(t, repo, "alice", "alice@example.com")

	exists, err := repo.CheckUserExists("alice@example.com")
	if err != nil {
		t.Fatalf("CheckUserExists: %v", err)
	}
	if !exists {
		t.Error("expected true for existing email")
	}
}

// --- InsertNewUser ---

func TestInsertNewUser_OK(t *testing.T) {
	repo, cleanup := setupRepo(t)
	defer cleanup()

	user, err := repo.InsertNewUser(models.NewUser{
		Username:      "bob",
		Email:         "bob@example.com",
		Password_hash: []byte("fakehash"),
	})
	if err != nil {
		t.Fatalf("InsertNewUser: %v", err)
	}
	if user.ID == "" {
		t.Error("expected non-empty ID")
	}
	if user.Name != "bob" {
		t.Errorf("Name: got %q, want %q", user.Name, "bob")
	}
	if user.Email != "bob@example.com" {
		t.Errorf("Email: got %q, want %q", user.Email, "bob@example.com")
	}
	if user.CreatedAt.IsZero() {
		t.Error("CreatedAt should not be zero")
	}
}

func TestInsertNewUser_DuplicateEmail(t *testing.T) {
	repo, cleanup := setupRepo(t)
	defer cleanup()

	insertTestUser(t, repo, "carol", "carol@example.com")

	_, err := repo.InsertNewUser(models.NewUser{
		Username:      "carol2",
		Email:         "carol@example.com", // same email
		Password_hash: []byte("hash"),
	})
	if err == nil {
		t.Fatal("expected error for duplicate email, got nil")
	}
}

// --- GetUserByID ---

func TestGetUserByID_Found(t *testing.T) {
	repo, cleanup := setupRepo(t)
	defer cleanup()

	inserted := insertTestUser(t, repo, "dave", "dave@example.com")

	got, err := repo.GetUserByID(inserted.ID)
	if err != nil {
		t.Fatalf("GetUserByID: %v", err)
	}
	if got.ID != inserted.ID {
		t.Errorf("ID: got %q, want %q", got.ID, inserted.ID)
	}
	if got.Name != "dave" {
		t.Errorf("Name: got %q, want %q", got.Name, "dave")
	}
}

func TestGetUserByID_NotFound(t *testing.T) {
	repo, cleanup := setupRepo(t)
	defer cleanup()

	_, err := repo.GetUserByID("00000000-0000-0000-0000-000000000000")
	if !errors.Is(err, repos.ErrNotFound) {
		t.Errorf("expected repos.ErrNotFound, got %v", err)
	}
}

// --- GetUserByUsername ---

func TestGetUserByUsername_Found(t *testing.T) {
	repo, cleanup := setupRepo(t)
	defer cleanup()

	insertTestUser(t, repo, "eve", "eve@example.com")

	got, err := repo.GetUserByUsername("eve")
	if err != nil {
		t.Fatalf("GetUserByUsername: %v", err)
	}
	if got.Name != "eve" {
		t.Errorf("Name: got %q, want %q", got.Name, "eve")
	}
	// Password_hash must be populated for login to work.
	if len(got.Password_hash) == 0 {
		t.Error("Password_hash should be populated by GetUserByUsername")
	}
}

func TestGetUserByUsername_NotFound(t *testing.T) {
	repo, cleanup := setupRepo(t)
	defer cleanup()

	_, err := repo.GetUserByUsername("ghost")
	if !errors.Is(err, repos.ErrNotFound) {
		t.Errorf("expected repos.ErrNotFound, got %v", err)
	}
}

// --- UpdateUser ---

func TestUpdateUser_PartialUpdateLeavesOtherFieldsUntouched(t *testing.T) {
	repo, cleanup := setupRepo(t)
	defer cleanup()

	inserted := insertTestUser(t, repo, "frank", "frank@example.com")

	newName := "Frank Updated"
	got, err := repo.UpdateUser(inserted.ID, models.UpdateUserInput{Name: &newName})
	if err != nil {
		t.Fatalf("UpdateUser: %v", err)
	}
	if got.Name != newName {
		t.Errorf("Name: got %q, want %q", got.Name, newName)
	}
	// Email/IsAdmin were omitted from the input (nil pointers) — COALESCE
	// must leave them as they were, not overwrite them with NULL.
	if got.Email != inserted.Email {
		t.Errorf("Email: got %q, want unchanged %q", got.Email, inserted.Email)
	}
	if got.IsAdmin != inserted.IsAdmin {
		t.Errorf("IsAdmin: got %v, want unchanged %v", got.IsAdmin, inserted.IsAdmin)
	}
}

func TestUpdateUser_NotFound(t *testing.T) {
	repo, cleanup := setupRepo(t)
	defer cleanup()

	newName := "Nobody"
	_, err := repo.UpdateUser("00000000-0000-0000-0000-000000000000", models.UpdateUserInput{Name: &newName})
	if !errors.Is(err, repos.ErrNotFound) {
		t.Errorf("expected repos.ErrNotFound, got %v", err)
	}
}

// --- DeleteUser ---

func TestDeleteUser_OK(t *testing.T) {
	repo, cleanup := setupRepo(t)
	defer cleanup()

	inserted := insertTestUser(t, repo, "grace", "grace@example.com")

	if err := repo.DeleteUser(inserted.ID); err != nil {
		t.Fatalf("DeleteUser: %v", err)
	}
	if _, err := repo.GetUserByID(inserted.ID); !errors.Is(err, repos.ErrNotFound) {
		t.Errorf("expected user to be gone, GetUserByID returned err=%v", err)
	}
}

func TestDeleteUser_NotFound(t *testing.T) {
	repo, cleanup := setupRepo(t)
	defer cleanup()

	err := repo.DeleteUser("00000000-0000-0000-0000-000000000000")
	if !errors.Is(err, repos.ErrNotFound) {
		t.Errorf("expected repos.ErrNotFound for deleting a nonexistent id, got %v", err)
	}
}

// --- UpdatePasswordHash ---

func TestUpdatePasswordHash_OK(t *testing.T) {
	repo, cleanup := setupRepo(t)
	defer cleanup()

	inserted := insertTestUser(t, repo, "heidi", "heidi@example.com")
	newHash := []byte("$2a$10$anothernewfakehash")

	if err := repo.UpdatePasswordHash(inserted.ID, newHash); err != nil {
		t.Fatalf("UpdatePasswordHash: %v", err)
	}

	got, err := repo.GetUserByUsername("heidi")
	if err != nil {
		t.Fatalf("GetUserByUsername: %v", err)
	}
	if string(got.Password_hash) != string(newHash) {
		t.Errorf("Password_hash: got %q, want %q", got.Password_hash, newHash)
	}
}

func TestUpdatePasswordHash_NotFound(t *testing.T) {
	repo, cleanup := setupRepo(t)
	defer cleanup()

	err := repo.UpdatePasswordHash("00000000-0000-0000-0000-000000000000", []byte("hash"))
	if !errors.Is(err, repos.ErrNotFound) {
		t.Errorf("expected repos.ErrNotFound, got %v", err)
	}
}

// --- helpers ---

func insertTestUser(t *testing.T, repo repos.UserRepository, name, email string) *models.User {
	t.Helper()
	user, err := repo.InsertNewUser(models.NewUser{
		Username:      name,
		Email:         email,
		Password_hash: []byte("$2a$10$fakehashfortesting"),
	})
	if err != nil {
		t.Fatalf("insertTestUser(%q): %v", name, err)
	}
	return user
}
