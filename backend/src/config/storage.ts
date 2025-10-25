import { Storage } from "@google-cloud/storage";
import { config } from "./index";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Determine if we're in production (Heroku)
const isProduction = config.nodeEnv === "production";

// Initialize Google Cloud Storage client (only in production)
let storage: Storage | null = null;
if (isProduction && config.gcsProjectId && config.gcsBucketName) {
  // Parse credentials from environment variable if provided
  const credentials = config.gcsCredentials
    ? JSON.parse(Buffer.from(config.gcsCredentials, "base64").toString())
    : undefined;

  storage = new Storage({
    projectId: config.gcsProjectId,
    credentials,
  });

  console.log(`☁️  Google Cloud Storage initialized for bucket: ${config.gcsBucketName}`);
}

// Multer configuration for local storage (development)
const localStorageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Multer configuration for Google Cloud Storage (production)
const gcsStorageConfig = multer.memoryStorage();

// File filter for images only
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

// Export multer upload instance based on environment
export const upload = multer({
  storage: isProduction ? gcsStorageConfig : localStorageConfig,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

// Helper function to upload file to GCS
export const uploadToGCS = async (
  file: Express.Multer.File,
  folder: string = "images"
): Promise<string> => {
  if (!storage || !config.gcsBucketName) {
    throw new Error("Google Cloud Storage is not configured");
  }

  const bucket = storage.bucket(config.gcsBucketName);
  const uniqueName = `${folder}/${uuidv4()}${path.extname(file.originalname)}`;
  const blob = bucket.file(uniqueName);

  // Upload file buffer to GCS
  await blob.save(file.buffer, {
    contentType: file.mimetype,
    metadata: {
      cacheControl: "public, max-age=31536000",
    },
  });

  // Make the file public
  await blob.makePublic();

  // Return public URL
  return `https://storage.googleapis.com/${config.gcsBucketName}/${uniqueName}`;
};

// Helper function to get image URL based on environment
export const getImageUrl = (filename: string): string => {
  if (isProduction && config.gcsBucketName) {
    return filename; // Already a full GCS URL
  }
  return `/uploads/${filename}`;
};

// Helper function to delete file from GCS
export const deleteFromGCS = async (fileUrl: string): Promise<void> => {
  if (!storage || !config.gcsBucketName) {
    throw new Error("Google Cloud Storage is not configured");
  }

  // Extract filename from URL
  const urlParts = fileUrl.split(`${config.gcsBucketName}/`);
  if (urlParts.length !== 2) {
    throw new Error("Invalid GCS URL");
  }

  const filename = urlParts[1];
  const bucket = storage.bucket(config.gcsBucketName);
  await bucket.file(filename).delete();
};

export { isProduction, storage };
