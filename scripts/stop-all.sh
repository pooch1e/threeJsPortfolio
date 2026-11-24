#!/bin/bash
echo "Shutting down dev servers..."
pkill -f "wrangler dev"
pkill -f "vite"
echo "Done."
