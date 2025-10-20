import express from "express";
import cors from "cors";
import { config } from "./config";
import { query } from "./config/database";

const app = express();
const PORT = config.port;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Database health check endpoint
app.get("/health/db", async (req, res) => {
  try {
    const result = await query("SELECT NOW() as current_time, version() as db_version");
    res.json({
      status: "OK",
      message: "Database connection successful",
      data: {
        timestamp: result.rows[0].current_time,
        version: result.rows[0].db_version,
      },
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🗄️  Database: ${config.databaseUrl.replace(/:[^:]*@/, ':****@')}`);
});
