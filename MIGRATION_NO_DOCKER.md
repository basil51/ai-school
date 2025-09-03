# Migration from Docker to Native Services

## Overview
This document outlines the migration from Docker-based PostgreSQL and Redis to native system services on your VPS.

## Current Docker Setup
- **PostgreSQL**: `pgvector/pgvector:pg15` on port 5433
- **Redis**: `redis:7-alpine` on port 6380
- **Database**: `ai_school`
- **User**: `postgres`
- **Password**: `postgres`

## Migration Steps

### 1. Install Native PostgreSQL with pgvector

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL 15
sudo apt install -y postgresql-15 postgresql-15-postgis-3

# Install pgvector extension dependencies
sudo apt install -y postgresql-15-pgvector

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Install Native Redis

```bash
# Install Redis
sudo apt install -y redis-server

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 3. Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE ai_school;
CREATE USER ai_school_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ai_school TO ai_school_user;

# Enable pgvector extension
\c ai_school
CREATE EXTENSION IF NOT EXISTS vector;

# Exit psql
\q
```

### 4. Configure Redis

```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# Ensure these settings:
# bind 127.0.0.1
# port 6379
# requirepass your_redis_password

# Restart Redis
sudo systemctl restart redis-server
```

### 5. Update Environment Variables

Create `.env` file in web directory:

```env
# Database (native PostgreSQL)
DATABASE_URL="postgresql://ai_school_user:your_secure_password@localhost:5432/ai_school?schema=public"

# Redis (native)
REDIS_URL="redis://:your_redis_password@localhost:6379"

# Other variables...
NEXTAUTH_SECRET="your_secret_here"
NEXTAUTH_URL="http://localhost:3000"
```

### 6. Test Connections

```bash
# Test PostgreSQL
psql -h localhost -U ai_school_user -d ai_school

# Test Redis
redis-cli -h localhost -p 6379 -a your_redis_password
```

### 7. Remove Docker Dependencies

```bash
# Stop Docker containers
docker compose down

# Remove Docker volumes (WARNING: This will delete data!)
docker volume rm ai-school_pgdata ai-school_redisdata

# Remove docker-compose.yml (optional)
rm docker-compose.yml
```

### 8. Update Application

```bash
# Navigate to web directory
cd web

# Install dependencies
pnpm install

# Run database migrations
pnpm prisma migrate deploy

# Seed database if needed
pnpm prisma db seed
```

## Port Changes

| Service | Docker Port | Native Port |
|---------|-------------|-------------|
| PostgreSQL | 5433 | 5432 |
| Redis | 6380 | 6379 |

## Security Considerations

1. **Change default passwords** for both PostgreSQL and Redis
2. **Use strong passwords** (at least 16 characters)
3. **Configure firewall** to only allow local connections
4. **Regular security updates** for both services
5. **Backup strategy** for native services

## Backup and Recovery

### PostgreSQL Backup
```bash
# Create backup
pg_dump -h localhost -U ai_school_user ai_school > backup_$(date +%Y%m%d).sql

# Restore backup
psql -h localhost -U ai_school_user ai_school < backup_file.sql
```

### Redis Backup
```bash
# Redis automatically creates snapshots
# Manual backup
redis-cli -h localhost -p 6379 -a your_password SAVE
```

## Troubleshooting

### PostgreSQL Issues
- Check service status: `sudo systemctl status postgresql`
- Check logs: `sudo journalctl -u postgresql`
- Verify pgvector: `sudo -u postgres psql -c "CREATE EXTENSION vector;"`

### Redis Issues
- Check service status: `sudo systemctl status redis-server`
- Check logs: `sudo journalctl -u redis-server`
- Test connection: `redis-cli ping`

## Rollback Plan

If migration fails:
1. Restore Docker containers: `docker compose up -d`
2. Restore environment variables to Docker ports
3. Switch back to master branch: `git checkout master`
4. Or use the rollback script: `./rollback_to_docker.sh`

## Post-Migration Verification

1. ✅ Application builds successfully
2. ✅ Database connections work
3. ✅ Redis connections work
4. ✅ All API endpoints function
5. ✅ Background jobs process correctly
6. ✅ Performance is maintained or improved
