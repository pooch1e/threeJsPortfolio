# DEPRECATED: Go server dev tasks (historical). Postgres credentials come from ../.env.local, never hardcoded.
.PHONY: db-create db-tables db-users dev docker-up docker-down

COMPOSE = docker compose --env-file ../.env.local
PSQL = $(COMPOSE) exec -T db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" $(1)'

docker-up:
	$(COMPOSE) up -d --wait

docker-down:
	$(COMPOSE) down

db-create:
	$(call PSQL,-f /docker-entrypoint-initdb.d/seed.sql)

db-tables:
	$(call PSQL,-c "\dt")

db-users:
	$(call PSQL,-c "SELECT id, name, email, is_admin, created_at FROM users ORDER BY created_at;")

dev:
	APP_ENV=development go run ./cmd/
