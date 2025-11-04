import { Request, Response } from "express";
import { VideoModel, CreateVideoInput } from "../models/Video";
import { getVideoUrl, uploadVideoToGCS, isProduction } from "../config/videoStorage";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

// Helper function to get video metadata using ffmpeg
const getVideoMetadata = (
  filePath: string
): Promise<{ duration: number; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        return reject(err);
      }

      const videoStream = metadata.streams.find((s) => s.codec_type === "video");
      if (!videoStream) {
        return reject(new Error("No video stream found"));
      }

      resolve({
        duration: metadata.format.duration || 0,
        width: videoStream.width || 0,
        height: videoStream.height || 0,
      });
    });
  });
};

// Helper function to generate video thumbnail
const generateThumbnail = (
  videoPath: string,
  outputPath: string,
  timestamp: string = "00:00:01"
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timestamp],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: "640x?", // Width 640, height auto
      })
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });
};

// Upload a single video
export const uploadVideo = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No video file uploaded" });
    }

    const file = req.file;

    // Determine video path based on environment
    let videoPath: string;
    let videoUrl: string;

    if (isProduction) {
      // Upload to GCS
      videoUrl = await uploadVideoToGCS(file, "videos");
      videoPath = videoUrl;
    } else {
      // Local storage
      videoPath = file.path;
      videoUrl = getVideoUrl(file.filename);
    }

    // Get video metadata
    let metadata;
    try {
      metadata = await getVideoMetadata(videoPath);
    } catch (error) {
      console.error("Error getting video metadata:", error);
      return res.status(400).json({ error: "Invalid video file" });
    }

    // Validate video duration (max 120 seconds = 2 minutes)
    if (metadata.duration > 120) {
      return res.status(400).json({
        error: `Video duration exceeds maximum allowed (2 minutes). Your video is ${Math.round(metadata.duration)} seconds.`,
      });
    }

    // Generate thumbnail
    let thumbnailUrl: string | undefined;
    try {
      const thumbnailFilename = `${path.parse(file.originalname).name}_thumb.jpg`;
      const thumbnailPath = path.join(__dirname, "../../uploads", thumbnailFilename);

      if (isProduction) {
        // For production: generate thumbnail from buffer, then upload to GCS
        const fs = require('fs');
        const { uploadToGCS } = require('../config/storage');

        // Create temp directory if it doesn't exist
        const tempDir = path.join(__dirname, "../../uploads");
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Save video buffer temporarily to generate thumbnail
        const tempVideoPath = path.join(tempDir, `temp_${Date.now()}${path.extname(file.originalname)}`);
        fs.writeFileSync(tempVideoPath, file.buffer);

        // Generate thumbnail from temporary video file
        await generateThumbnail(tempVideoPath, thumbnailPath, "00:00:01");

        // Upload thumbnail to GCS
        const thumbnailBuffer = fs.readFileSync(thumbnailPath);
        const thumbnailFile = {
          buffer: thumbnailBuffer,
          originalname: thumbnailFilename,
          mimetype: 'image/jpeg'
        } as Express.Multer.File;

        thumbnailUrl = await uploadToGCS(thumbnailFile, "video-thumbnails");

        // Clean up temporary files
        fs.unlinkSync(tempVideoPath);
        fs.unlinkSync(thumbnailPath);
      } else {
        // For local development
        await generateThumbnail(videoPath, thumbnailPath, "00:00:01");
        thumbnailUrl = getVideoUrl(thumbnailFilename);
      }
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      // Continue without thumbnail - not critical
    }

    // Save video metadata to database
    const videoInput: CreateVideoInput = {
      user_id,
      url: videoUrl,
      thumbnail_url: thumbnailUrl,
      file_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
      duration: Math.round(metadata.duration),
      width: metadata.width,
      height: metadata.height,
      storage_type: isProduction ? "gcs" : "local",
    };

    const video = await VideoModel.create(videoInput);

    return res.status(201).json({
      video,
      url: videoUrl,
      thumbnail_url: thumbnailUrl,
      duration: metadata.duration,
      width: metadata.width,
      height: metadata.height,
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    return res.status(500).json({
      error: "Failed to upload video",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get video by ID
export const getVideoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const video = await VideoModel.findById(id);

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    return res.json(video);
  } catch (error) {
    console.error("Error getting video:", error);
    return res.status(500).json({ error: "Failed to get video" });
  }
};

// Get videos by user ID
export const getVideosByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const videos = await VideoModel.findByUserId(userId, limit, offset);
    return res.json(videos);
  } catch (error) {
    console.error("Error getting videos:", error);
    return res.status(500).json({ error: "Failed to get videos" });
  }
};

// Delete video
export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await VideoModel.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Video not found" });
    }

    return res.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
    return res.status(500).json({ error: "Failed to delete video" });
  }
};
