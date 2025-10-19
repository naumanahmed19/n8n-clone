# Persistent Storage and Database Configuration Guide

This guide covers the persistent storage and database configuration setup for the n8n-clone application deployed with Coolify.

## Overview

The persistent storage configuration includes:
- PostgreSQL persistent volume mounting
- Redis data persistence (optional)
- Database initialization and migration scripts
- Automated backup strategy for PostgreSQL

## Configuration Files

### Core Configuration Files

1. **`.coolify/postgres-volume-config.json`** - PostgreSQL volume configuration
2. **`.coolify/redis-persistence-config.json`** - Redis persistence settings
3. **`.coolify/database-migration-config.json`** - Migration and initialization configuration
4. **`.coolify/postgres-backup-strategy.json`** - Backup strategy and scheduling
5. **`coolify.yaml`** - Updated with persistent storage configurations

### Database Scripts

1. **`backend/prisma/init.sql`** - Database initialization script
2. **`scripts/backup-database.sh`** - PostgreSQL backup script
3. **`scripts/check-database-health.sh`** - Database health check script
4. **`scripts/seed-database.sh`** - Database seeding script
5. **`scripts/verify-migration.sh`** - Migration verification script
6. **`scripts/postgres-full-backup.sh`** - Comprehensive backup script
7. **`scripts/postgres-restore.sh`** - Database restore script
8. **`.coolify/redis-backup.sh`** - Redis backup script

## Persistent Volumes

### PostgreSQL Volume Configuration

```yaml
postgres_data:
  driver: local
  name: n8n-clone-postgres-data
  driver_opts:
    type: none
    o: bind
    device: /var/lib/coolify/volumes/n8n-clone-postgres-data
```

**Mount Points:**
- Data: `/var/lib/postgresql/data`
- Backups: `/backups`
- Init Scripts: `/docker-entrypoint-initdb.d`
- Management Scripts: `/app/scripts`

### Redis Volume Configuration

```yaml
redis_data:
  driver: local
  name: n8n-clone-redis-data
  driver_opts:
    type: none
    o: bind
    device: /var/lib/coolify/volumes/n8n-clone-redis-data
```

**Mount Points:**
- Data: `/data`
- Backups: `/backups`
- Configuration: `/usr/local/etc/redis/redis.conf`

## Database Initialization

### Initialization Process

1. **Container Startup**: PostgreSQL container starts with init.sql
2. **Extension Creation**: UUID, pg_stat_statements, pg_trgm extensions
3. **Performance Tuning**: Optimized PostgreSQL configuration
4. **Health Check Function**: Custom database health monitoring
5. **Migration Deployment**: Prisma migrations applied
6. **Database Seeding**: Initial data and node types

### Init Script Features

- **Extensions**: Automatic installation of required PostgreSQL extensions
- **Performance Tuning**: Production-optimized settings
- **Monitoring Setup**: Query statistics and logging configuration
- **Health Checks**: Built-in database health monitoring function

## Migration Management

### Migration Scripts

1. **Pre-Migration**: 
   - `backup-database.sh` - Create backup before migration
   - `check-database-health.sh` - Verify database health

2. **Migration**:
   - `npx prisma migrate deploy` - Apply migrations
   - `npx prisma generate` - Generate Prisma client

3. **Post-Migration**:
   - `seed-database.sh` - Seed initial data (optional)
   - `verify-migration.sh` - Verify migration success

### Migration Verification

The verification process checks:
- Prisma migration status
- Expected tables existence
- Table constraints and indexes
- Prisma client generation
- Application connectivity
- Data integrity

## Backup Strategy

### Backup Types

1. **Full Backup** (Daily at 2:00 AM)
   - Custom format (.dump)
   - SQL format (.sql.gz)
   - Schema-only backup
   - Critical data backup

2. **Incremental Backup** (Every 6 hours)
   - WAL-based incremental backups
   - Point-in-time recovery support

3. **Pre-Migration Backup**
   - Automatic backup before migrations
   - 30-day retention

4. **Manual Backup**
   - On-demand backup capability
   - 14-day retention

### Backup Locations

- **Local**: `/backups/postgres` and `/backups/redis`
- **Remote**: S3-compatible storage (configurable)

### Backup Retention Policy

- Daily backups: 7 days
- Weekly backups: 4 weeks
- Monthly backups: 3 months
- Yearly backups: 1 year

## Redis Persistence

### Persistence Configuration

```redis
appendonly yes
appendfsync everysec
save 900 1
save 300 10
save 60 10000
```

### Memory Management

- Max memory: 256MB
- Eviction policy: allkeys-lru
- Memory samples: 5

### Backup Schedule

- Daily backup at 3:00 AM
- 7-day retention
- Both RDB and AOF backups

## Deployment Process

### Using the Deployment Script

```bash
# Full deployment with persistent storage
./scripts/deploy-with-persistence.sh

# Setup volumes only
./scripts/deploy-with-persistence.sh volumes

# Run migrations only
./scripts/deploy-with-persistence.sh migrate

# Verify deployment
./scripts/deploy-with-persistence.sh verify
```

### Manual Deployment Steps

1. **Setup Volumes**:
   ```bash
   docker volume create n8n-clone-postgres-data
   docker volume create n8n-clone-redis-data
   docker volume create n8n-clone-postgres-backups
   docker volume create n8n-clone-redis-backups
   ```

2. **Start Database Services**:
   ```bash
   docker-compose -f coolify.yaml up -d postgres redis
   ```

3. **Run Migrations**:
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

4. **Seed Database**:
   ```bash
   npm run db:seed
   npm run nodes:register
   ```

5. **Start Application**:
   ```bash
   docker-compose -f coolify.yaml up -d backend frontend
   ```

## Management Commands

### Database Operations

```bash
# Create backup
./scripts/backup-database.sh

# Check database health
./scripts/check-database-health.sh

# Verify migrations
./scripts/verify-migration.sh

# Seed database
./scripts/seed-database.sh
```

### Backup Operations

```bash
# Full PostgreSQL backup
./scripts/postgres-full-backup.sh

# List available backups
./scripts/postgres-restore.sh list

# Restore from backup
./scripts/postgres-restore.sh restore /backups/postgres/backup_file.dump

# Redis backup
./.coolify/redis-backup.sh
```

### Health Monitoring

```bash
# Database connectivity
./scripts/check-database-health.sh connectivity

# Migration status
./scripts/verify-migration.sh status

# Application connectivity
./scripts/verify-migration.sh connectivity
```

## Monitoring and Alerts

### Health Checks

- **PostgreSQL**: `pg_isready` every 30 seconds
- **Redis**: `redis-cli ping` every 30 seconds
- **Application**: HTTP health endpoints

### Backup Monitoring

- Success/failure notifications
- Backup size monitoring
- Duration threshold alerts
- Webhook notifications (configurable)

### Performance Monitoring

- Query performance statistics
- Connection pool monitoring
- Memory usage tracking
- Disk space monitoring

## Troubleshooting

### Common Issues

1. **Volume Permission Issues**:
   ```bash
   sudo chown -R 999:999 /var/lib/coolify/volumes/n8n-clone-postgres-data
   sudo chown -R 999:999 /var/lib/coolify/volumes/n8n-clone-redis-data
   ```

2. **Migration Failures**:
   ```bash
   # Check migration status
   npx prisma migrate status
   
   # Reset migrations (development only)
   npx prisma migrate reset
   ```

3. **Backup Failures**:
   ```bash
   # Check disk space
   df -h /backups
   
   # Verify database connectivity
   ./scripts/check-database-health.sh connectivity
   ```

4. **Connection Issues**:
   ```bash
   # Check service status
   docker-compose -f coolify.yaml ps
   
   # Check logs
   docker-compose -f coolify.yaml logs postgres
   ```

### Recovery Procedures

1. **Database Recovery**:
   ```bash
   # List available backups
   ./scripts/postgres-restore.sh list
   
   # Restore to test database
   ./scripts/postgres-restore.sh restore backup_file.dump n8n_clone_test
   
   # Promote restored database
   ./scripts/postgres-restore.sh promote n8n_clone_test
   ```

2. **Redis Recovery**:
   ```bash
   # Stop Redis service
   docker-compose -f coolify.yaml stop redis
   
   # Restore data files
   cp /backups/redis/dump.rdb /var/lib/coolify/volumes/n8n-clone-redis-data/
   
   # Start Redis service
   docker-compose -f coolify.yaml start redis
   ```

## Security Considerations

### Database Security

- Internal network isolation
- Encrypted connections (configurable)
- User permission restrictions
- Regular security updates

### Backup Security

- Encrypted backup storage
- Access control for backup files
- Secure credential management
- Audit logging

### Volume Security

- Proper file permissions
- Volume encryption (optional)
- Access logging
- Regular security scans

## Performance Optimization

### PostgreSQL Tuning

- Shared buffers: 256MB
- Effective cache size: 1GB
- Work memory: 4MB
- Connection pooling: 20 max connections

### Redis Optimization

- Memory limit: 256MB
- LRU eviction policy
- AOF persistence with everysec fsync
- Connection timeout: 5 seconds

### Volume Performance

- Local SSD storage recommended
- Regular disk space monitoring
- I/O performance monitoring
- Backup compression enabled

## Coolify Integration

### Service Labels

```yaml
labels:
  - "coolify.managed=true"
  - "coolify.type=database"
  - "coolify.name=n8n-clone-postgres"
  - "coolify.schedule=0 2 * * *"  # For backup services
```

### Environment Variables

Required variables for Coolify deployment:
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `SESSION_SECRET`
- `CORS_ORIGIN`
- `VITE_API_URL`

Optional variables:
- `BACKUP_S3_BUCKET`
- `BACKUP_WEBHOOK_URL`
- `LOG_LEVEL`

### Backup Scheduling

Coolify manages backup scheduling through:
- Cron-like schedule expressions
- Service profiles for backup services
- Automatic restart policies
- Resource limits and monitoring

This configuration provides a robust, production-ready persistent storage solution with comprehensive backup and recovery capabilities.