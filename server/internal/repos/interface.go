package repos

import "threejsPortfolioServer/internal/models"

// UserRepository is the data-access contract for user operations.
// Handlers and middleware depend on this interface rather than *sql.DB directly,
// so they can be unit-tested with a mock without a running database.
type UserRepository interface {
	CheckUserExists(email string) (bool, error)
	InsertNewUser(user models.NewUser) (*models.User, error)
	GetUserByID(id string) (*models.User, error)
	GetUserByUsername(username string) (*models.User, error)
	GetAllUsers(limit, offset int) ([]models.User, error)
	GetUserCount() (int, error)
	UpdateUser(id string, input models.UpdateUserInput) (*models.User, error)
}
