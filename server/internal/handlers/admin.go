package handlers

import (
	"log/slog"
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
		pageInt, err := strconv.Atoi(pageString)
		if err != nil || pageInt < 1 {
			pageInt = 1
		}

		limit := r.URL.Query().Get("limit")
		limitInt, err := strconv.Atoi(limit)
		if err != nil || limitInt < 1 {
			limitInt = 20
		}

		if limitInt > 100 {
			limitInt = 100
		}

		offset := (pageInt - 1) * limitInt

		usersList, err := repo.GetAllUsers(limitInt, offset)
		if err != nil {
			slog.Error("ListUsersHandler: GetAllUsers failed", "error", err)
			json.WriteError(w, http.StatusInternalServerError, "Error in retrieving user list")
			return
		}

		userCount, err := repo.GetUserCount()
		if err != nil {
			slog.Error("ListUsersHandler: GetUserCount failed", "error", err)
			json.WriteError(w, http.StatusInternalServerError, "Error in retrieving user count")
			return
		}
		if usersList == nil {
			usersList = []models.User{}
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

func GetUserHandler(repo repos.UserRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		username := r.URL.Query().Get("username")
		if username == "" {
			json.WriteError(w, http.StatusBadRequest, "Username is required")
			return
		}
		user, err := repo.GetUserByUsername(username)
		if err != nil {
			json.WriteError(w, http.StatusInternalServerError, "Error in retrieving user")
			return
		}
		if user == nil {
			json.WriteError(w, http.StatusNotFound, "User not found")
			return
		}
		json.WriteJson(w, http.StatusOK, user)
	}
}

func UpdateUserHandler(repo repos.UserRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		updatedUserInput := r.URL.Query().Get("username")
		if username == "" {
			json.WriteError(w, http.StatusBadRequest, "Username is required")
			return
		}
		updatedUser, err := repo.UpdateUser(username, models.UpdateUserInput{})
		if err != nil {
			json.WriteError(w, http.StatusInternalServerError, "Error in updating user")
			return
		}
		json.WriteJson(w, http.StatusOK, updatedUser)
	}
}

func DeleteUser(repo repos.UserRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		json.WriteError(w, http.StatusNotImplemented, "Not implemented")
	}
}

func UpdatePasswordHashHandler(repo repos.UserRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		json.WriteError(w, http.StatusNotImplemented, "Not implemented")
	}
}
