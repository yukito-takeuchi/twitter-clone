import { Router } from "express";
import { profileController } from "../controllers/profileController";
import { validateUpdateProfile } from "../middlewares/validator";

const router = Router();

// Get profile by user ID
router.get("/:userId", profileController.getProfile);

// Update profile
router.put("/:userId", validateUpdateProfile, profileController.updateProfile);

// Delete profile
router.delete("/:userId", profileController.deleteProfile);

export default router;
