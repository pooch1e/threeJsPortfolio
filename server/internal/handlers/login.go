package handlers

import (
	stdJSON "encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"time"

	"threejsPortfolioServer/internal/json"
	"threejsPortfolioServer/internal/repos"
	"threejsPortfolioServer/internal/utils"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse is what we send back on successful login.
// Only safe, non-sensitive fields are included.
type LoginResponse struct {
	Username string `json:"username"`
}

func LoginHandler(repo repos.UserRepository, jwtSecret string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var creds LoginRequest
		if err := stdJSON.NewDecoder(r.Body).Decode(&creds); err != nil {
			writeError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		cleanedUsername, usernameErr := utils.ValidateUsername(creds.Username)
		if usernameErr != "" {
			writeError(w, http.StatusBadRequest, usernameErr)
			return
		}

		user, err := repo.GetUserByUsername(cleanedUsername)
		if err != nil {
			if !errors.Is(err, repos.ErrNotFound) {
				slog.Error("Error fetching user for login", "error", err)
			}
			// Return the same message regardless of whether the user exists or
			// whether the DB is down — never leak which condition triggered this.
			writeError(w, http.StatusUnauthorized, "Invalid credentials")
			return
		}

		if !utils.CheckPasswordHash(creds.Password, string(user.Password_hash)) {
			writeError(w, http.StatusUnauthorized, "Invalid credentials")
			return
		}

		jToken, err := utils.GenerateJwtToken(jwtSecret, user.ID)
		if err != nil {
			slog.Error("Error creating JWT", "error", err)
			writeError(w, http.StatusInternalServerError, "Internal server error")
			return
		}

		sameSite, secure := sessionCookieFlags()

		http.SetCookie(w, &http.Cookie{
			Name:     "session",
			Value:    jToken,
			Path:     "/",
			Expires:  time.Now().Add(time.Hour),
			HttpOnly: true,
			Secure:   secure,
			SameSite: sameSite,
		})

		json.WriteJson(w, http.StatusOK, LoginResponse{Username: user.Name})
	}
}

// sessionCookieFlags returns the SameSite/Secure attributes the "session"
// cookie must be set (and cleared) with. Browsers reject a Set-Cookie that
// drops Secure/SameSite=None from a cookie previously set with them ("Leave
// Secure Cookies Alone", RFC 6265bis), so login and logout must agree.
func sessionCookieFlags() (http.SameSite, bool) {
	if os.Getenv("APP_ENV") == "production" {
		return http.SameSiteNoneMode, true
	}
	return http.SameSiteLaxMode, false
}
