package handlers

import (
	"errors"
	"net/http"

	"threejsPortfolioServer/internal/json"
	appMiddleware "threejsPortfolioServer/internal/middleware"
	"threejsPortfolioServer/internal/repos"
)

// MeHandler returns the currently authenticated user's profile.
// It relies on RequireAuth middleware having already stored the userID in context.
func MeHandler(repo repos.UserRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := appMiddleware.GetUserID(r)
		if userID == "" {
			// Should never reach here if RequireAuth is applied, but be defensive.
			json.WriteError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		user, err := repo.GetUserByID(userID)
		if err != nil {
			if errors.Is(err, repos.ErrNotFound) {
				json.WriteError(w, http.StatusNotFound, "User not found")
				return
			}
			json.WriteError(w, http.StatusInternalServerError, "Internal server error")
			return
		}

		json.WriteJson(w, http.StatusOK, LoginResponse{Username: user.Name})
	}
}
