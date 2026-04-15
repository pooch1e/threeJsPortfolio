package handlers

import (
	"database/sql"
	"net/http"

	"threejsPortfolioServer/internal/json"
	appMiddleware "threejsPortfolioServer/internal/middleware"
	"threejsPortfolioServer/internal/repos"
)

// MeHandler returns the currently authenticated user's profile.
// It relies on RequireAuth middleware having already run and placed
// the userID into the request context.
func MeHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Read the userID that RequireAuth stored in context
		userID := appMiddleware.GetUserID(r)
		if userID == "" {
			// Should never happen if RequireAuth is applied, but be defensive
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		user, err := repos.GetUserByID(db, userID)
		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		// LoginResponse re-used here: only username is sent to the client
		json.WriteJson(w, http.StatusOK, LoginResponse{Username: user.Name})
	}
}
