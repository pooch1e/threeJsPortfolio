#!/bin/bash
set -euo pipefail

psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE threejs_test"

for db in threejs_database threejs_test; do
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$db" -f /db/schema.sql
done

psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d threejs_database -f /db/seed.sql
