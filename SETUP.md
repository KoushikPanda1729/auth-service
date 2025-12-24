# Auth Service - Setup & Run Guide

Complete guide for running the auth-service in development, testing, and production environments.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Database Setup](#database-setup)
- [Development](#development)
- [Testing](#testing)
- [Production](#production)
- [Docker Commands Reference](#docker-commands-reference)

---

## Quick Start

### 1. Install Dependencies

```bash
# Use correct Node version
nvm use

# Install packages
npm install
```

### 2. Setup Environment Files

```bash
cp .env.example .env.dev
cp .env.example .env.prod
cp .env.example .env.test
```

Edit the `.env.*` files with your configuration.

---

## Database Setup

### Start PostgreSQL Container

```bash
# Pull PostgreSQL image (first time only)
docker pull postgres

# Create and start PostgreSQL container with persistent volume
docker run --rm --name auth-service-pgcontainer \
  -e POSTGRES_USER=root \
  -e POSTGRES_PASSWORD=root \
  -v auth-service-pgdata:/var/lib/postgresql/data \
  -p 5432:5432 \
  -d postgres
```

```bash
# Run Container
docker run --rm --name auth-service-pgcontainer -e POSTGRES_USER=root -e POSTGRES_PASSWORD=root -v auth-service-pgdata:/var/lib/postgresql  -p 5432:5432 -d postgres
```

### Database Migrations

```bash
# Run migrations
npm run migration:run

# Generate migration
npm run migration:generate -- src/migration/MigrationName

# Create migration
npm run migration:create -- ./src/migration/MigrationName

# Revert last migration
npm run migration:revert
```

---

## Development

### Option 1: Run Locally (Recommended)

```bash
# Start development server with hot-reload
npm run dev
```

Server runs on `http://localhost:5501`

### Option 2: Run in Docker Container

```bash
# Build development Docker image
docker build -t auth-service:dev -f docker/dev/Dockerfile .

# Run development container
docker run --rm -it \
  -v "$(pwd):/usr/src/app" \
  -v /usr/src/app/node_modules \
  --env-file .env.dev \
  -p 5501:5501 \
  -e NODE_ENV=dev \
  --link auth-service-pgcontainer:postgres \
  auth-service:dev
```

---

## Testing

### Run Tests Locally

```bash
# Run tests in watch mode
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### Run Tests in Docker

```bash
# Build dev image (if not already built)
docker build -t auth-service:dev -f docker/dev/Dockerfile .

# Run tests in Docker container
docker run --rm -t \
  -v "$(pwd):/usr/src/app" \
  -v /usr/src/app/node_modules \
  --env-file .env.test \
  -e DB_HOST=host.docker.internal \
  auth-service:dev \
  npm test
```

---

## Production

### Build for Production

```bash
# Build the application (creates dist/ folder)
npm run build
```

### Run Locally

```bash
# Run the built application
npm start
```

### Docker Production Deployment

#### Step 1: Build Production Image

```bash
docker build -t auth-service:prod -f docker/prod/Dockerfile .
```

#### Step 2: Run Production Container

```bash
docker run -it --rm \
  -p 5501:5501 \
  --name auth-service \
  --env-file .env.prod \
  -e DB_HOST=auth-service-pgcontainer \
  --link auth-service-pgcontainer:postgres \
  auth-service:prod
```

#### Run in Detached Mode (Background)

```bash
docker run -d \
  -p 5501:5501 \
  --name auth-service \
  --env-file .env.prod \
  -e DB_HOST=auth-service-pgcontainer \
  --link auth-service-pgcontainer:postgres \
  --restart unless-stopped \
  auth-service:prod
```

---

## Docker Commands Reference

### Development Workflow

```bash
# 1. Start PostgreSQL
docker run --rm --name auth-service-pgcontainer \
  -e POSTGRES_USER=root \
  -e POSTGRES_PASSWORD=root \
  -v auth-service-pgdata:/var/lib/postgresql/data \
  -p 5432:5432 \
  -d postgres

# 2. Build dev image
docker build -t auth-service:dev -f docker/dev/Dockerfile .

# 3. Run dev container
docker run --rm -it \
  -v "$(pwd):/usr/src/app" \
  -v /usr/src/app/node_modules \
  --env-file .env.dev \
  -p 5501:5501 \
  -e NODE_ENV=dev \
  --link auth-service-pgcontainer:postgres \
  auth-service:dev

# 4. Run tests in Docker
docker run --rm -t \
  -v "$(pwd):/usr/src/app" \
  -v /usr/src/app/node_modules \
  --env-file .env.test \
  -e DB_HOST=host.docker.internal \
  auth-service:dev \
  npm test
```

### Production Workflow

```bash
# 1. Start PostgreSQL (if not already running)
docker run --rm --name auth-service-pgcontainer \
  -e POSTGRES_USER=root \
  -e POSTGRES_PASSWORD=root \
  -v auth-service-pgdata:/var/lib/postgresql/data \
  -p 5432:5432 \
  -d postgres

# 2. Build production image
docker build -t auth-service:prod -f docker/prod/Dockerfile .

# 3. Run production container
docker run -it --rm \
  -p 5501:5501 \
  --name auth-service \
  --env-file .env.prod \
  -e DB_HOST=auth-service-pgcontainer \
  --link auth-service-pgcontainer:postgres \
  auth-service:prod
```

### Useful Docker Commands

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# Stop a container
docker stop auth-service

# Remove a container
docker rm auth-service

# View logs
docker logs auth-service

# Follow logs in real-time
docker logs -f auth-service

# List Docker images
docker images

# Remove an image
docker rmi auth-service:dev

# List Docker volumes
docker volume ls

# Inspect a volume
docker volume inspect auth-service-pgdata

# Remove a volume (WARNING: deletes all data)
docker volume rm auth-service-pgdata
```

### Database Container Commands

```bash
# Connect to PostgreSQL CLI
docker exec -it auth-service-pgcontainer psql -U root

# Create database
docker exec -it auth-service-pgcontainer createdb -U root auth_service_db

# List databases
docker exec -it auth-service-pgcontainer psql -U root -c "\l"

# Backup database
docker exec -it auth-service-pgcontainer pg_dump -U root auth_service_db > backup.sql

# Restore database
docker exec -i auth-service-pgcontainer psql -U root auth_service_db < backup.sql
```

---

## Environment Variables

Required environment variables for each environment:

```bash
# Server
PORT=5501
NODE_ENV=dev  # dev | prod | test

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=root
DB_PASSWORD=root
DB_NAME=auth_service_db

# Frontend (CORS)
FRONTEND_URL=http://localhost:3000

# JWT
JWKS_URI=http://localhost:5501/.well-known/jwks.json
REFRESH_TOKEN_SECRET=your-secret-here

# RSA Keys (for JWT signing)
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

### Generate RSA Keys

```bash
# Create certs directory
mkdir -p certs

# Generate private key
openssl genrsa -out certs/private.pem 2048

# Extract public key
openssl rsa -in certs/private.pem -outform PEM -pubout -out certs/public.pem

# Convert to single-line format for .env files
cat certs/private.pem | tr '\n' '\\n'
cat certs/public.pem | tr '\n' '\\n'
```

Copy the output and paste into your `.env.*` files.

---

## Code Quality Commands

```bash
# Format code with Prettier
npm run format:fix

# Check formatting
npm run format:check

# Lint and auto-fix issues
npm run lint:fix

# Check linting without fixing
npm run lint:check
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 5501
lsof -ti:5501

# Kill the process
lsof -ti:5501 | xargs kill -9
```

### Database Connection Issues

```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# Restart PostgreSQL container
docker restart auth-service-pgcontainer

# Check PostgreSQL logs
docker logs auth-service-pgcontainer
```

### Docker Build Issues

```bash
# Clear Docker cache and rebuild
docker build --no-cache -t auth-service:dev -f docker/dev/Dockerfile .

# Prune unused Docker resources
docker system prune -a
```

---

## Project Scripts

| Script                       | Description                              |
| ---------------------------- | ---------------------------------------- |
| `npm run dev`                | Start development server with hot-reload |
| `npm run build`              | Build for production (creates dist/)     |
| `npm start`                  | Run production build locally             |
| `npm test`                   | Run tests in watch mode                  |
| `npm run test:coverage`      | Run tests with coverage report           |
| `npm run test:ci`            | Run tests in CI mode                     |
| `npm run format:fix`         | Format code with Prettier                |
| `npm run format:check`       | Check code formatting                    |
| `npm run lint:fix`           | Lint and fix issues                      |
| `npm run lint:check`         | Check linting without fixing             |
| `npm run migration:run`      | Run pending database migrations          |
| `npm run migration:generate` | Generate migration from entities         |
| `npm run migration:revert`   | Revert last migration                    |
| `npm run migration:create`   | Create empty migration file              |

---

## Quick Reference

### Start Everything from Scratch

```bash
# 1. Start database
docker run --rm --name auth-service-pgcontainer \
  -e POSTGRES_USER=root -e POSTGRES_PASSWORD=root \
  -v auth-service-pgdata:/var/lib/postgresql/data \
  -p 5432:5432 -d postgres

# 2. Run migrations
npm run migration:run

# 3. Start development server
npm run dev
```

### Production Deployment

```bash
# Build and run in Docker
docker build -t auth-service:prod -f docker/prod/Dockerfile .

docker run -d -p 5501:5501 --name auth-service \
  --env-file .env.prod \
  -e DB_HOST=auth-service-pgcontainer \
  --link auth-service-pgcontainer:postgres \
  --restart unless-stopped \
  auth-service:prod
```

---

## Support

For issues and questions, please create an issue in the repository.
