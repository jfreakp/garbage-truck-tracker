#!/bin/sh
set -e

echo "Running database migrations..."
pnpm db:migrate

echo "Starting Next.js server..."
exec node server.js
