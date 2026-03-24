package main

import (
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
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

	// Set a timeout value on the request context (ctx), that will signal
	// through ctx.Done() that the request has timed out and further
	// processing should be stopped.
	r.Use(middleware.Timeout(60 * time.Second))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("hi"))
	})

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

	log.Printf("server has started at %s", app.config.adr)
	return server.ListenAndServe()
}

// Structs hold data
// eg in JS would be values
type application struct {
	config config
	// logger
}

type config struct {
	adr                string
	db                 dbConfig
	githubClientID     string
	gitHubClientSecret string
	frontendURL        string
	sessionSecret      string
}

type dbConfig struct {
	dsn string
}
