#!/bin/bash

# PostgreSQL full backup script for n8n-clone
# Creates comprehensive database backups with multiple formats

set -euo pipefail

# Configuration
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-n8n_clone}"
BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
COMPRESSION_LEVEL="${COMPRESSION_LEVEL:-9}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PREFIX="full_backup_${TIMESTAMP}"

# Notification settings
WEBHOOK_URL="${BACKUP_WEBHOOK_URL:-}"
NOTIFICATION_ENABLED="${BACKUP_NOTIFICATIONS:-true}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    if [ "$NOTIFICATION_ENABLED" = "true" ] && [ -n "$WEBHOOK_URL" ]; then
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"status\": \"$status\",
                \"message\": \"$message\",
                \"timestamp\": \"$(date -Iseconds)\",
                \"database\": \"$POSTGRES_DB\",
                \"host\": \"$POSTGRES_HOST\"
            }" > /dev/null 2>&1 || true
    fi
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking backup prerequisites..."
    
    # Check if PostgreSQL is accessible
    if ! pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" > /dev/null 2>&1; then
        log "ERROR: Cannot connect to PostgreSQL at $POSTGRES_HOST:$POSTGRES_PORT"
        send_notification "error" "Cannot connect to PostgreSQL database"
        exit 1
    fi
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Check disk space (require at least 1GB free)
    local available_space
    available_space=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    local required_space=1048576  # 1GB in KB
    
    if [ "$available_space" -lt "$required_space" ]; then
        log "ERROR: Insufficient disk space. Available: ${available_space}KB, Required: ${required_space}KB"
        send_notification "error" "Insufficient disk space for backup"
        exit 1
    fi
    
    log "✓ Prerequisites check passed"
}

# Function to get database information
get_database_info() {
    log "Gathering database information..."
    
    # Database size
    DB_SIZE=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT pg_size_pretty(pg_database_size('$POSTGRES_DB'));" | xargs)
    log "  Database size: $DB_SIZE"
    
    # Table count
    TABLE_COUNT=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    log "  Table count: $TABLE_COUNT"
    
    # Record counts for major tables
    log "  Record counts:"
    for table in users workflows executions node_executions; do
        if psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT 1 FROM information_schema.tables WHERE table_name = '$table';" | grep -q 1; then
            local count
            count=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT count(*) FROM $table;" | xargs)
            log "    $table: $count"
        fi
    done
}

# Function to create custom format backup
create_custom_backup() {
    log "Creating custom format backup..."
    
    local backup_file="$BACKUP_DIR/${BACKUP_PREFIX}.dump"
    local start_time=$(date +%s)
    
    pg_dump -h "$POSTGRES_HOST" \
            -p "$POSTGRES_PORT" \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" \
            --verbose \
            --no-password \
            --format=custom \
            --compress="$COMPRESSION_LEVEL" \
            --file="$backup_file" \
            --exclude-table-data='execution_history' \
            --exclude-table-data='flow_execution_states'
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ -f "$backup_file" ]; then
        local file_size
        file_size=$(du -h "$backup_file" | cut -f1)
        log "✓ Custom backup created: $backup_file ($file_size, ${duration}s)"
        echo "$backup_file" > /tmp/last_custom_backup
    else
        log "✗ ERROR: Custom backup failed"
        return 1
    fi
}

# Function to create SQL format backup
create_sql_backup() {
    log "Creating SQL format backup..."
    
    local backup_file="$BACKUP_DIR/${BACKUP_PREFIX}.sql"
    local start_time=$(date +%s)
    
    pg_dump -h "$POSTGRES_HOST" \
            -p "$POSTGRES_PORT" \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" \
            --verbose \
            --no-password \
            --format=plain \
            --file="$backup_file" \
            --exclude-table-data='execution_history' \
            --exclude-table-data='flow_execution_states'
    
    # Compress the SQL backup
    gzip "$backup_file"
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ -f "${backup_file}.gz" ]; then
        local file_size
        file_size=$(du -h "${backup_file}.gz" | cut -f1)
        log "✓ SQL backup created: ${backup_file}.gz ($file_size, ${duration}s)"
        echo "${backup_file}.gz" > /tmp/last_sql_backup
    else
        log "✗ ERROR: SQL backup failed"
        return 1
    fi
}

# Function to create schema-only backup
create_schema_backup() {
    log "Creating schema-only backup..."
    
    local backup_file="$BACKUP_DIR/${BACKUP_PREFIX}_schema.sql"
    
    pg_dump -h "$POSTGRES_HOST" \
            -p "$POSTGRES_PORT" \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" \
            --verbose \
            --no-password \
            --format=plain \
            --schema-only \
            --file="$backup_file"
    
    gzip "$backup_file"
    
    if [ -f "${backup_file}.gz" ]; then
        local file_size
        file_size=$(du -h "${backup_file}.gz" | cut -f1)
        log "✓ Schema backup created: ${backup_file}.gz ($file_size)"
    else
        log "✗ ERROR: Schema backup failed"
        return 1
    fi
}

# Function to create data-only backup for critical tables
create_critical_data_backup() {
    log "Creating critical data backup..."
    
    local backup_file="$BACKUP_DIR/${BACKUP_PREFIX}_critical_data.sql"
    local critical_tables="users workflows credentials variables node_types categories"
    
    pg_dump -h "$POSTGRES_HOST" \
            -p "$POSTGRES_PORT" \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" \
            --verbose \
            --no-password \
            --format=plain \
            --data-only \
            --file="$backup_file" \
            $(echo "$critical_tables" | sed 's/\([^ ]*\)/-t \1/g')
    
    gzip "$backup_file"
    
    if [ -f "${backup_file}.gz" ]; then
        local file_size
        file_size=$(du -h "${backup_file}.gz" | cut -f1)
        log "✓ Critical data backup created: ${backup_file}.gz ($file_size)"
    else
        log "✗ ERROR: Critical data backup failed"
        return 1
    fi
}

# Function to verify backups
verify_backups() {
    log "Verifying backup integrity..."
    
    local verification_failed=false
    
    # Verify custom backup
    if [ -f "$BACKUP_DIR/${BACKUP_PREFIX}.dump" ]; then
        if pg_restore --list "$BACKUP_DIR/${BACKUP_PREFIX}.dump" > /dev/null 2>&1; then
            log "✓ Custom backup verification passed"
        else
            log "✗ Custom backup verification failed"
            verification_failed=true
        fi
    fi
    
    # Verify SQL backup
    if [ -f "$BACKUP_DIR/${BACKUP_PREFIX}.sql.gz" ]; then
        if gzip -t "$BACKUP_DIR/${BACKUP_PREFIX}.sql.gz" 2>/dev/null; then
            log "✓ SQL backup verification passed"
        else
            log "✗ SQL backup verification failed"
            verification_failed=true
        fi
    fi
    
    # Verify schema backup
    if [ -f "$BACKUP_DIR/${BACKUP_PREFIX}_schema.sql.gz" ]; then
        if gzip -t "$BACKUP_DIR/${BACKUP_PREFIX}_schema.sql.gz" 2>/dev/null; then
            log "✓ Schema backup verification passed"
        else
            log "✗ Schema backup verification failed"
            verification_failed=true
        fi
    fi
    
    if [ "$verification_failed" = true ]; then
        log "✗ ERROR: Backup verification failed"
        return 1
    else
        log "✓ All backup verifications passed"
        return 0
    fi
}

# Function to create backup manifest
create_backup_manifest() {
    log "Creating backup manifest..."
    
    local manifest_file="$BACKUP_DIR/${BACKUP_PREFIX}_manifest.json"
    
    cat > "$manifest_file" << EOF
{
  "backup_info": {
    "timestamp": "$(date -Iseconds)",
    "database": "$POSTGRES_DB",
    "host": "$POSTGRES_HOST",
    "backup_type": "full",
    "backup_prefix": "$BACKUP_PREFIX",
    "database_size": "$DB_SIZE",
    "table_count": $TABLE_COUNT
  },
  "backup_files": {
    "custom_backup": {
      "file": "${BACKUP_PREFIX}.dump",
      "size": "$([ -f "$BACKUP_DIR/${BACKUP_PREFIX}.dump" ] && du -h "$BACKUP_DIR/${BACKUP_PREFIX}.dump" | cut -f1 || echo "N/A")",
      "format": "custom",
      "compressed": true
    },
    "sql_backup": {
      "file": "${BACKUP_PREFIX}.sql.gz",
      "size": "$([ -f "$BACKUP_DIR/${BACKUP_PREFIX}.sql.gz" ] && du -h "$BACKUP_DIR/${BACKUP_PREFIX}.sql.gz" | cut -f1 || echo "N/A")",
      "format": "sql",
      "compressed": true
    },
    "schema_backup": {
      "file": "${BACKUP_PREFIX}_schema.sql.gz",
      "size": "$([ -f "$BACKUP_DIR/${BACKUP_PREFIX}_schema.sql.gz" ] && du -h "$BACKUP_DIR/${BACKUP_PREFIX}_schema.sql.gz" | cut -f1 || echo "N/A")",
      "format": "sql",
      "schema_only": true
    },
    "critical_data_backup": {
      "file": "${BACKUP_PREFIX}_critical_data.sql.gz",
      "size": "$([ -f "$BACKUP_DIR/${BACKUP_PREFIX}_critical_data.sql.gz" ] && du -h "$BACKUP_DIR/${BACKUP_PREFIX}_critical_data.sql.gz" | cut -f1 || echo "N/A")",
      "format": "sql",
      "data_only": true
    }
  },
  "retention": {
    "retention_days": $RETENTION_DAYS,
    "cleanup_date": "$(date -d "+$RETENTION_DAYS days" -Iseconds)"
  }
}
EOF
    
    log "✓ Backup manifest created: $manifest_file"
}

# Function to cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local deleted_count=0
    
    # Find and delete old backup files
    find "$BACKUP_DIR" -name "full_backup_*" -type f -mtime +$RETENTION_DAYS | while read -r old_file; do
        rm -f "$old_file"
        deleted_count=$((deleted_count + 1))
        log "  Deleted: $(basename "$old_file")"
    done
    
    log "✓ Cleanup completed"
}

# Function to upload to remote storage (if configured)
upload_to_remote() {
    if [ "${REMOTE_BACKUP_ENABLED:-false}" = "true" ] && [ -n "${BACKUP_S3_BUCKET:-}" ]; then
        log "Uploading backups to remote storage..."
        
        # This would require AWS CLI or similar tool
        # Implementation depends on the remote storage type
        log "ℹ Remote backup upload not implemented in this version"
    fi
}

# Main backup function
main() {
    local start_time=$(date +%s)
    log "Starting full PostgreSQL backup process..."
    
    # Send start notification
    send_notification "started" "Full database backup started for $POSTGRES_DB"
    
    local exit_code=0
    
    # Run backup process
    check_prerequisites || exit_code=1
    
    if [ $exit_code -eq 0 ]; then
        get_database_info
        create_custom_backup || exit_code=1
        create_sql_backup || exit_code=1
        create_schema_backup || exit_code=1
        create_critical_data_backup || exit_code=1
        
        if verify_backups; then
            create_backup_manifest
            cleanup_old_backups
            upload_to_remote
            
            local end_time=$(date +%s)
            local total_duration=$((end_time - start_time))
            
            log "✓ Full backup process completed successfully in ${total_duration}s"
            send_notification "success" "Full database backup completed successfully in ${total_duration}s"
        else
            exit_code=1
        fi
    fi
    
    if [ $exit_code -ne 0 ]; then
        log "✗ Full backup process failed"
        send_notification "error" "Full database backup failed"
    fi
    
    return $exit_code
}

# Handle script arguments
case "${1:-backup}" in
    "backup")
        main
        ;;
    "verify")
        if [ -n "${2:-}" ]; then
            BACKUP_PREFIX="$2"
            verify_backups
        else
            log "ERROR: Please specify backup prefix to verify"
            exit 1
        fi
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "info")
        get_database_info
        ;;
    *)
        echo "Usage: $0 {backup|verify <prefix>|cleanup|info}"
        echo "  backup  - Create full backup (default)"
        echo "  verify  - Verify specific backup files"
        echo "  cleanup - Remove old backups"
        echo "  info    - Display database information"
        exit 1
        ;;
esac