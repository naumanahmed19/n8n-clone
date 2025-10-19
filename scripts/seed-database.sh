#!/bin/bash

# Database seeding script for n8n-clone
# Seeds the database with initial data after migrations

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

# Function to check if seeding is needed
check_seeding_needed() {
    log "Checking if database seeding is needed..."
    
    # Check if categories table has data
    local category_count
    category_count=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT count(*) FROM categories;" 2>/dev/null | xargs || echo "0")
    
    if [ "$category_count" -gt 0 ]; then
        log "ℹ Database already has $category_count categories, skipping seeding"
        return 1
    else
        log "✓ Database is empty, seeding is needed"
        return 0
    fi
}

# Function to seed categories
seed_categories() {
    log "Seeding categories..."
    
    # Run the Prisma seed script for categories
    if [ -f "$BACKEND_DIR/prisma/seed-categories.ts" ]; then
        cd "$BACKEND_DIR"
        npx tsx prisma/seed-categories.ts
        log "✓ Categories seeded successfully"
    else
        log "⚠ WARNING: Categories seed file not found"
    fi
}

# Function to seed node types
seed_node_types() {
    log "Seeding node types..."
    
    # Check if node registration script exists
    if [ -f "$BACKEND_DIR/src/scripts/register-nodes.ts" ]; then
        cd "$BACKEND_DIR"
        npm run nodes:register
        log "✓ Node types registered successfully"
    else
        log "⚠ WARNING: Node registration script not found"
    fi
}

# Function to create default admin user
create_admin_user() {
    log "Creating default admin user..."
    
    # Check if admin user already exists
    local admin_exists
    admin_exists=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT count(*) FROM users WHERE role = 'ADMIN';" | xargs)
    
    if [ "$admin_exists" -gt 0 ]; then
        log "ℹ Admin user already exists, skipping creation"
        return 0
    fi
    
    # Create admin user with default credentials
    local admin_email="${ADMIN_EMAIL:-admin@n8n-clone.local}"
    local admin_password="${ADMIN_PASSWORD:-admin123}"
    local admin_name="${ADMIN_NAME:-Administrator}"
    
    # Hash the password (simplified - in production, use proper bcrypt)
    local password_hash
    password_hash=$(node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('$admin_password', 10));")
    
    # Insert admin user
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
        INSERT INTO users (id, email, password, name, role, active, created_at, updated_at)
        VALUES (
            gen_random_uuid()::text,
            '$admin_email',
            '$password_hash',
            '$admin_name',
            'ADMIN',
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (email) DO NOTHING;
    "
    
    log "✓ Default admin user created: $admin_email"
    log "  Default password: $admin_password"
    log "  ⚠ IMPORTANT: Change the default password after first login!"
}

# Function to create sample workflows (optional)
create_sample_workflows() {
    log "Creating sample workflows..."
    
    # Only create samples if explicitly requested
    if [ "${CREATE_SAMPLES:-false}" != "true" ]; then
        log "ℹ Sample workflow creation skipped (set CREATE_SAMPLES=true to enable)"
        return 0
    fi
    
    # Get admin user ID
    local admin_id
    admin_id=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1;" | xargs)
    
    if [ -z "$admin_id" ]; then
        log "⚠ WARNING: No admin user found, cannot create sample workflows"
        return 1
    fi
    
    # Create a simple sample workflow
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
        INSERT INTO workflows (id, name, description, category, user_id, nodes, connections, active, created_at, updated_at)
        VALUES (
            gen_random_uuid()::text,
            'Sample Workflow',
            'A simple sample workflow to demonstrate the platform',
            'General',
            '$admin_id',
            '[]'::json,
            '[]'::json,
            false,
            NOW(),
            NOW()
        )
        ON CONFLICT DO NOTHING;
    "
    
    log "✓ Sample workflow created"
}

# Function to verify seeding
verify_seeding() {
    log "Verifying database seeding..."
    
    # Check categories
    local category_count
    category_count=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT count(*) FROM categories;" | xargs)
    log "  Categories: $category_count"
    
    # Check node types
    local node_type_count
    node_type_count=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT count(*) FROM node_types;" | xargs)
    log "  Node types: $node_type_count"
    
    # Check users
    local user_count
    user_count=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT count(*) FROM users;" | xargs)
    log "  Users: $user_count"
    
    # Check admin users
    local admin_count
    admin_count=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT count(*) FROM users WHERE role = 'ADMIN';" | xargs)
    log "  Admin users: $admin_count"
    
    # Check workflows
    local workflow_count
    workflow_count=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT count(*) FROM workflows;" | xargs)
    log "  Workflows: $workflow_count"
    
    if [ "$category_count" -gt 0 ] && [ "$admin_count" -gt 0 ]; then
        log "✓ Database seeding verification successful"
        return 0
    else
        log "✗ Database seeding verification failed"
        return 1
    fi
}

# Main seeding function
main() {
    log "Starting database seeding process..."
    
    # Check if seeding is needed
    if ! check_seeding_needed; then
        log "Database seeding skipped"
        return 0
    fi
    
    local exit_code=0
    
    # Run seeding steps
    seed_categories || exit_code=1
    seed_node_types || exit_code=1
    create_admin_user || exit_code=1
    create_sample_workflows || exit_code=1
    
    # Verify seeding
    if verify_seeding; then
        log "✓ Database seeding completed successfully"
    else
        log "✗ Database seeding completed with errors"
        exit_code=1
    fi
    
    return $exit_code
}

# Handle script arguments
case "${1:-seed}" in
    "seed")
        main
        ;;
    "categories")
        seed_categories
        ;;
    "nodes")
        seed_node_types
        ;;
    "admin")
        create_admin_user
        ;;
    "samples")
        CREATE_SAMPLES=true
        create_sample_workflows
        ;;
    "verify")
        verify_seeding
        ;;
    "check")
        check_seeding_needed
        ;;
    *)
        echo "Usage: $0 {seed|categories|nodes|admin|samples|verify|check}"
        echo "  seed       - Run full seeding process (default)"
        echo "  categories - Seed categories only"
        echo "  nodes      - Seed node types only"
        echo "  admin      - Create admin user only"
        echo "  samples    - Create sample workflows only"
        echo "  verify     - Verify seeding results"
        echo "  check      - Check if seeding is needed"
        exit 1
        ;;
esac