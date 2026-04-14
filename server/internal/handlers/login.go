package handlers

import (
	"database/sql"
	stdJSON "encoding/json"
	"log/slog"
	"net/http"
	"threejsPortfolioServer/internal/json"
	"threejsPortfolioServer/internal/repos"
	"threejsPortfolioServer/internal/utils"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token    string `json:"token"`
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
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		if !utils.CheckPasswordHash(creds.Password, string(user.Password_hash)) {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		// generate JWT
		jToken, err := utils.GenerateJwtToken(jwtSecret, user.ID)
		if err != nil {
			slog.Error("Error in creating JWT", "error", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		authRes := LoginResponse{
			Token:    jToken,
			Username: user.Name,
		}

		json.WriteJson(w, 200, authRes)

	}

}
