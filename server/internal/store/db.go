package store

import "database/sql"

func Open(dsn string) (*sql.DB, error) {
	db, err := sql.Open("postgres", dsn)
	return db, err
}
 