.PHONY: db-create db-tables db-users dev docker-up docker-down

docker-up:
	docker compose up -d

docker-down:
	docker compose down

db-create:
	docker compose exec -T db psql -U threejs_user -d threejs_database -f /docker-entrypoint-initdb.d/seed.sql

db-tables:
	docker compose exec -T db psql -U threejs_user -d threejs_database -c "\dt"

db-users:
	docker compose exec -T db psql -U threejs_user -d threejs_database -c "SELECT id, name, email, is_admin, created_at FROM users ORDER BY created_at;"

dev:
	go run ./cmd/