.PHONY: db-create dev docker-up docker-down

docker-up:
	docker compose up -d

docker-down:
	docker compose down

db-create:
	docker compose exec -T db psql -U threejs_user -d threejs_database -f /docker-entrypoint-initdb.d/seed.sql

dev:
	go run cmd/*.go