package handlers

import (
	"database/sql"
	stdJSON "encoding/json"
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

// LoginResponse is what we send back to the client on successful login.
// Only safe, non-sensitive fields are included.
type LoginResponse struct {
	Username string `json:"username"`
}

func LoginHandler(db *sql.DB, jwtSecret string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var creds LoginRequest
		if err := stdJSON.NewDecoder(r.Body).Decode(&creds); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		cleanedUsername, usernameErr := utils.ValidateUsername(creds.Username)
		if usernameErr != "" {
			writeError(w, http.StatusBadRequest, usernameErr)
			return
		}

		user, err := repos.GetUserByUsername(db, cleanedUsername)
		if err != nil {
			// Don't reveal whether the username exists or not
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		if !utils.CheckPasswordHash(creds.Password, string(user.Password_hash)) {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		jToken, err := utils.GenerateJwtToken(jwtSecret, user.ID)
		if err != nil {
			slog.Error("Error creating JWT", "error", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		// SameSite=Lax works for localhost dev (same host, different port).
		// In production (different domains) you need SameSite=None + Secure=true.
		sameSite := http.SameSiteLaxMode
		secure := false
		if os.Getenv("APP_ENV") == "production" {
			sameSite = http.SameSiteNoneMode
			secure = true
		}

		http.SetCookie(w, &http.Cookie{
			Name:     "session",
			Value:    jToken,
			Path:     "/",
			Expires:  time.Now().Add(time.Hour),
			HttpOnly: true, // JS cannot read this cookie - protects against XSS
			Secure:   secure,
			SameSite: sameSite,
		})

		json.WriteJson(w, http.StatusOK, LoginResponse{Username: user.Name})
	}
}
