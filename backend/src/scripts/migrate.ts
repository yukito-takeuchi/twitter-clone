import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import pool from "../config/database";

const runMigrations = async () => {
  try {
    console.log("🚀 Starting database migrations...");

    // Get all migration files in order
    const migrationsDir = join(__dirname, "../../migrations");
    const files = readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort(); // Sort alphabetically (001, 002, 003, etc.)

    console.log(`\n📁 Found ${files.length} migration files:`);
    files.forEach((file) => {
      console.log(`  - ${file}`);
    });

    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get already executed migrations
    const executedResult = await pool.query(
      "SELECT filename FROM migrations ORDER BY filename"
    );
    const executedMigrations = new Set(
      executedResult.rows.map((row) => row.filename)
    );

    console.log(
      `\n✅ Already executed: ${executedMigrations.size} migrations`
    );

    // Execute new migrations
    let newMigrationsCount = 0;
    for (const file of files) {
      if (executedMigrations.has(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`\n🔄 Executing ${file}...`);
      const migrationPath = join(migrationsDir, file);
      const migrationSQL = readFileSync(migrationPath, "utf-8");

      try {
        // Execute migration in a transaction
        await pool.query("BEGIN");
        await pool.query(migrationSQL);
        await pool.query(
          "INSERT INTO migrations (filename) VALUES ($1)",
          [file]
        );
        await pool.query("COMMIT");

        console.log(`✅ ${file} executed successfully`);
        newMigrationsCount++;
      } catch (error) {
        await pool.query("ROLLBACK");
        console.error(`❌ Failed to execute ${file}:`, error);
        throw error;
      }
    }

    console.log(`\n✨ Migration completed!`);
    console.log(`  - New migrations executed: ${newMigrationsCount}`);
    console.log(`  - Total migrations: ${files.length}`);

    // Verify tables
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log("\n📊 Current database tables:");
    result.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
};

runMigrations();
