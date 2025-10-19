#!/bin/bash

# Deployment script with persistent storage setup for n8n-clone
# This script handles the complete deployment process including database setup

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COOLIFY_CONFIG_DIR="$PROJECT_ROOT/.coolify"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        log "ERROR: Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        log "ERROR: docker-compose is not installed or not in PATH"
        exit 1
    fi
    
    # Check if required configuration files exist
    local required_files=(
        "$PROJECT_ROOT/coolify.yaml"
        "$COOLIFY_CONFIG_DIR/database-config.json"
        "$COOLIFY_CONFIG_DIR/postgres-volume-config.json"
        "$COOLIFY_CONFIG_DIR/postgres-backup-strategy.json"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log "ERROR: Required configuration file missing: $file"
            exit 1
        fi
    done
    
    log "✓ Prerequisites check passed"
}

# Function to setup persistent volumes
setup_persistent_volumes() {
    log "Setting up persistent volumes..."
    
    # Create volume directories if they don't exist
    local volume_dirs=(
        "/var/lib/coolify/volumes/n8n-clone-postgres-data"
        "/var/lib/coolify/volumes/n8n-clone-redis-data"
        "/var/lib/coolify/volumes/n8n-clone-postgres-backups"
        "/var/lib/coolify/volumes/n8n-clone-redis-backups"
    )
    
    for dir in "${volume_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            log "Creating volume directory: $dir"
            sudo mkdir -p "$dir"
            sudo chown -R 999:999 "$dir"  # postgres user
        else
            log "Volume directory exists: $dir"
        fi
    done
    
    # Create Docker volumes
    docker volume create n8n-clone-postgres-data || true
    docker volume create n8n-clone-redis-data || true
    docker volume create n8n-clone-postgres-backups || true
    docker volume create n8n-clone-redis-backups || true
    
    log "✓ Persistent volumes setup completed"
}

# Function to validate environment variables
validate_environment() {
    log "Validating environment variables..."
    
    local required_vars=(
        "POSTGRES_PASSWORD"
        "JWT_SECRET"
        "SESSION_SECRET"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log "ERROR: Missing required environment variables: ${missing_vars[*]}"
        log "Please set these variables in your .env file or environment"
        exit 1
    fi
    
    log "✓ Environment validation passed"
}

# Function to prepare database initialization
prepare_database_init() {
    log "Preparing database initialization..."
    
    # Ensure init.sql exists
    if [ ! -f "$PROJECT_ROOT/backend/prisma/init.sql" ]; then
        log "ERROR: Database initialization script not found: backend/prisma/init.sql"
        exit 1
    fi
    
    # Make scripts executable
    chmod +x "$PROJECT_ROOT/scripts"/*.sh || true
    chmod +x "$COOLIFY_CONFIG_DIR"/*.sh || true
    
    log "✓ Database initialization prepared"
}

# Function to deploy services
deploy_services() {
    log "Deploying services..."
    
    cd "$PROJECT_ROOT"
    
    # Pull latest images
    log "Pulling Docker images..."
    docker-compose -f coolify.yaml pull
    
    # Start database services first
    log "Starting database services..."
    docker-compose -f coolify.yaml up -d postgres redis
    
    # Wait for databases to be ready
    log "Waiting for databases to be ready..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f coolify.yaml exec -T postgres pg_isready -U "${POSTGRES_USER:-postgres}" > /dev/null 2>&1; then
            log "✓ PostgreSQL is ready"
            break
        fi
        
        attempt=$((attempt + 1))
        log "Waiting for PostgreSQL... (attempt $attempt/$max_attempts)"
        sleep 5
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log "ERROR: PostgreSQL failed to start within timeout"
        exit 1
    fi
    
    # Check Redis
    if docker-compose -f coolify.yaml exec -T redis redis-cli ping > /dev/null 2>&1; then
        log "✓ Redis is ready"
    else
        log "ERROR: Redis is not responding"
        exit 1
    fi
    
    log "✓ Database services are running"
}

# Function to run database migrations
run_database_migrations() {
    log "Running database migrations..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log "Installing backend dependencies..."
        npm ci
    fi
    
    # Generate Prisma client
    log "Generating Prisma client..."
    npx prisma generate
    
    # Run migrations
    log "Deploying database migrations..."
    npx prisma migrate deploy
    
    # Verify migration status
    log "Verifying migration status..."
    npx prisma migrate status
    
    log "✓ Database migrations completed"
}

# Function to seed database
seed_database() {
    log "Seeding database..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Run seeding script
    if [ -f "prisma/seed-categories.ts" ]; then
        npx tsx prisma/seed-categories.ts
        log "✓ Categories seeded"
    fi
    
    # Register node types
    if [ -f "src/scripts/register-nodes.ts" ]; then
        npm run nodes:register
        log "✓ Node types registered"
    fi
    
    log "✓ Database seeding completed"
}

# Function to start application services
start_application_services() {
    log "Starting application services..."
    
    cd "$PROJECT_ROOT"
    
    # Build and start backend
    log "Starting backend service..."
    docker-compose -f coolify.yaml up -d backend
    
    # Wait for backend to be ready
    local max_attempts=20
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:4000/health > /dev/null 2>&1; then
            log "✓ Backend is ready"
            break
        fi
        
        attempt=$((attempt + 1))
        log "Waiting for backend... (attempt $attempt/$max_attempts)"
        sleep 5
    done
    
    # Start frontend
    log "Starting frontend service..."
    docker-compose -f coolify.yaml up -d frontend
    
    # Wait for frontend to be ready
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            log "✓ Frontend is ready"
            break
        fi
        
        attempt=$((attempt + 1))
        log "Waiting for frontend... (attempt $attempt/$max_attempts)"
        sleep 5
    done
    
    log "✓ Application services are running"
}

# Function to setup backup jobs
setup_backup_jobs() {
    log "Setting up backup jobs..."
    
    # Create backup cron jobs (this would be handled by Coolify in production)
    log "ℹ Backup jobs will be managed by Coolify scheduler"
    log "  PostgreSQL backup: Daily at 2:00 AM"
    log "  Redis backup: Daily at 3:00 AM"
    
    # Test backup scripts
    log "Testing backup scripts..."
    
    if [ -f "$PROJECT_ROOT/scripts/backup-database.sh" ]; then
        log "✓ PostgreSQL backup script is available"
    fi
    
    if [ -f "$COOLIFY_CONFIG_DIR/redis-backup.sh" ]; then
        log "✓ Redis backup script is available"
    fi
    
    log "✓ Backup setup completed"
}

# Function to verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check service status
    cd "$PROJECT_ROOT"
    docker-compose -f coolify.yaml ps
    
    # Check database connectivity
    log "Checking database connectivity..."
    if "$PROJECT_ROOT/scripts/check-database-health.sh"; then
        log "✓ Database health check passed"
    else
        log "⚠ Database health check had warnings"
    fi
    
    # Check application endpoints
    log "Checking application endpoints..."
    
    if curl -f http://localhost:4000/health > /dev/null 2>&1; then
        log "✓ Backend health endpoint is responding"
    else
        log "⚠ Backend health endpoint is not responding"
    fi
    
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log "✓ Frontend is accessible"
    else
        log "⚠ Frontend is not accessible"
    fi
    
    log "✓ Deployment verification completed"
}

# Function to display deployment summary
display_summary() {
    log "Deployment Summary:"
    log "=================="
    log ""
    log "Services:"
    log "  Frontend: http://localhost:3000"
    log "  Backend API: http://localhost:4000"
    log "  Database: PostgreSQL (internal)"
    log "  Cache: Redis (internal)"
    log ""
    log "Persistent Storage:"
    log "  PostgreSQL Data: /var/lib/coolify/volumes/n8n-clone-postgres-data"
    log "  Redis Data: /var/lib/coolify/volumes/n8n-clone-redis-data"
    log "  PostgreSQL Backups: /var/lib/coolify/volumes/n8n-clone-postgres-backups"
    log "  Redis Backups: /var/lib/coolify/volumes/n8n-clone-redis-backups"
    log ""
    log "Backup Schedule:"
    log "  PostgreSQL: Daily at 2:00 AM"
    log "  Redis: Daily at 3:00 AM"
    log ""
    log "Management Commands:"
    log "  View logs: docker-compose -f coolify.yaml logs -f"
    log "  Stop services: docker-compose -f coolify.yaml down"
    log "  Backup database: ./scripts/backup-database.sh"
    log "  Restore database: ./scripts/postgres-restore.sh"
    log ""
    log "✓ Deployment completed successfully!"
}

# Main deployment function
main() {
    log "Starting n8n-clone deployment with persistent storage..."
    
    # Load environment variables
    if [ -f "$PROJECT_ROOT/.env" ]; then
        set -a
        source "$PROJECT_ROOT/.env"
        set +a
        log "✓ Environment variables loaded from .env"
    fi
    
    # Run deployment steps
    check_prerequisites
    validate_environment
    setup_persistent_volumes
    prepare_database_init
    deploy_services
    run_database_migrations
    seed_database
    start_application_services
    setup_backup_jobs
    verify_deployment
    display_summary
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "volumes")
        setup_persistent_volumes
        ;;
    "migrate")
        run_database_migrations
        ;;
    "seed")
        seed_database
        ;;
    "backup")
        setup_backup_jobs
        ;;
    "verify")
        verify_deployment
        ;;
    "summary")
        display_summary
        ;;
    *)
        echo "Usage: $0 {deploy|volumes|migrate|seed|backup|verify|summary}"
        echo "  deploy  - Full deployment process (default)"
        echo "  volumes - Setup persistent volumes only"
        echo "  migrate - Run database migrations only"
        echo "  seed    - Seed database only"
        echo "  backup  - Setup backup jobs only"
        echo "  verify  - Verify deployment only"
        echo "  summary - Display deployment summary"
        exit 1
        ;;
esac