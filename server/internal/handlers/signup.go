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
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		cleanedUsername, isUsernameValid := utils.ValidateUsername(req.Username)
		if isUsernameValid == false {
			http.Error(w, "Invalid Username", http.StatusBadRequest)
			return
		}

		cleanedEmail, isEmailValid := utils.ValidateEmail(req.Email)
		if isEmailValid == false {
			http.Error(w, "Invalid Email", http.StatusBadRequest)
			return
		}

		cleanedPassword, isPasswordValid := utils.ValidatePassword(req.Password)
		if isPasswordValid == false {
			http.Error(w, "Invalid Password", http.StatusBadRequest)
			return
		}

		// check for duplicate account
		exists, err := repos.CheckUserExists(db, cleanedEmail)
		if err != nil {
			slog.Error("Error checking for existing user", "error", err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
		if exists {
			http.Error(w, "An account with this email already exists", http.StatusConflict)
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
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
		json.WriteJson(w, 201, result)

	}

}

// func GetUser(params *Params) bool {

// }
