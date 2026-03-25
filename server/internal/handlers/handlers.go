package handlers

import (
	"encoding/json"
	"net/http"
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

		cleanedUsername, isValid := utils.ValidateUsername(req.Username)
		if isValid == false {
			http.Error(w, "Invalid Username", http.StatusBadRequest)
		}

		
	}
}

func GetUser(params *Params) bool {

}
