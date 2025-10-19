#!/bin/bash

# PostgreSQL restore script for n8n-clone
# Restores database from backup files

set -euo pipefail

# Configuration
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-n8n_clone}"
BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
RESTORE_DB="${RESTORE_DB:-${POSTGRES_DB}_restore}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to list available backups
list_backups() {
    log "Available backups in $BACKUP_DIR:"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        log "ERROR: Backup directory does not exist: $BACKUP_DIR"
        return 1
    fi
    
    # List custom format backups
    echo "Custom format backups (.dump):"
    find "$BACKUP_DIR" -name "*.dump" -type f | sort -r | head -20 | while read -r backup; do
        local size
        size=$(du -h "$backup" | cut -f1)
        local modified
        modified=$(stat -c %y "$backup" | cut -d' ' -f1,2 | cut -d'.' -f1)
        echo "  $(basename "$backup") - $size - $modified"
    done
    
    echo ""
    
    # List SQL format backups
    echo "SQL format backups (.sql.gz):"
    find "$BACKUP_DIR" -name "*.sql.gz" -type f | grep -v "_schema\|_critical_data" | sort -r | head -20 | while read -r backup; do
        local size
        size=$(du -h "$backup" | cut -f1)
        local modified
        modified=$(stat -c %y "$backup" | cut -d' ' -f1,2 | cut -d'.' -f1)
        echo "  $(basename "$backup") - $size - $modified"
    done
}

# Function to validate backup file
validate_backup() {
    local backup_file="$1"
    
    log "Validating backup file: $backup_file"
    
    if [ ! -f "$backup_file" ]; then
        log "ERROR: Backup file does not exist: $backup_file"
        return 1
    fi
    
    # Check file extension and validate accordingly
    if [[ "$backup_file" == *.dump ]]; then
        # Validate custom format backup
        if pg_restore --list "$backup_file" > /dev/null 2>&1; then
            log "✓ Custom format backup is valid"
            
            # Show backup contents
            local table_count
            table_count=$(pg_restore --list "$backup_file" | grep -c "TABLE DATA" || echo "0")
            log "  Tables in backup: $table_count"
            
            return 0
        else
            log "✗ ERROR: Custom format backup is corrupted"
            return 1
        fi
    elif [[ "$backup_file" == *.sql.gz ]]; then
        # Validate compressed SQL backup
        if gzip -t "$backup_file" 2>/dev/null; then
            log "✓ SQL backup file is valid"
            
            # Show backup size when uncompressed
            local uncompressed_size
            uncompressed_size=$(gzip -l "$backup_file" | tail -1 | awk '{print $2}')
            log "  Uncompressed size: $(numfmt --to=iec "$uncompressed_size")"
            
            return 0
        else
            log "✗ ERROR: SQL backup file is corrupted"
            return 1
        fi
    elif [[ "$backup_file" == *.sql ]]; then
        # Validate uncompressed SQL backup
        if [ -s "$backup_file" ]; then
            log "✓ SQL backup file is valid"
            return 0
        else
            log "✗ ERROR: SQL backup file is empty"
            return 1
        fi
    else
        log "✗ ERROR: Unsupported backup file format"
        return 1
    fi
}

# Function to create restore database
create_restore_database() {
    local target_db="$1"
    
    log "Creating restore database: $target_db"
    
    # Drop database if it exists
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$target_db\";" > /dev/null 2>&1
    
    # Create new database
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"$target_db\";" > /dev/null 2>&1
    
    log "✓ Restore database created: $target_db"
}

# Function to restore from custom format backup
restore_custom_backup() {
    local backup_file="$1"
    local target_db="$2"
    
    log "Restoring from custom format backup..."
    
    local start_time=$(date +%s)
    
    # Restore the backup
    pg_restore -h "$POSTGRES_HOST" \
               -p "$POSTGRES_PORT" \
               -U "$POSTGRES_USER" \
               -d "$target_db" \
               --verbose \
               --no-password \
               --clean \
               --if-exists \
               --no-owner \
               --no-privileges \
               "$backup_file"
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log "✓ Custom backup restored in ${duration}s"
}

# Function to restore from SQL backup
restore_sql_backup() {
    local backup_file="$1"
    local target_db="$2"
    
    log "Restoring from SQL backup..."
    
    local start_time=$(date +%s)
    
    if [[ "$backup_file" == *.gz ]]; then
        # Restore from compressed SQL backup
        gunzip -c "$backup_file" | psql -h "$POSTGRES_HOST" \
                                        -p "$POSTGRES_PORT" \
                                        -U "$POSTGRES_USER" \
                                        -d "$target_db" \
                                        --quiet
    else
        # Restore from uncompressed SQL backup
        psql -h "$POSTGRES_HOST" \
             -p "$POSTGRES_PORT" \
             -U "$POSTGRES_USER" \
             -d "$target_db" \
             --quiet \
             -f "$backup_file"
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log "✓ SQL backup restored in ${duration}s"
}

# Function to verify restore
verify_restore() {
    local target_db="$1"
    
    log "Verifying restore..."
    
    # Check if database exists and is accessible
    if ! psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$target_db" -c "SELECT 1;" > /dev/null 2>&1; then
        log "✗ ERROR: Cannot connect to restored database"
        return 1
    fi
    
    # Count tables
    local table_count
    table_count=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$target_db" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    log "  Tables restored: $table_count"
    
    # Check critical tables
    local critical_tables=("users" "workflows" "executions")
    for table in "${critical_tables[@]}"; do
        if psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$target_db" -t -c "SELECT 1 FROM information_schema.tables WHERE table_name = '$table';" | grep -q 1; then
            local count
            count=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$target_db" -t -c "SELECT count(*) FROM $table;" | xargs)
            log "  $table: $count records"
        else
            log "  ⚠ WARNING: Table '$table' not found"
        fi
    done
    
    # Check for migration table
    if psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$target_db" -t -c "SELECT 1 FROM information_schema.tables WHERE table_name = '_prisma_migrations';" | grep -q 1; then
        local migration_count
        migration_count=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$target_db" -t -c "SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL;" | xargs)
        log "  Applied migrations: $migration_count"
    fi
    
    log "✓ Restore verification completed"
}

# Function to perform point-in-time recovery
point_in_time_recovery() {
    local target_time="$1"
    local base_backup="$2"
    local target_db="$3"
    
    log "Performing point-in-time recovery to: $target_time"
    
    # This is a simplified implementation
    # In a real scenario, you would need WAL files and more complex recovery
    
    log "⚠ WARNING: Point-in-time recovery requires WAL files and is not fully implemented"
    log "  Target time: $target_time"
    log "  Base backup: $base_backup"
    log "  Target database: $target_db"
    
    # For now, just restore the base backup
    restore_backup "$base_backup" "$target_db"
}

# Function to restore backup (main restore function)
restore_backup() {
    local backup_file="$1"
    local target_db="${2:-$RESTORE_DB}"
    
    log "Starting restore process..."
    log "  Backup file: $backup_file"
    log "  Target database: $target_db"
    
    # Validate backup file
    if ! validate_backup "$backup_file"; then
        log "✗ ERROR: Backup validation failed"
        return 1
    fi
    
    # Create restore database
    create_restore_database "$target_db"
    
    # Restore based on file type
    if [[ "$backup_file" == *.dump ]]; then
        restore_custom_backup "$backup_file" "$target_db"
    elif [[ "$backup_file" == *.sql* ]]; then
        restore_sql_backup "$backup_file" "$target_db"
    else
        log "✗ ERROR: Unsupported backup file format"
        return 1
    fi
    
    # Verify restore
    verify_restore "$target_db"
    
    log "✓ Restore process completed successfully"
    log "  Restored database: $target_db"
    log "  Original database: $POSTGRES_DB (unchanged)"
    
    return 0
}

# Function to swap databases (promote restore)
promote_restore() {
    local restore_db="$1"
    local original_db="$POSTGRES_DB"
    local backup_db="${original_db}_backup_$(date +%Y%m%d_%H%M%S)"
    
    log "Promoting restored database..."
    log "  This will replace the current database!"
    
    # Rename original database to backup
    log "Backing up original database as: $backup_db"
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "ALTER DATABASE \"$original_db\" RENAME TO \"$backup_db\";"
    
    # Rename restore database to original
    log "Promoting restore database to: $original_db"
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "ALTER DATABASE \"$restore_db\" RENAME TO \"$original_db\";"
    
    log "✓ Database promotion completed"
    log "  Current database: $original_db (restored)"
    log "  Backup database: $backup_db (original)"
    log "  ⚠ Remember to update application connections if needed"
}

# Main function
main() {
    local backup_file="$1"
    local target_db="${2:-$RESTORE_DB}"
    
    restore_backup "$backup_file" "$target_db"
}

# Handle script arguments
case "${1:-help}" in
    "restore")
        if [ -n "${2:-}" ]; then
            main "$2" "${3:-}"
        else
            log "ERROR: Please specify backup file to restore"
            exit 1
        fi
        ;;
    "list")
        list_backups
        ;;
    "validate")
        if [ -n "${2:-}" ]; then
            validate_backup "$2"
        else
            log "ERROR: Please specify backup file to validate"
            exit 1
        fi
        ;;
    "pitr")
        if [ -n "${2:-}" ] && [ -n "${3:-}" ]; then
            point_in_time_recovery "$2" "$3" "${4:-$RESTORE_DB}"
        else
            log "ERROR: Please specify target time and base backup file"
            exit 1
        fi
        ;;
    "promote")
        if [ -n "${2:-}" ]; then
            promote_restore "$2"
        else
            log "ERROR: Please specify restore database to promote"
            exit 1
        fi
        ;;
    "help"|*)
        echo "Usage: $0 {restore|list|validate|pitr|promote} [options]"
        echo ""
        echo "Commands:"
        echo "  restore <backup_file> [target_db]  - Restore from backup file"
        echo "  list                               - List available backups"
        echo "  validate <backup_file>             - Validate backup file"
        echo "  pitr <time> <backup> [target_db]   - Point-in-time recovery"
        echo "  promote <restore_db>               - Promote restored database"
        echo ""
        echo "Examples:"
        echo "  $0 restore /backups/postgres/full_backup_20241218_020000.dump"
        echo "  $0 list"
        echo "  $0 validate /backups/postgres/full_backup_20241218_020000.dump"
        echo "  $0 promote n8n_clone_restore"
        exit 1
        ;;
esac