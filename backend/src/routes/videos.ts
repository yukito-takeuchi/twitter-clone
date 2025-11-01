import express from "express";
import { videoUpload } from "../config/videoStorage";
import * as videoController from "../controllers/videoController";

const router = express.Router();

// Upload a single video
router.post("/upload", videoUpload.single("video"), videoController.uploadVideo);

// Get video by ID
router.get("/:id", videoController.getVideoById);

// Get videos by user ID
router.get("/user/:userId", videoController.getVideosByUserId);

// Delete video by ID
router.delete("/:id", videoController.deleteVideo);

export default router;
