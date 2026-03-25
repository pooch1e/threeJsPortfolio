package main

import (
	"log"
	"log/slog"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	godotenv.Load("../.env.local")

	cfg := config{
		adr: ":" + os.Getenv("PORT"),
		db: dbConfig{
			dsn: os.Getenv("DATABASE_URL"),
		},
	}
	log.Printf("dsn is: %s", cfg.db.dsn)
	log.Printf("port is %s", cfg.adr)

	// logger
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	db, err := openDb(cfg.db.dsn)
	if err != nil {
		slog.Error("could not connect to db", "error", err)
	}
	defer db.Close()

	api := application{
		config: cfg,
	}

	// running api server
	if err := api.run(api.mount()); err != nil {
		slog.Error("Server faield to start", "error", err)
	}

}
