#!/bin/bash

# Migration verification script for n8n-clone
# Verifies that database migrations completed successfully

set -euo pipefail

# Configuration
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-n8n_clone}"
BACKEND_DIR="${BACKEND_DIR:-/app/backend}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check Prisma migration status
check_prisma_migration_status() {
    log "Checking Prisma migration status..."
    
    cd "$BACKEND_DIR"
    
    # Run prisma migrate status
    local migration_output
    migration_output=$(npx prisma migrate status 2>&1 || echo "ERROR")
    
    if echo "$migration_output" | grep -q "Database is up to date"; then
        log "✓ All Prisma migrations are applied"
        return 0
    elif echo "$migration_output" | grep -q "Following migration have not yet been applied"; then
        log "✗ ERROR: Pending migrations found"
        echo "$migration_output"
        return 1
    elif echo "$migration_output" | grep -q "ERROR"; then
        log "✗ ERROR: Migration status check failed"
        echo "$migration_output"
        return 1
    else
        log "⚠ WARNING: Unexpected migration status output"
        echo "$migration_output"
        return 1
    fi
}

# Function to verify migration table
verify_migration_table() {
    log "Verifying migration table..."
    
    # Check if _prisma_migrations table exists
    local table_exists
    table_exists=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_prisma_migrations');" | xargs)
    
    if [ "$table_exists" = "t" ]; then
        log "✓ Migration table exists"
        
        # Count total migrations
        local total_migrations
        total_migrations=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT count(*) FROM _prisma_migrations;" | xargs)
        log "  Total migrations: $total_migrations"
        
        # Count applied migrations
        local applied_migrations
        applied_migrations=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL;" | xargs)
        log "  Applied migrations: $applied_migrations"
        
        # Count failed migrations
        local failed_migrations
        failed_migrations=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NULL;" | xargs)
        
        if [ "$failed_migrations" -gt 0 ]; then
            log "✗ ERROR: $failed_migrations failed migrations found"
            
            # Show failed migrations
            log "Failed migrations:"
            psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT migration_name, started_at, logs FROM _prisma_migrations WHERE finished_at IS NULL;"
            
            return 1
        else
            log "✓ No failed migrations"
        fi
        
        return 0
    else
        log "✗ ERROR: Migration table does not exist"
        return 1
    fi
}

# Function to verify expected tables exist
verify_expected_tables() {
    log "Verifying expected tables exist..."
    
    # List of expected tables based on Prisma schema
    local expected_tables=(
        "users"
        "categories"
        "workflows"
        "workflow_environments"
        "workflow_environment_deployments"
        "executions"
        "node_executions"
        "credentials"
        "variables"
        "node_types"
        "flow_execution_states"
        "execution_history"
        "_prisma_migrations"
    )
    
    local missing_tables=()
    
    for table in "${expected_tables[@]}"; do
        local table_exists
        table_exists=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');" | xargs)
        
        if [ "$table_exists" = "t" ]; then
            log "✓ Table '$table' exists"
        else
            log "✗ Table '$table' is missing"
            missing_tables+=("$table")
        fi
    done
    
    if [ ${#missing_tables[@]} -eq 0 ]; then
        log "✓ All expected tables exist"
        return 0
    else
        log "✗ ERROR: ${#missing_tables[@]} tables are missing: ${missing_tables[*]}"
        return 1
    fi
}

# Function to verify table constraints and indexes
verify_table_constraints() {
    log "Verifying table constraints and indexes..."
    
    # Check primary keys
    local tables_without_pk
    tables_without_pk=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "
        SELECT table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND t.table_name != '_prisma_migrations'
        AND NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints tc 
            WHERE tc.table_name = t.table_name 
            AND tc.table_schema = 'public' 
            AND tc.constraint_type = 'PRIMARY KEY'
        );
    " | xargs)
    
    if [ -z "$tables_without_pk" ]; then
        log "✓ All tables have primary keys"
    else
        log "⚠ WARNING: Tables without primary keys: $tables_without_pk"
    fi
    
    # Check foreign key constraints
    local fk_count
    fk_count=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "
        SELECT count(*) 
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_schema = 'public';
    " | xargs)
    log "  Foreign key constraints: $fk_count"
    
    # Check unique constraints
    local unique_count
    unique_count=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "
        SELECT count(*) 
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'UNIQUE' 
        AND table_schema = 'public';
    " | xargs)
    log "  Unique constraints: $unique_count"
    
    # Check indexes
    local index_count
    index_count=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "
        SELECT count(*) 
        FROM pg_indexes 
        WHERE schemaname = 'public';
    " | xargs)
    log "  Indexes: $index_count"
    
    return 0
}

# Function to verify Prisma client generation
verify_prisma_client() {
    log "Verifying Prisma client generation..."
    
    cd "$BACKEND_DIR"
    
    # Check if Prisma client is generated
    if [ -d "node_modules/.prisma/client" ]; then
        log "✓ Prisma client is generated"
        
        # Validate schema
        if npx prisma validate > /dev/null 2>&1; then
            log "✓ Prisma schema is valid"
        else
            log "✗ ERROR: Prisma schema validation failed"
            return 1
        fi
        
        return 0
    else
        log "✗ ERROR: Prisma client is not generated"
        return 1
    fi
}

# Function to test database connectivity with application
test_application_connectivity() {
    log "Testing application database connectivity..."
    
    cd "$BACKEND_DIR"
    
    # Create a simple test script
    cat > /tmp/db_test.js << 'EOF'
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
    const prisma = new PrismaClient();
    
    try {
        // Test basic connectivity
        await prisma.$connect();
        console.log('✓ Prisma client connected successfully');
        
        // Test a simple query
        const userCount = await prisma.user.count();
        console.log(`✓ User count query successful: ${userCount} users`);
        
        // Test transaction capability
        await prisma.$transaction(async (tx) => {
            const count = await tx.user.count();
            console.log('✓ Transaction test successful');
        });
        
        await prisma.$disconnect();
        console.log('✓ Database connectivity test passed');
        process.exit(0);
    } catch (error) {
        console.error('✗ Database connectivity test failed:', error.message);
        process.exit(1);
    }
}

testConnection();
EOF
    
    # Run the test
    if node /tmp/db_test.js; then
        log "✓ Application database connectivity test passed"
        return 0
    else
        log "✗ ERROR: Application database connectivity test failed"
        return 1
    fi
}

# Function to check data integrity
check_data_integrity() {
    log "Checking data integrity..."
    
    # Check for orphaned records (simplified checks)
    
    # Check workflows without users
    local orphaned_workflows
    orphaned_workflows=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "
        SELECT count(*) 
        FROM workflows w 
        LEFT JOIN users u ON w.user_id = u.id 
        WHERE u.id IS NULL;
    " | xargs)
    
    if [ "$orphaned_workflows" -gt 0 ]; then
        log "⚠ WARNING: $orphaned_workflows orphaned workflows found"
    else
        log "✓ No orphaned workflows"
    fi
    
    # Check executions without workflows
    local orphaned_executions
    orphaned_executions=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "
        SELECT count(*) 
        FROM executions e 
        LEFT JOIN workflows w ON e.workflow_id = w.id 
        WHERE w.id IS NULL;
    " | xargs)
    
    if [ "$orphaned_executions" -gt 0 ]; then
        log "⚠ WARNING: $orphaned_executions orphaned executions found"
    else
        log "✓ No orphaned executions"
    fi
    
    return 0
}

# Main verification function
main() {
    log "Starting migration verification process..."
    
    local exit_code=0
    
    # Run all verification checks
    check_prisma_migration_status || exit_code=1
    verify_migration_table || exit_code=1
    verify_expected_tables || exit_code=1
    verify_table_constraints || exit_code=1
    verify_prisma_client || exit_code=1
    test_application_connectivity || exit_code=1
    check_data_integrity || exit_code=1
    
    if [ $exit_code -eq 0 ]; then
        log "✓ Migration verification completed successfully"
    else
        log "✗ Migration verification completed with errors"
    fi
    
    return $exit_code
}

# Handle script arguments
case "${1:-verify}" in
    "verify")
        main
        ;;
    "status")
        check_prisma_migration_status
        ;;
    "tables")
        verify_expected_tables
        ;;
    "constraints")
        verify_table_constraints
        ;;
    "client")
        verify_prisma_client
        ;;
    "connectivity")
        test_application_connectivity
        ;;
    "integrity")
        check_data_integrity
        ;;
    *)
        echo "Usage: $0 {verify|status|tables|constraints|client|connectivity|integrity}"
        echo "  verify       - Run all verification checks (default)"
        echo "  status       - Check Prisma migration status only"
        echo "  tables       - Verify expected tables exist only"
        echo "  constraints  - Verify table constraints and indexes only"
        echo "  client       - Verify Prisma client generation only"
        echo "  connectivity - Test application database connectivity only"
        echo "  integrity    - Check data integrity only"
        exit 1
        ;;
esac