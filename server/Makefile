.PHONY: db-create dev docker-up docker-down

docker-up:
	docker compose up -d

docker-down:
	docker compose down

db-create:
	set -a; \
	. .env; \
	set +a; \
	psql "$${DATABASE_URL}" -f db/seed/seed.sql

dev:
	go run cmd/*.go