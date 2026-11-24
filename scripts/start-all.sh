#!/bin/bash
# Starts the Cloudflare Worker API (wrangler dev, port 8787) and the Vite frontend (port 5173).
# Ctrl+C stops both.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_PORT=8787

cleanup() {
    kill "$API_PID" 2>/dev/null
    pkill -f "wrangler dev" 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "Starting Worker API..."
(cd "$ROOT/worker" && npm run dev) &
API_PID=$!

echo "Waiting for API on port ${API_PORT}..."
COUNT=0
while ! curl -s "http://localhost:${API_PORT}/health" > /dev/null; do
    sleep 1
    COUNT=$((COUNT+1))
    if [ $COUNT -ge 30 ]; then echo "API failed to start in time."; exit 1; fi
done
echo "API is up!"

cd "$ROOT" && npm run dev
