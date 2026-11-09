#!/bin/bash
# Starts the dev stack for the Cloudflare Worker backend: Postgres (docker), wrangler dev,
# then Vite once the worker answers /health. Ctrl+C stops the worker and Vite; the
# database container is left running (use `npm --prefix worker run db:down` to stop it).

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_URL="${API_URL:-http://localhost:8787}"
MAX_RETRIES=30

trap 'trap - SIGTERM && kill 0' SIGINT SIGTERM EXIT

echo "Starting Postgres..."
npm --prefix "$ROOT/worker" run db:up || { echo "Failed to start Postgres"; exit 1; }

echo "Starting worker..."
npm --prefix "$ROOT/worker" run dev &

echo "Waiting for the worker at ${API_URL}/health..."
count=0
until curl -fsS -m 2 "${API_URL}/health" > /dev/null 2>&1; do
  sleep 1
  count=$((count + 1))
  if [ "$count" -ge "$MAX_RETRIES" ]; then
    echo "Worker did not become healthy in ${MAX_RETRIES}s."
    exit 1
  fi
done
echo "Worker is up."

npm --prefix "$ROOT" run dev
