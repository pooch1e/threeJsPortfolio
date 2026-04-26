// reads user id from context
// fetches user
// checks isadmin
// returns 403 if false

package middleware

import "net/http"

func RequireAdmin(queries *db.Queries) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
userID := GetUserID(r)
			if userID == "" {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

		})
	}
}