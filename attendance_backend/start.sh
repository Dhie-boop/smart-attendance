#!/bin/sh
set -e

# Always run from the backend directory, regardless of where this script is called from
SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR"

if [ -z "${DATABASE_URL:-}" ]; then
	echo "DATABASE_URL is not set. In Render, set DATABASE_URL to the Postgres Internal Database URL."
	exit 1
fi

case "$DATABASE_URL" in
	*localhost*|*127.0.0.1*)
		echo "DATABASE_URL is pointing to localhost. In Render, use the Postgres Internal Database URL instead."
		exit 1
		;;
esac

echo "Running Alembic migrations..."
python -m alembic upgrade head

echo "Starting server..."
exec python -m uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
