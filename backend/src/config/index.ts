import dotenv from "dotenv";

dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  // Firebase
  firebaseProjectId?: string;
  firebasePrivateKey?: string;
  firebaseClientEmail?: string;
  // Google Cloud Storage
  gcsProjectId?: string;
  gcsBucketName?: string;
  gcsKeyFilename?: string;
  // Mailgun
  mailgunApiKey?: string;
  mailgunDomain?: string;
  // Frontend URL
  frontendUrl: string;
}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3001", 10),
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:password@localhost:5432/twitter_clone",
  // Firebase
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Google Cloud Storage
  gcsProjectId: process.env.GCS_PROJECT_ID,
  gcsBucketName: process.env.GCS_BUCKET_NAME,
  gcsKeyFilename: process.env.GCS_KEY_FILENAME,
  // Mailgun
  mailgunApiKey: process.env.MAILGUN_API_KEY,
  mailgunDomain: process.env.MAILGUN_DOMAIN,
  // Frontend
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
};

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL"];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Warning: ${envVar} is not set in environment variables`);
  }
});

export default config;
