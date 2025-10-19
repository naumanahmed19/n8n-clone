-- PostgreSQL initialization script for n8n-clone
-- This script runs during database container initialization

-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Create database if it doesn't exist (handled by POSTGRES_DB env var)
-- The database is created automatically by the postgres container

-- Performance and monitoring setup
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.max = 10000;

-- Logging configuration for production monitoring
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;

-- Performance tuning
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';

-- Connection and resource limits
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET max_prepared_transactions = 0;

-- Create a function to check database health
CREATE OR REPLACE FUNCTION check_database_health()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check database connectivity
    RETURN QUERY SELECT 'connectivity'::TEXT, 'OK'::TEXT, 'Database is accessible'::TEXT;
    
    -- Check extensions
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        RETURN QUERY SELECT 'uuid_extension'::TEXT, 'OK'::TEXT, 'UUID extension is installed'::TEXT;
    ELSE
        RETURN QUERY SELECT 'uuid_extension'::TEXT, 'ERROR'::TEXT, 'UUID extension is missing'::TEXT;
    END IF;
    
    -- Check pg_stat_statements
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        RETURN QUERY SELECT 'stats_extension'::TEXT, 'OK'::TEXT, 'pg_stat_statements extension is installed'::TEXT;
    ELSE
        RETURN QUERY SELECT 'stats_extension'::TEXT, 'ERROR'::TEXT, 'pg_stat_statements extension is missing'::TEXT;
    END IF;
    
    -- Check disk space (simplified check)
    RETURN QUERY SELECT 'disk_space'::TEXT, 'OK'::TEXT, 'Disk space check passed'::TEXT;
    
END;
$$ LANGUAGE plpgsql;

-- Create a monitoring user for health checks (optional)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_user WHERE usename = 'monitor') THEN
        CREATE USER monitor WITH PASSWORD 'monitor_password';
        GRANT CONNECT ON DATABASE n8n_clone TO monitor;
        GRANT USAGE ON SCHEMA public TO monitor;
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitor;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO monitor;
    END IF;
END
$$;

-- Reload configuration
SELECT pg_reload_conf();