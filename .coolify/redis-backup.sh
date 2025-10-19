#!/bin/bash

# Redis backup script for n8n-clone
# This script creates backups of Redis data and manages retention

set -euo pipefail

# Configuration
REDIS_HOST="${REDIS_HOST:-redis}"
REDIS_PORT="${REDIS_PORT:-6379}"
BACKUP_DIR="${BACKUP_DIR:-/backups/redis}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="redis_backup_${TIMESTAMP}.rdb"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to create Redis backup
create_backup() {
    log "Starting Redis backup..."
    
    # Check if Redis is accessible
    if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping > /dev/null 2>&1; then
        log "ERROR: Cannot connect to Redis at $REDIS_HOST:$REDIS_PORT"
        exit 1
    fi
    
    # Trigger BGSAVE for RDB backup
    log "Triggering background save..."
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" BGSAVE
    
    # Wait for BGSAVE to complete
    while [ "$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" LASTSAVE)" = "$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" LASTSAVE)" ]; do
        sleep 1
    done
    
    # Copy the RDB file
    if [ -f "/data/dump.rdb" ]; then
        cp "/data/dump.rdb" "$BACKUP_DIR/$BACKUP_FILE"
        log "Backup created: $BACKUP_DIR/$BACKUP_FILE"
        
        # Compress the backup
        gzip "$BACKUP_DIR/$BACKUP_FILE"
        log "Backup compressed: $BACKUP_DIR/${BACKUP_FILE}.gz"
    else
        log "ERROR: Redis RDB file not found at /data/dump.rdb"
        exit 1
    fi
    
    # Also backup AOF file if it exists
    if [ -f "/data/appendonly.aof" ]; then
        AOF_BACKUP_FILE="redis_aof_backup_${TIMESTAMP}.aof"
        cp "/data/appendonly.aof" "$BACKUP_DIR/$AOF_BACKUP_FILE"
        gzip "$BACKUP_DIR/$AOF_BACKUP_FILE"
        log "AOF backup created: $BACKUP_DIR/${AOF_BACKUP_FILE}.gz"
    fi
}

# Function to clean old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    find "$BACKUP_DIR" -name "redis_backup_*.rdb.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "redis_aof_backup_*.aof.gz" -mtime +$RETENTION_DAYS -delete
    
    log "Cleanup completed"
}

# Function to verify backup
verify_backup() {
    local backup_file="$BACKUP_DIR/${BACKUP_FILE}.gz"
    
    if [ -f "$backup_file" ]; then
        # Check if the file is a valid gzip file
        if gzip -t "$backup_file" 2>/dev/null; then
            log "Backup verification successful: $backup_file"
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

# Function to get Redis info
get_redis_info() {
    log "Redis server information:"
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" INFO server | grep -E "(redis_version|uptime_in_seconds|used_memory_human)"
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" INFO persistence | grep -E "(aof_enabled|rdb_last_save_time|aof_last_rewrite_time)"
}

# Main execution
main() {
    log "Starting Redis backup process..."
    
    # Get Redis info
    get_redis_info
    
    # Create backup
    create_backup
    
    # Verify backup
    if verify_backup; then
        log "Backup process completed successfully"
    else
        log "ERROR: Backup verification failed"
        exit 1
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    log "Redis backup process finished"
}

# Handle script arguments
case "${1:-backup}" in
    "backup")
        main
        ;;
    "cleanup")
        cleanup_old_backups
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
    "info")
        get_redis_info
        ;;
    *)
        echo "Usage: $0 {backup|cleanup|verify <file>|info}"
        echo "  backup  - Create a new backup (default)"
        echo "  cleanup - Remove old backups based on retention policy"
        echo "  verify  - Verify a specific backup file"
        echo "  info    - Display Redis server information"
        exit 1
        ;;
esac