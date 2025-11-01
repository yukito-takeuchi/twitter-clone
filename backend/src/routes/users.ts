import { Router } from "express";
import { userController } from "../controllers/userController";
import { postController } from "../controllers/postController";
import { repostController } from "../controllers/repostController";
import {
  validateCreateUser,
  validateUpdateUser,
  validatePagination,
} from "../middlewares/validator";

const router = Router();

// Create a new user
router.post("/", validateCreateUser, userController.createUser);

// Get all users (with pagination)
router.get("/", validatePagination, userController.getAllUsers);

// Search users
router.get("/search", validatePagination, userController.searchUsers);

// Get user by Firebase UID
router.get("/firebase/:firebase_uid", userController.getUserByFirebaseUid);

// Get user by username
router.get("/username/:username", userController.getUserByUsername);

// Get pinned post for a user (must be before /:id route)
router.get("/:userId/pinned-post", postController.getPinnedPost);

// Get pinned repost for a user (must be before /:id route)
router.get("/:userId/pinned-repost", repostController.getPinnedRepost);

// Get user by ID
router.get("/:id", userController.getUserById);

// Update user
router.put("/:id", validateUpdateUser, userController.updateUser);

// Delete user (soft delete)
router.delete("/:id", userController.deleteUser);

// Hard delete user (permanent) - for development/testing only
router.delete("/:id/permanent", userController.hardDeleteUser);

export default router;
