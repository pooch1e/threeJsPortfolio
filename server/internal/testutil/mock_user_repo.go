package testutil

import "threejsPortfolioServer/internal/models"

// MockUserRepo is a configurable test double for repos.UserRepository.
// Set each Fn field in individual tests to control behavior for that path.
// Unset fields return safe zero values (false/nil, nil error) by default.
type MockUserRepo struct {
	CheckUserExistsFn   func(email string) (bool, error)
	InsertNewUserFn     func(user models.NewUser) (*models.User, error)
	GetUserByIDFn       func(id string) (*models.User, error)
	GetUserByUsernameFn func(username string) (*models.User, error)
	UpdateUserFn 				func(id string, input models.UpdateUserInput) ( *models.User, error)
	DeleteUserFn 				func(id string) error
	UpdatePasswordHashFn func(id string, passwordHash []byte) error

	// mocks
	GetAllUsersFn func(limit, offset int) ([]models.User, error)
	GetUserCountFn func() (int, error)
}

func (m *MockUserRepo) CheckUserExists(email string) (bool, error) {
	if m.CheckUserExistsFn != nil {
		return m.CheckUserExistsFn(email)
	}
	return false, nil
}

func (m *MockUserRepo) InsertNewUser(user models.NewUser) (*models.User, error) {
	if m.InsertNewUserFn != nil {
		return m.InsertNewUserFn(user)
	}
	return nil, nil
}

func (m *MockUserRepo) GetUserByID(id string) (*models.User, error) {
	if m.GetUserByIDFn != nil {
		return m.GetUserByIDFn(id)
	}
	return nil, nil
}

func (m *MockUserRepo) GetUserByUsername(username string) (*models.User, error) {
	if m.GetUserByUsernameFn != nil {
		return m.GetUserByUsernameFn(username)
	}
	return nil, nil
}

func (m *MockUserRepo) GetAllUsers(limit, offset int) ([]models.User, error) {
	if m.GetAllUsersFn != nil {
		return m.GetAllUsersFn(limit, offset)
	}
	return nil, nil
}

func (m *MockUserRepo) GetUserCount() (int, error) {
	if m.GetUserCountFn != nil {
		return m.GetUserCountFn()
	}
	return 0, nil
}

func (m *MockUserRepo) UpdateUser(id string, input models.UpdateUserInput) (*models.User, error) {
	// stub
	if m.UpdateUserFn != nil {
		return m.UpdateUserFn(id, input)
	}
	return nil, nil
}

func (m *MockUserRepo) DeleteUser(id string) (error) {
	if m.DeleteUserFn != nil {
		return m.DeleteUserFn(id)
	}
	return nil
}

func (m *MockUserRepo) UpdatePasswordHash(id string, passwordHash []byte) error {
	if m.UpdatePasswordHashFn != nil {
		return m.UpdatePasswordHashFn(id, passwordHash)
	}
	return nil
}
