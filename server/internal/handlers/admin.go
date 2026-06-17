package handlers

import (
	"math"
	"net/http"
	"strconv"

	json "threejsPortfolioServer/internal/json"
	"threejsPortfolioServer/internal/models"
	"threejsPortfolioServer/internal/repos"
)

type paginationMeta struct {
	Page int`json:"page"`
	Limit int`json:"limit"`
	Total int`json:"total"`
	TotalPages int`json:"total_pages"`
}

type listUsersResponse struct {
	Users []models.User `json:"users"`
	Pagination paginationMeta `json:"pagination"`
}

// Get all users
func ListUsersHandler(repo repos.UserRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pageString := r.URL.Query().Get("page")
		pageInt, _ := strconv.Atoi(pageString)

		if pageInt <= 1 {
			pageInt = 1
		}

		limit := r.URL.Query().Get("limit")
		limitInt, _ := strconv.Atoi(limit)

		if limitInt <= 1 {
			limitInt = 20
		}

		if limitInt > 100 {
			limitInt = 100
		}

		offset := (pageInt - 1) * limitInt

		// call repo and get list of users
		usersList, err := repo.GetAllUsers(limitInt, offset)
		if err != nil {
			json.WriteError(w, http.StatusInternalServerError, "Error in retrieving user list")
		}

		userCount, err := repo.GetUserCount()
		if err != nil {
			json.WriteError(w, http.StatusInternalServerError, "Error in retrieving user count")
		}

		totalPages := int(math.Ceil(float64(userCount)/float64(limitInt)))
		// build meta payload
		meta := paginationMeta{
			Page: pageInt,
			Limit: limitInt,
			Total: userCount,
			TotalPages: totalPages,

		}


		json.WriteJson(w, http.StatusOK, listUsersResponse{
			Users: usersList,
			Pagination: meta,
		})
	}
}

// GET user:id
func GetUserHandler(repo repos.UserRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// implement here
	}
}

// PUT user
func UpdateUserInput(repo repos.UserRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// strub
}
}

// DELETE user
func DeleteUser(repo repos.UserRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		//stub
	}
}