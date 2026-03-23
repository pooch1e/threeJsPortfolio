package config

// DB connection + env vars

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/lib/pq"
)

type Config struct {
	DB            *sql.DB
	GithubClient  string
	GithubSecret  string
	FrontendURL   string
	SessionSecret string
}

func Load() (*Config, error) {
	// opens connection pool to db
	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		return nil, err
	}
	// pings db pool
	if err := db.Ping(); err != nil {
		return nil, err
	}
	log.Printf("DB connected successfully")

	return &Config{
		DB:            db,
		GithubClient:  os.Getenv("GITHUB_CLIENT_ID"),
		GithubSecret:  os.Getenv("GITHUB_CLIENT_SECRET"),
		FrontendURL:   os.Getenv("FRONTEND_URL"),
		SessionSecret: os.Getenv("SESSION_SECRET"),
	}, nil
}
