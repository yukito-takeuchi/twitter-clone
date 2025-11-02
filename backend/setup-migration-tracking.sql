-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mark 001_initial_schema.sql as already executed
INSERT INTO migrations (filename)
VALUES ('001_initial_schema.sql')
ON CONFLICT (filename) DO NOTHING;
