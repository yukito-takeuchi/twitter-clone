const pool = require('./dist/config/database').default;

(async () => {
  try {
    // Create migrations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Mark 001_initial_schema.sql as executed
    await pool.query(
      'INSERT INTO migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
      ['001_initial_schema.sql']
    );

    console.log('✅ Migration tracking setup complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
