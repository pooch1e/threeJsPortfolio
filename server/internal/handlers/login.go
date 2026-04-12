package handlers

import (
	"database/sql"
	stdJSON "encoding/json"
	"net/http"
	"threejsPortfolioServer/internal/repos"
	"threejsPortfolioServer/internal/utils"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func LoginHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var creds LoginRequest
		if err := stdJSON.NewDecoder(r.Body).Decode(&creds); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		cleanedUsername, isUsernameValid := utils.ValidateUsername(creds.Username)
		if isUsernameValid == false {
			http.Error(w, "Invalid Username", http.StatusBadRequest)
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
	}

}
