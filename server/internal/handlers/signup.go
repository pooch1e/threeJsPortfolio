package handlers

import (
	stdJSON "encoding/json"
	"log/slog"
	"net/http"

	"threejsPortfolioServer/internal/json"
	"threejsPortfolioServer/internal/models"
	"threejsPortfolioServer/internal/repos"
	"threejsPortfolioServer/internal/utils"
)

func writeError(w http.ResponseWriter, status int, msg string) {
	json.WriteError(w, status, msg)
}

type SignupRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func SignupHandler(repo repos.UserRepository) http.HandlerFunc {
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

		exists, err := repo.CheckUserExists(cleanedEmail)
		if err != nil {
			slog.Error("Error checking for existing user", "error", err)
			writeError(w, http.StatusInternalServerError, "Database error")
			return
		}
		if exists {
			writeError(w, http.StatusConflict, "An account with this email already exists")
			return
		}

		newUser := models.NewUser{
			Username:      cleanedUsername,
			Email:         cleanedEmail,
			Password_hash: cleanedPassword,
		}
		result, err := repo.InsertNewUser(newUser)
		if err != nil {
			slog.Error("Error inserting new user", "error", err)
			writeError(w, http.StatusInternalServerError, "Database error")
			return
		}
		json.WriteJson(w, http.StatusCreated, result)
	}
}
