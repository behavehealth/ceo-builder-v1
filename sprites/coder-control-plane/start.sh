#!/bin/bash
# Coder Control Plane Startup Script
# Run this on the sprite to start Coder with proper configuration

set -e

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo "Loaded environment from .env"
else
    echo "ERROR: .env file not found!"
    echo "Copy .env.example to .env and fill in your credentials"
    exit 1
fi

# Verify required variables
if [[ "$CODER_PG_CONNECTION_URL" == *"YOUR_"* ]]; then
    echo "ERROR: Please update CODER_PG_CONNECTION_URL in .env with your actual credentials"
    exit 1
fi

# Start Docker daemon if not running
if ! docker info &>/dev/null; then
    echo "Starting Docker daemon..."
    sudo dockerd &>/dev/null &
    sleep 3
fi

echo "Starting Coder server..."
echo "Access URL: $CODER_ACCESS_URL"
echo ""

# Start Coder
coder server
