package handlers

import (
	"net/http"

	json "threejsPortfolioServer/internal/json"
	"threejsPortfolioServer/internal/repos"
)

// Get all users
func ListUsersHandler(repo repos.UserRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		json.WriteError(w, http.StatusNotImplemented, "not implemented")
	}
}

// GET user:id
func GetUserHandler(repo repos.UserRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// implement here
	}
}

// PUT user
func UpdateUserInput(repo repos.UserRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// strub
}
}

// DELETE user
func DeleteUser(repo repos.UserRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		//stub
	}
}