package main

import (
	"errors"
	"log"
	"log/slog"
	"os"
	"syscall"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	godotenv.Load("../.env.local")

	cfg := config{
		adr:       ":" + os.Getenv("PORT"),
		jwtSecret: os.Getenv("JWT_SECRET"),
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
		db:     db,
	}

	// running api server
	if err := api.run(api.mount()); err != nil {
		if errors.Is(err, syscall.EADDRINUSE) {
			slog.Error("port already in use", "port", cfg.adr, "hint", "kill the process using this port or change PORT in .env.local")
		} else {
			slog.Error("server failed to start", "error", err)
		}
		os.Exit(1)
	}

}
