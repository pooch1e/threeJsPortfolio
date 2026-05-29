package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"threejsPortfolioServer/internal/handlers"
	appMiddleware "threejsPortfolioServer/internal/middleware"
	"threejsPortfolioServer/internal/repos"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func (app *application) mount() http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS must list the exact frontend origin when AllowCredentials is true.
	// Wildcards are forbidden by the CORS spec once credentials are enabled.
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{frontendURL},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(middleware.Timeout(60 * time.Second))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("hi"))
	})

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Public routes — no auth required.
	r.Post("/api/signup", handlers.SignupHandler(app.userRepo))
	r.Post("/api/login", handlers.LoginHandler(app.userRepo, app.config.jwtSecret))

	// Protected routes — RequireAuth middleware validates the session cookie.
	r.Group(func(r chi.Router) {
		r.Use(appMiddleware.RequireAuth(app.config.jwtSecret))
		r.Get("/api/me", handlers.MeHandler(app.userRepo))

		// Admin-only routes.
		r.Group(func(r chi.Router) {
			r.Use(appMiddleware.RequireAdmin(app.userRepo))
			r.Get("/api/admin/users", handlers.ListUsersHandler(app.userRepo))
			r.Get("/api/admin/users/{id}", handlers.GetUserHandler(app.userRepo))
			r.Put("/api/admin/users/{id}", handlers.UpdateUserInput(app.userRepo))
			r.Delete("/api/admin/users/{id}", handlers.DeleteUser(app.userRepo))
		})

		r.Post("/api/logout", handlers.LogoutHandler())
	})

	return r
}

// run starts the HTTP server and blocks until SIGINT/SIGTERM is received.
// On signal it attempts a graceful shutdown, draining in-flight requests for
// up to 10 seconds before the process exits.
func (app *application) run(h http.Handler) error {
	server := &http.Server{
		Addr:         app.config.adr,
		Handler:      h,
		WriteTimeout: time.Second * 30,
		ReadTimeout:  time.Second * 10,
		IdleTimeout:  time.Minute,
	}

	shutdownErr := make(chan error, 1)

	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit

		log.Println("shutting down server gracefully...")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		shutdownErr <- server.Shutdown(ctx)
	}()

	log.Printf("starting server at %s", app.config.adr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return err
	}

	return <-shutdownErr
}

// openDb opens and pings the PostgreSQL connection.
func openDb(dsn string) (*sql.DB, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	return db, nil
}

type application struct {
	config   config
	userRepo repos.UserRepository
}

type config struct {
	adr                string
	db                 dbConfig
	githubClientID     string
	gitHubClientSecret string
	frontendURL        string
	sessionSecret      string
	jwtSecret          string
}

type dbConfig struct {
	dsn string
}
