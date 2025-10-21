import express from "express";
import cors from "cors";
import path from "path";
import { config } from "./config";
import { query } from "./config/database";
import { errorHandler } from "./middlewares/errorHandler";

// Import routes
import userRoutes from "./routes/users";
import profileRoutes from "./routes/profiles";
import postRoutes from "./routes/posts";
import likeRoutes from "./routes/likes";
import followRoutes from "./routes/follows";
import imageRoutes from "./routes/images";

const app = express();
const PORT = config.port;

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check endpoints
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

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

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/images", imageRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🗄️  Database: ${config.databaseUrl.replace(/:[^:]*@/, ':****@')}`);
});
