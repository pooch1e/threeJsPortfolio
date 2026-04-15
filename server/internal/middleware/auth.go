package middleware

import (
	"context"
	"net/http"

	"threejsPortfolioServer/internal/utils"
)

// contextKey is an unexported type for context keys in this package.
// Using a custom type prevents collisions with keys from other packages.
type contextKey string

const UserIDKey contextKey = "userID"

// RequireAuth returns a middleware that validates the "session" httpOnly cookie.
// On success, it stores the userID in the request context and calls next.
// On failure, it returns 401 and stops the chain - the handler never runs.
//
// Usage in chi:
//
//	r.Group(func(r chi.Router) {
//	    r.Use(middleware.RequireAuth(jwtSecret))
//	    r.Get("/api/me", handlers.MeHandler(db))
//	})
func RequireAuth(jwtSecret string) func(http.Handler) http.Handler {
	// This outer function is called once at startup when wiring up routes.
	// It returns the actual middleware function.
	return func(next http.Handler) http.Handler {
		// http.HandlerFunc is a type that implements http.Handler.
		// We return one here so chi can chain it with other middleware.
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie("session")
			if err != nil {
				// err is http.ErrNoCookie if the cookie doesn't exist
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			userID, err := utils.ParseJwtToken(cookie.Value, jwtSecret)
			if err != nil {
				// Token is expired, tampered, or otherwise invalid
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			// Store userID in the request context so downstream handlers can read it.
			// context.WithValue returns a new context derived from r.Context().
			ctx := context.WithValue(r.Context(), UserIDKey, userID)

			// r.WithContext returns a shallow copy of r with the new context attached.
			// We pass this new request to the next handler.
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserID is a helper that downstream handlers call to retrieve the userID
// that RequireAuth stored in the context. Returns empty string if not present.
func GetUserID(r *http.Request) string {
	userID, _ := r.Context().Value(UserIDKey).(string)
	return userID
}
