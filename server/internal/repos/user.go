package repos

import (
	"database/sql"
	"errors"
	"log/slog"

	"threejsPortfolioServer/internal/models"
)


var ErrNotFound = errors.New("not found")

type PostgresUserRepo struct {
	db *sql.DB
}


func NewPostgresUserRepo(db *sql.DB) *PostgresUserRepo {
	return &PostgresUserRepo{db: db}
}

func (r *PostgresUserRepo) CheckUserExists(email string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`, email,
	).Scan(&exists)
	if err != nil {
		slog.Error("Error checking if user exists", "error", err)
		return false, err
	}
	return exists, nil
}

func (r *PostgresUserRepo) InsertNewUser(user models.NewUser) (*models.User, error) {
	var created models.User
	err := r.db.QueryRow(
		`INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
		 RETURNING id, name, email, is_admin, created_at, updated_at`,
		user.Username, user.Email, user.Password_hash,
	).Scan(
		&created.ID, &created.Name, &created.Email,
		&created.IsAdmin, &created.CreatedAt, &created.UpdatedAt,
	)
	if err != nil {
		slog.Error("Error inserting user", "error", err)
		return nil, err
	}
	return &created, nil
}

func (r *PostgresUserRepo) GetUserByID(id string) (*models.User, error) {
	var user models.User
	err := r.db.QueryRow(
		`SELECT id, name, email, is_admin, created_at, updated_at
		 FROM users WHERE id = $1`,
		id,
	).Scan(
		&user.ID, &user.Name, &user.Email,
		&user.IsAdmin, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		slog.Error("Error getting user by ID", "error", err)
		return nil, err
	}
	return &user, nil
}

func (r *PostgresUserRepo) GetAllUsers(limit, offset int) ([]models.User, error) {
	var users []models.User
	rows, err := r.db.Query(
		`SELECT * FROM users WHERE is_admin = true ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var u models.User
		err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.IsAdmin, &u.CreatedAt, &u.UpdatedAt)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
			if err := rows.Err(); err != nil {
			return nil, err
		}

	return users, nil
}

func (r *PostgresUserRepo) GetUserCount() (int, error) {
	var count int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&count)
	if err != nil {
		slog.Error("Error checking count of users", "error", err)
		return 0, err
	}
	return count, nil
}

func (r *PostgresUserRepo) GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	err := r.db.QueryRow(
		`SELECT id, name, email, password_hash, is_admin, created_at, updated_at
		 FROM users WHERE name = $1`,
		username,
	).Scan(
		&user.ID, &user.Name, &user.Email, &user.Password_hash,
		&user.IsAdmin, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		slog.Error("Error getting user by username", "error", err)
		return nil, err
	}
	return &user, nil
}

func (r *PostgresUserRepo) UpdateUser(id string, input models.UpdateUserInput) (*models.User, error) {
	// stub
	return nil, nil
}

func (r *PostgresUserRepo) DeleteUser(id string) error {
	return nil
}
