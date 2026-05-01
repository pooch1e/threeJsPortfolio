#!/bin/bash

echo "Shutting down everything..."

# Kill any running vite or go processes if they were left hanging
pkill -f "vite"
pkill -f "go run cmd/*.go"

# Shutdown docker
cd server && make docker-down
cd ..

echo "Done."
