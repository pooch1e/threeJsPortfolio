package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"threejsPortfolioServer/internal/models"
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

func SignupHandler(app *application) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req SignupRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		cleanedUsername, isUsernameValid := utils.ValidateUsername(req.Username)
		if isUsernameValid == false {
			http.Error(w, "Invalid Username", http.StatusBadRequest)
		}

		cleanedEmail, isEmailValid := utils.ValidateEmail(req.Email)
		if isEmailValid == false {
			http.Error(w, "Invalid Email", http.StatusBadRequest)
		}

		cleanedPassword, isPasswordValid := utils.ValidatePassword(req.Password)
		if isPasswordValid == false {
			http.Error(w, "Invalid Password", http.StatusBadRequest)
		}

		// call db
		newUser := models.NewUser{
			Username: cleanedUsername,
			Email:    cleanedEmail,
			Password: cleanedPassword,
		}
		result, err := models.InsertNewUser(app.db, newUser)
		// inspect return
		if err != nil {
			// somehow surface error with db
			slog.Error("Error in posting sign up to database", "error", err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
		return
	}

}

func GetUser(params *Params) bool {

}
