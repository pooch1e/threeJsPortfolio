package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"os/user"
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

type SignUpDbParams struct {
	cleanedUsername string
	cleanedEmail string
	cleanedPassword string
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
		handledSignUpRequest, err := models.HandleSignUp({cleanedUsername, cleanedEmail, cleanedPassword})
		if err != nil {
			// somehow surface error with db
			slog.Error("Error in posting sign up to database", "error", err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
	}

}

func GetUser(params *Params) bool {

}
