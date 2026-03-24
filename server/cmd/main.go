package main

import (
	"log"
	"log/slog"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load("../../.env.local")


	cfg := config{
		adr: ":" + os.Getenv("PORT"),
		db: dbConfig{
			dsn: os.Getenv("DATABSE_URL"),
		},
	}
	log.Printf("port is %s", cfg.adr)

	// logger
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	api := application{
		config: cfg,
	}

	// running api server
	if err := api.run(api.mount()); err != nil {
		slog.Error("Server faield to start", "error", err)
	}

}
