#!/bin/sh
set -e

# Always run from the backend directory, regardless of where this script is called from
SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR"

echo "Running Alembic migrations..."
alembic upgrade head

echo "Starting server..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
