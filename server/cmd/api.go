package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"time"

	"threejsPortfolioServer/internal/handlers"
	appMiddleware "threejsPortfolioServer/internal/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// funcs in go have receivers (the application part in the statement below)
// that point to what struct they are a part of
// * indicates a reference, so it will mutate original reference whereas without * will copy

func (app *application) mount() http.Handler {
	r := chi.NewRouter()

	// A good base middleware stack
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS must list the exact frontend origin when AllowCredentials is true.
	// Wildcards ("https://*") are forbidden by the CORS spec once credentials are enabled -
	// the browser will reject the response. We read the origin from the env so it can
	// differ between dev (localhost:5173) and production.
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{frontendURL},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true, // required so the browser sends/receives httpOnly cookies
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

	// Public routes - no auth required
	r.Post("/api/signup", handlers.SignupHandler(app.db))
	r.Post("/api/login", handlers.LoginHandler(app.db, app.config.jwtSecret))

	// Protected routes - RequireAuth middleware runs first.
	// If the session cookie is missing or invalid, the middleware returns 401
	// and the handler is never called.
	r.Group(func(r chi.Router) {
		r.Use(appMiddleware.RequireAuth(app.config.jwtSecret))
		r.Use(appMiddleware.RequireAdmin(app.db))
		r.Get("/api/me", handlers.MeHandler(app.db))
		r.Post("/api/logout", handlers.LogoutHandler())
	})

	return r
}

// run starts the HTTP server
func (app *application) run(h http.Handler) error {
	server := &http.Server{
		Addr:         app.config.adr,
		Handler:      h,
		WriteTimeout: time.Second * 30,
		ReadTimeout:  time.Second * 10,
		IdleTimeout:  time.Minute,
	}

	log.Printf("starting server at %s", app.config.adr)
	return server.ListenAndServe()
}

// openDb opens and pings the PostgreSQL connection
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

// application holds the dependencies available to all handlers
type application struct {
	config config
	db     *sql.DB
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
