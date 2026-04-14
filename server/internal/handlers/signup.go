package handlers

import (
	"database/sql"
	stdJSON "encoding/json"
	"log/slog"
	"net/http"
	"threejsPortfolioServer/internal/json"
	"threejsPortfolioServer/internal/models"
	"threejsPortfolioServer/internal/repos"
	"threejsPortfolioServer/internal/utils"
)

func writeError(w http.ResponseWriter, status int, msg string) {
	json.WriteJson(w, status, map[string]string{"error": msg})
}

// take request - do something with it/ sanatise whatever
// then pass to repo (for db)

type Params struct {
	username string
}

type SignupRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func SignupHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req SignupRequest
		if err := stdJSON.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		cleanedUsername, usernameErr := utils.ValidateUsername(req.Username)
		if usernameErr != "" {
			writeError(w, http.StatusBadRequest, usernameErr)
			return
		}

		cleanedEmail, emailErr := utils.ValidateEmail(req.Email)
		if emailErr != "" {
			writeError(w, http.StatusBadRequest, emailErr)
			return
		}

		cleanedPassword, passwordErr := utils.ValidatePassword(req.Password)
		if passwordErr != "" {
			writeError(w, http.StatusBadRequest, passwordErr)
			return
		}

		// check for duplicate account
		exists, err := repos.CheckUserExists(db, cleanedEmail)
		if err != nil {
			slog.Error("Error checking for existing user", "error", err)
			writeError(w, http.StatusInternalServerError, "Database error")
			return
		}
		if exists {
			writeError(w, http.StatusConflict, "An account with this email already exists")
			return
		}

		// call db
		newUser := models.NewUser{
			Username:      cleanedUsername,
			Email:         cleanedEmail,
			Password_hash: []byte(cleanedPassword),
		}
		result, err := repos.InsertNewUser(db, newUser)
		if err != nil {
			slog.Error("Error in posting sign up to database", "error", err)
			writeError(w, http.StatusInternalServerError, "Database error")
			return
		}
		json.WriteJson(w, 201, result)

	}

}

// func GetUser(params *Params) bool {

// }
