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
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		user, err := repo.GetUserByID(userID)
		if err != nil {
			if errors.Is(err, repos.ErrNotFound) {
				http.Error(w, "User not found", http.StatusNotFound)
				return
			}
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		json.WriteJson(w, http.StatusOK, LoginResponse{Username: user.Name})
	}
}
