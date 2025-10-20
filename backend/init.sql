-- Twitter Clone Database Initialization Script
-- This script will run automatically when the PostgreSQL container starts for the first time

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables will be added as we implement features
-- For now, this is a placeholder that ensures the database is properly initialized

-- Example: Create a simple health check table
CREATE TABLE IF NOT EXISTS system_health (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) NOT NULL,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial health check record
INSERT INTO system_health (status) VALUES ('initialized');

-- Log the initialization
DO $$
BEGIN
    RAISE NOTICE 'Twitter Clone database initialized successfully';
END $$;
