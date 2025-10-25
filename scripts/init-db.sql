-- Database initialization script for Docker deployments
-- This script runs automatically when PostgreSQL container starts

-- Create database if it doesn't exist (handled by POSTGRES_DB env var)
-- Create extensions if needed

-- Enable UUID extension (if you plan to use UUIDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for better text search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create a read-only user for monitoring/reporting (optional)
-- DO $$
-- BEGIN
--   IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'erp_readonly') THEN
--     CREATE USER erp_readonly WITH PASSWORD 'readonly_password';
--   END IF;
-- END
-- $$;

-- Grant connect permission
-- GRANT CONNECT ON DATABASE erp_database TO erp_readonly;

-- Note: Table-level permissions should be granted after Prisma migrations
-- This can be done in a post-migration script
