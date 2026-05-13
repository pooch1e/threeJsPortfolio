package middleware

import (
	"errors"
	"net/http"

	appJSON "threejsPortfolioServer/internal/json"
	"threejsPortfolioServer/internal/repos"
)

func RequireAdmin(repo repos.UserRepository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userID := GetUserID(r)
			if userID == "" {
				appJSON.WriteError(w, http.StatusUnauthorized, "Unauthorized")
				return
			}

			user, err := repo.GetUserByID(userID)
			if err != nil {
				if errors.Is(err, repos.ErrNotFound) {
					appJSON.WriteError(w, http.StatusUnauthorized, "Unauthorized")
					return
				}
				appJSON.WriteError(w, http.StatusInternalServerError, "Internal server error")
				return
			}

			if !user.IsAdmin {
				appJSON.WriteError(w, http.StatusForbidden, "Forbidden")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
