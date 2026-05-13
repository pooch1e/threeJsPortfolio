//go:build integration

package testutil

import (
	"context"
	"database/sql"
	"fmt"
	"testing"
	"time"

	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
	_ "github.com/lib/pq"
)

// schema is the canonical DB schema for tests, derived from db/seed/seed.sql
// but without the psql meta-command (\c) which cannot run via sql.Exec.
const schema = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    github_id    TEXT UNIQUE,
    name         TEXT NOT NULL,
    email        TEXT NOT NULL UNIQUE,
    avatar_url   TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    password_hash TEXT,
    is_admin     BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS sessions (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token      TEXT UNIQUE NOT NULL,
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`

// NewTestDB starts a postgres:16 container, applies the schema, and returns an
// open *sql.DB ready for use. The returned cleanup func terminates the container
// and closes the connection; always call it with defer.
func NewTestDB(t *testing.T) (*sql.DB, func()) {
	t.Helper()
	ctx := context.Background()

	req := testcontainers.ContainerRequest{
		Image:        "postgres:16",
		ExposedPorts: []string{"5432/tcp"},
		Env: map[string]string{
			"POSTGRES_USER":     "test_user",
			"POSTGRES_PASSWORD": "test_pass",
			"POSTGRES_DB":       "test_db",
		},
		WaitingFor: wait.ForLog("database system is ready to accept connections").
			WithOccurrence(2).
			WithStartupTimeout(60 * time.Second),
	}

	ctr, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	if err != nil {
		t.Fatalf("NewTestDB: start container: %v", err)
	}

	host, err := ctr.Host(ctx)
	if err != nil {
		ctr.Terminate(ctx)
		t.Fatalf("NewTestDB: get host: %v", err)
	}

	port, err := ctr.MappedPort(ctx, "5432")
	if err != nil {
		ctr.Terminate(ctx)
		t.Fatalf("NewTestDB: get port: %v", err)
	}

	dsn := fmt.Sprintf(
		"postgres://test_user:test_pass@%s:%s/test_db?sslmode=disable",
		host, port.Port(),
	)

	// Retry: container may accept TCP before postgres is ready to query.
	var db *sql.DB
	for i := 0; i < 15; i++ {
		db, err = sql.Open("postgres", dsn)
		if err == nil {
			if pingErr := db.Ping(); pingErr == nil {
				break
			}
			db.Close()
			db = nil
		}
		time.Sleep(time.Second)
	}
	if db == nil {
		ctr.Terminate(ctx)
		t.Fatalf("NewTestDB: could not connect after retries: %v", err)
	}

	if _, err := db.ExecContext(ctx, schema); err != nil {
		db.Close()
		ctr.Terminate(ctx)
		t.Fatalf("NewTestDB: apply schema: %v", err)
	}

	cleanup := func() {
		db.Close()
		ctr.Terminate(ctx)
	}
	return db, cleanup
}

// TruncateTables clears all rows between tests. CASCADE handles the FK from
// sessions → users.
func TruncateTables(t *testing.T, db *sql.DB) {
	t.Helper()
	if _, err := db.Exec("TRUNCATE TABLE sessions, users CASCADE"); err != nil {
		t.Fatalf("TruncateTables: %v", err)
	}
}
