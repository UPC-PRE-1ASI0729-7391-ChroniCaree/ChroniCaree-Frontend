#!/bin/bash
# Use relative paths so the script works when executed from the `server` directory
# or from the repository root (Render may run from the service root).
set -e

# If PORT not set, default to 3000
PORT=${PORT:-3000}

# Choose correct db and routes paths depending on current working directory
if [ -f "db.json" ] && [ -f "routes.json" ]; then
	DB_PATH="db.json"
	ROUTES_PATH="routes.json"
elif [ -f "server/db.json" ] && [ -f "server/routes.json" ]; then
	DB_PATH="server/db.json"
	ROUTES_PATH="server/routes.json"
else
	echo "❌ db.json or routes.json not found in expected locations"
	exit 1
fi

echo "🚀 Starting json-server with DB=${DB_PATH} ROUTES=${ROUTES_PATH} PORT=${PORT} HOST=0.0.0.0"
# Bind to 0.0.0.0 so platform like Render can detect the open port
npx json-server --watch "$DB_PATH" --routes "$ROUTES_PATH" --port "$PORT" --host 0.0.0.0