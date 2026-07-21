package handlers

import (
	stdjson "encoding/json"
	"errors"
	"log/slog"
	"math"
	"net/http"
	"strconv"

	json "threejsPortfolioServer/internal/json"
	"threejsPortfolioServer/internal/models"
	"threejsPortfolioServer/internal/repos"
	"threejsPortfolioServer/internal/utils"

	"github.com/go-chi/chi/v5"
)

type updatePasswordRequest struct {
	Password string `json:"password"`
}

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
		id := chi.URLParam(r, "id")
		if id == "" {
			json.WriteError(w, http.StatusBadRequest, "Id is required")
			return
		}
		user, err := repo.GetUserByID(id)
		if err != nil {
			if errors.Is(err, repos.ErrNotFound) {
				json.WriteError(w, http.StatusNotFound, "User not found")
				return
			}
			json.WriteError(w, http.StatusInternalServerError, "Error in retrieving user")
			return
		}
		json.WriteJson(w, http.StatusOK, user)
	}
}

func UpdateUserHandler(repo repos.UserRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		input := models.UpdateUserInput{}
		id := chi.URLParam(r, "id")
		if id == "" {
			json.WriteError(w, http.StatusBadRequest, "Id is required")
			return
		}

		if err := stdjson.NewDecoder(r.Body).Decode(&input); err != nil {
			json.WriteError(w, http.StatusBadRequest, "Invalid input")
			return
		}

		updatedUser, err := repo.UpdateUser(id, input)
		if err != nil {
			if errors.Is(err, repos.ErrNotFound) {
				json.WriteError(w, http.StatusNotFound, "User not found")
				return
			}
			json.WriteError(w, http.StatusInternalServerError, "Error in updating user")
			return
		}
		json.WriteJson(w, http.StatusOK, updatedUser)
	}
}

func DeleteUser(repo repos.UserRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		if id == "" {
			json.WriteError(w, http.StatusBadRequest, "Id is required")
			return
		}

		if err := repo.DeleteUser(id); err != nil {
			if errors.Is(err, repos.ErrNotFound) {
				json.WriteError(w, http.StatusNotFound, "User not found")
				return
			}
			json.WriteError(w, http.StatusInternalServerError, "Error in deleting user")
			return
		}
		json.WriteJson(w, http.StatusOK, "Successfully deleted user")
	}
}

func UpdatePasswordHashHandler(repo repos.UserRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		if id == "" {
			json.WriteError(w, http.StatusBadRequest, "Id is required")
			return
		}

		var input updatePasswordRequest
		if err := stdjson.NewDecoder(r.Body).Decode(&input); err != nil {
			json.WriteError(w, http.StatusBadRequest, "Invalid input")
			return
		}

		if errMsg := utils.ValidatePasswordRules(input.Password); errMsg != "" {
			json.WriteError(w, http.StatusBadRequest, errMsg)
			return
		}

		hash, err := utils.HashPassword(input.Password)
		if err != nil {
			slog.Error("Error hashing password", "error", err)
			json.WriteError(w, http.StatusInternalServerError, "Error updating password")
			return
		}

		if err := repo.UpdatePasswordHash(id, hash); err != nil {
			if errors.Is(err, repos.ErrNotFound) {
				json.WriteError(w, http.StatusNotFound, "User not found")
				return
			}
			json.WriteError(w, http.StatusInternalServerError, "Error updating password")
			return
		}
		json.WriteJson(w, http.StatusOK, "Successfully updated password")
	}
}
