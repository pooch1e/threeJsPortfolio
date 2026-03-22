.PHONY: db-create dev

DB_URL ?= $(shell grep DATABASE_URL .env.local | cut -d '=' -f2-)

db-create:
	psql "$(DB_URL)" -f db/seed/seed.sql

dev:
	go run cmd/server/main.go
