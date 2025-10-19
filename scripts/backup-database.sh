#!/bin/bash

# Database backup script for n8n-clone
# Creates a backup before migrations or on-demand

set -euo pipefail

# Configuration
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-n8n_clone}"
BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="postgres_backup_${TIMESTAMP}.sql"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to create database backup
create_backup() {
    log "Starting PostgreSQL backup..."
    
    # Check if PostgreSQL is accessible
    if ! pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" > /dev/null 2>&1; then
        log "ERROR: Cannot connect to PostgreSQL at $POSTGRES_HOST:$POSTGRES_PORT"
        exit 1
    fi
    
    # Create the backup
    log "Creating backup: $BACKUP_DIR/$BACKUP_FILE"
    
    pg_dump -h "$POSTGRES_HOST" \
            -p "$POSTGRES_PORT" \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" \
            --verbose \
            --no-password \
            --format=custom \
            --compress=9 \
            --file="$BACKUP_DIR/${BACKUP_FILE}.dump"
    
    # Also create a plain SQL backup for easier inspection
    pg_dump -h "$POSTGRES_HOST" \
            -p "$POSTGRES_PORT" \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" \
            --verbose \
            --no-password \
            --format=plain \
            --file="$BACKUP_DIR/$BACKUP_FILE"
    
    # Compress the SQL backup
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    
    log "Backup created successfully:"
    log "  Custom format: $BACKUP_DIR/${BACKUP_FILE}.dump"
    log "  SQL format: $BACKUP_DIR/${BACKUP_FILE}.gz"
    
    # Get backup file sizes
    if [ -f "$BACKUP_DIR/${BACKUP_FILE}.dump" ]; then
        DUMP_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_FILE}.dump" | cut -f1)
        log "  Custom backup size: $DUMP_SIZE"
    fi
    
    if [ -f "$BACKUP_DIR/${BACKUP_FILE}.gz" ]; then
        SQL_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_FILE}.gz" | cut -f1)
        log "  SQL backup size: $SQL_SIZE"
    fi
}

# Function to verify backup
verify_backup() {
    local backup_file="$BACKUP_DIR/${BACKUP_FILE}.dump"
    
    log "Verifying backup integrity..."
    
    if [ -f "$backup_file" ]; then
        # Use pg_restore to verify the backup file
        if pg_restore --list "$backup_file" > /dev/null 2>&1; then
            log "Backup verification successful: $backup_file"
            
            # Count tables in backup
            TABLE_COUNT=$(pg_restore --list "$backup_file" | grep -c "TABLE DATA" || echo "0")
            log "  Tables backed up: $TABLE_COUNT"
            
            return 0
        else
            log "ERROR: Backup verification failed: $backup_file is corrupted"
            return 1
        fi
    else
        log "ERROR: Backup file not found: $backup_file"
        return 1
    fi
}

# Function to clean old backups
cleanup_old_backups() {
    local retention_days="${RETENTION_DAYS:-7}"
    
    log "Cleaning up backups older than $retention_days days..."
    
    find "$BACKUP_DIR" -name "postgres_backup_*.sql.gz" -mtime +$retention_days -delete
    find "$BACKUP_DIR" -name "postgres_backup_*.dump" -mtime +$retention_days -delete
    
    log "Cleanup completed"
}

# Function to list available backups
list_backups() {
    log "Available backups in $BACKUP_DIR:"
    
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -name "postgres_backup_*" -type f | sort | while read -r backup; do
            SIZE=$(du -h "$backup" | cut -f1)
            MODIFIED=$(stat -c %y "$backup" | cut -d' ' -f1,2 | cut -d'.' -f1)
            echo "  $(basename "$backup") - $SIZE - $MODIFIED"
        done
    else
        log "Backup directory does not exist: $BACKUP_DIR"
    fi
}

# Function to get database info
get_database_info() {
    log "Database information:"
    
    # Database size
    DB_SIZE=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT pg_size_pretty(pg_database_size('$POSTGRES_DB'));" | xargs)
    log "  Database size: $DB_SIZE"
    
    # Table count
    TABLE_COUNT=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    log "  Table count: $TABLE_COUNT"
    
    # Connection count
    CONN_COUNT=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB';" | xargs)
    log "  Active connections: $CONN_COUNT"
}

# Main execution
main() {
    log "Starting database backup process..."
    
    # Get database info
    get_database_info
    
    # Create backup
    create_backup
    
    # Verify backup
    if verify_backup; then
        log "Backup process completed successfully"
        echo "$BACKUP_DIR/${BACKUP_FILE}.dump" > /tmp/last_backup_file
    else
        log "ERROR: Backup verification failed"
        exit 1
    fi
    
    # Cleanup old backups if requested
    if [ "${CLEANUP_OLD:-false}" = "true" ]; then
        cleanup_old_backups
    fi
    
    log "Database backup process finished"
}

# Handle script arguments
case "${1:-backup}" in
    "backup")
        main
        ;;
    "verify")
        if [ -n "${2:-}" ]; then
            BACKUP_FILE="$2"
            verify_backup
        else
            log "ERROR: Please specify backup file to verify"
            exit 1
        fi
        ;;
    "list")
        list_backups
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "info")
        get_database_info
        ;;
    *)
        echo "Usage: $0 {backup|verify <file>|list|cleanup|info}"
        echo "  backup  - Create a new backup (default)"
        echo "  verify  - Verify a specific backup file"
        echo "  list    - List available backups"
        echo "  cleanup - Remove old backups based on retention policy"
        echo "  info    - Display database information"
        exit 1
        ;;
esac