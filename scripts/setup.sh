#!/usr/bin/env bash
set -euo pipefail

echo "=============================================="
echo "  Free Press - Development Setup"
echo "=============================================="
echo ""

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Error: docker is required but not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Error: node is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "Error: npm is required but not installed."; exit 1; }

# Copy env file if needed
if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Start Docker services
echo "Starting Docker services..."
docker compose up -d

# Wait for Postgres to be ready
echo "Waiting for PostgreSQL..."
for i in {1..30}; do
  if docker compose exec -T postgres pg_isready -U freepress >/dev/null 2>&1; then
    echo "  PostgreSQL is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "  Error: PostgreSQL failed to start within 30 seconds"
    exit 1
  fi
  sleep 1
done

# Run migrations
echo "Running database migrations..."
npx prisma migrate dev --name init --skip-generate 2>/dev/null || npx prisma db push

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Seed database
echo "Seeding database..."
npx tsx prisma/seed.ts

# Initialize Meilisearch indexes
echo "Initializing search indexes..."
npx tsx scripts/init-search.ts 2>/dev/null || echo "  (search indexes will be created on first use)"

echo ""
echo "=============================================="
echo "  Setup complete!"
echo "=============================================="
echo ""
echo "  Start the dev server:  npm run dev"
echo "  View the app:          http://localhost:3000"
echo "  View emails:           http://localhost:8025 (Mailpit)"
echo "  View search:           http://localhost:7700 (Meilisearch)"
echo ""
echo "  Dev login tokens (set as cookie 'fp_session'):"
echo "    Admin:       admin-dev-token"
echo "    Journalist:  journalist1-dev-token"
echo "    Reader:      reader-dev-token"
echo ""
