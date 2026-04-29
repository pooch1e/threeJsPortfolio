package handlers

import (
	"net/http"

	json "threejsPortfolioServer/internal/json"
	"threejsPortfolioServer/internal/repos"
)

func ListUsersHandler(repo repos.UserRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		json.WriteError(w, http.StatusNotImplemented, "not implemented")
	}
}
