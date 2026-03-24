package main

import (
	"log/slog"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load("../.env.local")

	cfg := config{
		adr: ":" + os.Getenv("PORT"),
		db: dbConfig{
			dsn: os.Getenv("DATABSE_URL"),
		},
	}

	// logger
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	api := application{
		config: cfg,
	}

	// db, err := store.Open(cfg.db.dsn)

	if err := api.run(api.mount()); err != nil {
		slog.Error("Server faield to start", "error", err)
	}

}
