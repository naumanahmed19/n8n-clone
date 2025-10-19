#!/bin/bash

# Database health check script for n8n-clone
# Verifies database connectivity and health before migrations

set -euo pipefail

# Configuration
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-n8n_clone}"
MAX_RETRIES="${MAX_RETRIES:-30}"
RETRY_INTERVAL="${RETRY_INTERVAL:-2}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check basic connectivity
check_connectivity() {
    log "Checking database connectivity..."
    
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        if pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" > /dev/null 2>&1; then
            log "✓ Database is accessible"
            return 0
        else
            retries=$((retries + 1))
            log "⚠ Database not ready, attempt $retries/$MAX_RETRIES"
            sleep $RETRY_INTERVAL
        fi
    done
    
    log "✗ ERROR: Database is not accessible after $MAX_RETRIES attempts"
    return 1
}

# Function to check database exists
check_database_exists() {
    log "Checking if database exists..."
    
    local db_exists
    db_exists=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_DB';" | xargs)
    
    if [ "$db_exists" = "1" ]; then
        log "✓ Database '$POSTGRES_DB' exists"
        return 0
    else
        log "✗ ERROR: Database '$POSTGRES_DB' does not exist"
        return 1
    fi
}

# Function to check database permissions
check_permissions() {
    log "Checking database permissions..."
    
    # Check if user can connect to the database
    if psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" > /dev/null 2>&1; then
        log "✓ User can connect to database"
    else
        log "✗ ERROR: User cannot connect to database"
        return 1
    fi
    
    # Check specific permissions
    local permissions=("SELECT" "INSERT" "UPDATE" "DELETE" "CREATE" "DROP" "ALTER")
    
    for perm in "${permissions[@]}"; do
        local has_perm
        has_perm=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "
            SELECT CASE 
                WHEN has_database_privilege('$POSTGRES_USER', '$POSTGRES_DB', '$perm') 
                THEN 'yes' 
                ELSE 'no' 
            END;" | xargs)
        
        if [ "$has_perm" = "yes" ]; then
            log "✓ User has $perm permission"
        else
            log "⚠ WARNING: User lacks $perm permission"
        fi
    done
    
    return 0
}

# Function to check required extensions
check_extensions() {
    log "Checking required extensions..."
    
    local extensions=("uuid-ossp" "pg_stat_statements")
    
    for ext in "${extensions[@]}"; do
        local ext_exists
        ext_exists=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT 1 FROM pg_extension WHERE extname = '$ext';" | xargs)
        
        if [ "$ext_exists" = "1" ]; then
            log "✓ Extension '$ext' is installed"
        else
            log "⚠ WARNING: Extension '$ext' is not installed"
        fi
    done
    
    return 0
}

# Function to check database size and resources
check_resources() {
    log "Checking database resources..."
    
    # Database size
    local db_size
    db_size=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT pg_size_pretty(pg_database_size('$POSTGRES_DB'));" | xargs)
    log "  Database size: $db_size"
    
    # Connection count
    local conn_count
    conn_count=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB';" | xargs)
    log "  Active connections: $conn_count"
    
    # Max connections
    local max_conn
    max_conn=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SHOW max_connections;" | xargs)
    log "  Max connections: $max_conn"
    
    # Check if connection limit is approaching
    local conn_percentage=$((conn_count * 100 / max_conn))
    if [ $conn_percentage -gt 80 ]; then
        log "⚠ WARNING: Connection usage is high ($conn_percentage%)"
    else
        log "✓ Connection usage is normal ($conn_percentage%)"
    fi
    
    return 0
}

# Function to check migration status
check_migration_status() {
    log "Checking migration status..."
    
    # Check if _prisma_migrations table exists
    local migrations_table_exists
    migrations_table_exists=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_prisma_migrations');" | xargs)
    
    if [ "$migrations_table_exists" = "t" ]; then
        log "✓ Migrations table exists"
        
        # Count applied migrations
        local migration_count
        migration_count=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL;" | xargs)
        log "  Applied migrations: $migration_count"
        
        # Check for failed migrations
        local failed_migrations
        failed_migrations=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NULL;" | xargs)
        
        if [ "$failed_migrations" -gt 0 ]; then
            log "⚠ WARNING: $failed_migrations failed/pending migrations found"
        else
            log "✓ No failed migrations"
        fi
    else
        log "ℹ Migrations table does not exist (fresh database)"
    fi
    
    return 0
}

# Function to check table structure
check_table_structure() {
    log "Checking table structure..."
    
    # Count tables
    local table_count
    table_count=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    log "  Public tables: $table_count"
    
    # List tables if there are any
    if [ "$table_count" -gt 0 ]; then
        log "  Tables:"
        psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT '    ' || table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    fi
    
    return 0
}

# Function to run custom health check function
run_custom_health_check() {
    log "Running custom health check function..."
    
    # Check if the custom health check function exists
    local function_exists
    function_exists=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_database_health');" | xargs)
    
    if [ "$function_exists" = "t" ]; then
        log "✓ Custom health check function found"
        
        # Run the health check function
        psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT * FROM check_database_health();" | while IFS='|' read -r check_name status details; do
            check_name=$(echo "$check_name" | xargs)
            status=$(echo "$status" | xargs)
            details=$(echo "$details" | xargs)
            
            if [ "$status" = "OK" ]; then
                log "✓ $check_name: $details"
            else
                log "✗ $check_name: $details"
            fi
        done
    else
        log "ℹ Custom health check function not found"
    fi
    
    return 0
}

# Main health check function
main() {
    log "Starting database health check..."
    
    local exit_code=0
    
    # Run all health checks
    check_connectivity || exit_code=1
    check_database_exists || exit_code=1
    check_permissions || exit_code=1
    check_extensions || exit_code=1
    check_resources || exit_code=1
    check_migration_status || exit_code=1
    check_table_structure || exit_code=1
    run_custom_health_check || exit_code=1
    
    if [ $exit_code -eq 0 ]; then
        log "✓ Database health check completed successfully"
    else
        log "✗ Database health check completed with warnings/errors"
    fi
    
    return $exit_code
}

# Handle script arguments
case "${1:-check}" in
    "check")
        main
        ;;
    "connectivity")
        check_connectivity
        ;;
    "permissions")
        check_permissions
        ;;
    "extensions")
        check_extensions
        ;;
    "resources")
        check_resources
        ;;
    "migrations")
        check_migration_status
        ;;
    "tables")
        check_table_structure
        ;;
    "custom")
        run_custom_health_check
        ;;
    *)
        echo "Usage: $0 {check|connectivity|permissions|extensions|resources|migrations|tables|custom}"
        echo "  check        - Run all health checks (default)"
        echo "  connectivity - Check database connectivity only"
        echo "  permissions  - Check user permissions only"
        echo "  extensions   - Check required extensions only"
        echo "  resources    - Check database resources only"
        echo "  migrations   - Check migration status only"
        echo "  tables       - Check table structure only"
        echo "  custom       - Run custom health check function only"
        exit 1
        ;;
esac