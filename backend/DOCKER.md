# Docker Setup Guide

This guide explains how to run the n8n-clone backend with Docker for development.

## Prerequisites

- Docker installed and running
- Docker Compose (usually included with Docker Desktop)
- Node.js 18+ for running the backend application

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. **Start all services:**
   ```bash
   npm run compose:setup
   ```
   This will:
   - Start PostgreSQL and Redis containers
   - Wait for services to be ready
   - Run database migrations
   - Seed the database with initial data

2. **Start the backend:**
   ```bash
   npm run dev
   ```

3. **Stop services when done:**
   ```bash
   npm run compose:down
   ```

### Option 2: Using Individual Docker Commands

1. **Start database and Redis:**
   ```bash
   npm run docker:setup
   ```

2. **Start the backend:**
   ```bash
   npm run dev
   ```

3. **Stop services when done:**
   ```bash
   npm run docker:services:stop
   ```

## Available Scripts

### Docker Compose Scripts
- `npm run compose:up` - Start PostgreSQL and Redis containers
- `npm run compose:down` - Stop and remove containers
- `npm run compose:logs` - View container logs
- `npm run compose:setup` - Start containers, wait for readiness, migrate and seed DB
- `npm run compose:dev` - Full setup + start development server

### Individual Docker Scripts
- `npm run docker:db` - Start PostgreSQL container
- `npm run docker:redis` - Start Redis container
- `npm run docker:services` - Start both PostgreSQL and Redis
- `npm run docker:setup` - Start services + migrate and seed DB
- `npm run docker:dev` - Full setup + start development server

### Stop Scripts
- `npm run docker:db:stop` - Stop and remove PostgreSQL container
- `npm run docker:redis:stop` - Stop and remove Redis container
- `npm run docker:services:stop` - Stop both services

## Container Details

### PostgreSQL
- **Image:** postgres:15
- **Container Name:** n8n-postgres
- **Port:** 5432
- **Database:** n8n_clone_dev
- **Username:** postgres
- **Password:** postgres

### Redis
- **Image:** redis:7-alpine
- **Container Name:** n8n-redis
- **Port:** 6379

### Test Database
- **Container Name:** n8n-postgres-test
- **Port:** 5433
- **Database:** n8n_clone_test
- **Started with:** `docker-compose --profile test up`

## Data Persistence

Docker volumes are used to persist data:
- `postgres_data` - PostgreSQL data
- `redis_data` - Redis data
- `postgres_test_data` - Test database data

## Docker Build Arguments

The Docker build process now supports several build arguments that can be used to customize the build:

### BASE_IMAGE
Specify an alternative base image for Node.js. This is useful when Docker Hub is unavailable or when you want to use a mirror.
```bash
BASE_IMAGE=registry.cn-hangzhou.aliyuncs.com/aliyun-node/node:22-alpine
```

### SOURCE_COMMIT
Specify the source commit for build tracking.
```bash
SOURCE_COMMIT=v1.0.0
```

### CORS_ORIGIN
Specify the CORS origin for the backend.
```bash
CORS_ORIGIN=https://yourdomain.com
```

### VITE_API_URL
Specify the API URL for the frontend.
```bash
VITE_API_URL=https://api.yourdomain.com
```

### Using Build Arguments

To use these build arguments, set them in your environment or pass them directly to docker-compose:

```bash
# Set environment variables
export BASE_IMAGE=registry.cn-hangzhou.aliyuncs.com/aliyun-node/node:22-alpine
docker-compose up --build

# Or pass directly
docker-compose build --build-arg BASE_IMAGE=registry.cn-hangzhou.aliyuncs.com/aliyun-node/node:22-alpine
docker-compose up
```

## Troubleshooting

### Port Conflicts
If you get port conflicts, check what's running on the ports:
```bash
# Check port 5432 (PostgreSQL)
netstat -an | findstr 5432

# Check port 6379 (Redis)
netstat -an | findstr 6379
```

### Container Issues
```bash
# Check container status
docker ps -a

# View container logs
docker logs n8n-postgres
docker logs n8n-redis

# Restart containers
docker restart n8n-postgres n8n-redis
```

### Database Issues
```bash
# Reset database (removes all data)
npm run compose:down
docker volume rm backend_postgres_data
npm run compose:setup
```

### Docker Hub Availability Issues

If you encounter Docker Hub availability issues (like the 503 Service Unavailable error), you can use alternative registries:

```bash
# Use Alibaba Cloud mirror for Node.js images
export BASE_IMAGE=registry.cn-hangzhou.aliyuncs.com/aliyun-node/node:22-alpine
docker-compose up --build

# Or use Docker China mirror
export BASE_IMAGE=registry.docker-cn.com/library/node:22-alpine
docker-compose up --build
```

### Clean Slate
To completely reset everything:
```bash
npm run compose:down
docker volume prune
docker system prune
npm run compose:setup
```

## Environment Variables

The containers use the same environment variables as defined in `.env`:
- `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/n8n_clone_dev"`
- `REDIS_URL="redis://localhost:6379"`

## Production Considerations

For production deployment:
1. Use proper secrets management
2. Configure resource limits
3. Set up monitoring and logging
4. Use production-ready PostgreSQL configuration
5. Consider using managed database services
6. Implement backup strategies