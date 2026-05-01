#!/bin/bash

# Function to check if the server is responding
wait_for_server() {
    echo "Waiting for backend to be ready on port 8080..."
    MAX_RETRIES=30
    COUNT=0
    while ! curl -s http://localhost:8080/health > /dev/null; do
        sleep 1
        COUNT=$((COUNT+1))
        if [ $COUNT -ge $MAX_RETRIES ]; then
            echo "Backend failed to start in time."
            exit 1
        fi
    done
    echo "Backend is up!"
}

# 1. Start Docker
echo "Starting Docker containers..."
cd server && make docker-up
if [ $? -ne 0 ]; then echo "Failed to start Docker"; exit 1; fi

# 2. Run Backend in background
echo "Starting Go backend..."
make dev &
BACKEND_PID=$!
cd ..

# 3. Wait for backend to be ready
wait_for_server 

# 4. Start Frontend
echo "Starting Frontend..."
npm run dev

# Cleanup when frontend is stopped
kill $BACKEND_PID
cd server && make docker-down
