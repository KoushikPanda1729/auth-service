# PostgreSQL Database Setup

## Starting PostgreSQL Container

```bash
docker run --rm --name auth-service-pgcontainer \
  -e POSTGRES_USER=root \
  -e POSTGRES_PASSWORD=root \
  -v auth-service-pgdata:/var/lib/postgresql \
  -p 5432:5432 \
  -d postgres
```

## Connection Details

- **Host**: `localhost` (from host machine) or `auth-service-pgcontainer` (from other Docker containers)
- **Port**: `5432`
- **User**: `root`
- **Password**: `root`
- **Database**: `postgres` (default)

## Connecting to PostgreSQL

### Option 1: Connect via Docker exec

```bash
docker exec -it auth-service-pgcontainer psql -U root
```

### Option 2: Connect from host machine (if psql installed)

```bash
psql -h localhost -p 5432 -U root
```

---

## Useful PostgreSQL Commands

### Database Management

```sql
-- List all databases
\l

-- Create a new database
CREATE DATABASE auth_service;

-- Connect to a database
\c auth_service

-- Drop a database
DROP DATABASE database_name;

-- Show current database
SELECT current_database();
```

### Table Management

```sql
-- List all tables in current database
\dt

-- Describe a table structure
\d table_name

-- Create a sample users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Show table with indexes
\d+ users

-- Drop a table
DROP TABLE table_name;
```

### Data Operations

```sql
-- Insert data
INSERT INTO users (name, email, password)
VALUES ('John Doe', 'john@example.com', 'hashed_password');

-- Select all data
SELECT * FROM users;

-- Select specific columns
SELECT id, name, email FROM users;

-- Update data
UPDATE users SET name = 'Jane Doe' WHERE id = 1;

-- Delete data
DELETE FROM users WHERE id = 1;

-- Count rows
SELECT COUNT(*) FROM users;

-- Filter with WHERE clause
SELECT * FROM users WHERE email = 'john@example.com';

-- Sort results
SELECT * FROM users ORDER BY created_at DESC;

-- Limit results
SELECT * FROM users LIMIT 10;
```

### User Management

```sql
-- List all users
\du

-- Create a new user
CREATE USER app_user WITH PASSWORD 'app_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE auth_service TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;

-- Revoke privileges
REVOKE ALL PRIVILEGES ON DATABASE auth_service FROM app_user;

-- Drop user
DROP USER app_user;
```

### Schema Management

```sql
-- Show all schemas
\dn

-- Create a new schema
CREATE SCHEMA app_schema;

-- Set search path
SET search_path TO app_schema, public;

-- Drop schema
DROP SCHEMA schema_name CASCADE;
```

### Utility Commands

```sql
-- Exit psql
\q

-- Get help
\?

-- Get help for SQL commands
\h CREATE TABLE

-- Show query execution time
\timing

-- List all extensions
\dx

-- Install extension (e.g., UUID)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## Quick Setup Script

Connect to PostgreSQL and run this to set up your auth service database:

```sql
-- Create database
CREATE DATABASE auth_service;

-- Connect to it
\c auth_service

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Verify table creation
\dt

-- Describe users table
\d users
```

---

## Sample Data Insertion

```sql
-- Insert sample users
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@example.com', 'hashed_password_1', 'admin'),
('John Doe', 'john@example.com', 'hashed_password_2', 'user'),
('Jane Smith', 'jane@example.com', 'hashed_password_3', 'user');

-- Verify insertion
SELECT * FROM users;
```

---

## Managing PostgreSQL Container

### Check Container Status

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a
```

### Container Operations

```bash
# Stop the container
docker stop auth-service-pgcontainer

# Start the container (if not using --rm)
docker start auth-service-pgcontainer

# Restart the container
docker restart auth-service-pgcontainer

# Remove container
docker rm -f auth-service-pgcontainer
```

### View Logs

```bash
# View logs
docker logs auth-service-pgcontainer

# View real-time logs
docker logs -f auth-service-pgcontainer

# View last 50 lines
docker logs --tail 50 auth-service-pgcontainer
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect auth-service-pgdata

# Remove volume (WARNING: deletes all data)
docker volume rm auth-service-pgdata
```

---

## Backup and Restore

### Backup Database

```bash
# Backup single database
docker exec auth-service-pgcontainer pg_dump -U root auth_service > backup.sql

# Backup all databases
docker exec auth-service-pgcontainer pg_dumpall -U root > backup_all.sql
```

### Restore Database

```bash
# Restore database
docker exec -i auth-service-pgcontainer psql -U root auth_service < backup.sql

# Restore all databases
docker exec -i auth-service-pgcontainer psql -U root < backup_all.sql
```

---

## Troubleshooting

### Connection Issues

```bash
# Test connection from host
telnet localhost 5432

# Check if port is in use
lsof -i :5432

# Check container logs for errors
docker logs auth-service-pgcontainer
```

### Performance Monitoring

```sql
-- Show active connections
SELECT * FROM pg_stat_activity;

-- Show database size
SELECT pg_size_pretty(pg_database_size('auth_service'));

-- Show table sizes
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Clear All Data

```sql
-- Delete all rows from a table (keeps structure)
TRUNCATE TABLE users CASCADE;

-- Reset auto-increment counter
ALTER SEQUENCE users_id_seq RESTART WITH 1;
```

---

## Environment Variables for Application

Add these to your `.env` file:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=root
DB_PASSWORD=root
DB_NAME=auth_service
```

For connecting from another Docker container in the same network:

```env
DB_HOST=auth-service-pgcontainer
DB_PORT=5432
DB_USER=root
DB_PASSWORD=root
DB_NAME=auth_service
```
