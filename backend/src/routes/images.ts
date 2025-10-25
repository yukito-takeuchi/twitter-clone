import { Router } from "express";
import { imageController } from "../controllers/imageController";
import { upload } from "../config/storage";

const router = Router();

// Upload single image
router.post("/upload", upload.single("image"), imageController.uploadImage);

// Upload multiple images (max 4)
router.post("/upload-multiple", upload.array("images", 4), imageController.uploadImages);

// Get image by ID
router.get("/:id", imageController.getImageById);

// Delete image
router.delete("/:id", imageController.deleteImage);

export default router;
