package handlers

import (
	"net/http"
	"time"
)

// LogoutHandler clears the session cookie by overwriting it with an
// already-expired one. The browser will delete it immediately.
func LogoutHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		http.SetCookie(w, &http.Cookie{
			Name:     "session",
			Value:    "",
			Path:     "/",
			Expires:  time.Unix(0, 0), // epoch = already expired
			MaxAge:   -1,              // belt-and-suspenders: MaxAge=-1 also tells browser to delete
			HttpOnly: true,
		})
		w.WriteHeader(http.StatusOK)
	}
}
