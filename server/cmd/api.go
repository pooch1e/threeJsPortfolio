package main

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"threejsPortfolioServer/internal/handlers"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// funcs in go have recievers (the application part in the statement below)
// that point to what struct they are a part of
// * indicates a reference, so it will mutate original reference whereas without * will copy

func (app *application) mount() http.Handler {
	r := chi.NewRouter()

	// A good base middleware stack
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		// AllowedOrigins:   []string{"https://foo.com"}, // Use this to allow specific origin hosts
		AllowedOrigins: []string{"https://*", "http://*", "http://localhost:5173"},
		// AllowOriginFunc:  func(r *http.Request, origin string) bool { return true },
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))

	// Set a timeout value on the request context (ctx), that will signal
	// through ctx.Done() that the request has timed out and further
	// processing should be stopped.
	r.Use(middleware.Timeout(60 * time.Second))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("hi"))
	})
	// login signup
	r.Get("/api/signup", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("get Signup Endpoint"))
	})
	r.Post("/api/signup", handlers.SignupHandler(app.db))
	r.Post("/api/login", handlers.LoginHandler(app.db, app.config.jwtSecret))

	return r
}

// run
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

// open db connection

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

// Structs hold data
// eg in JS would be values
type application struct {
	config config
	db     *sql.DB
	// logger
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
