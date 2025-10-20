import { readFileSync } from "fs";
import { join } from "path";
import pool from "../config/database";

const runMigration = async () => {
  try {
    console.log("🚀 Starting database migration...");

    // Read the migration file
    const migrationPath = join(__dirname, "../../migrations/001_initial_schema.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    // Execute the migration
    await pool.query(migrationSQL);

    console.log("✅ Migration completed successfully!");

    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log("\n📊 Tables created:");
    result.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

runMigration();
