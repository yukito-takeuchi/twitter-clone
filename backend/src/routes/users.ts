import { Router } from "express";
import { userController } from "../controllers/userController";
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

// Get user by username
router.get("/username/:username", userController.getUserByUsername);

// Get user by ID
router.get("/:id", userController.getUserById);

// Update user
router.put("/:id", validateUpdateUser, userController.updateUser);

// Delete user (soft delete)
router.delete("/:id", userController.deleteUser);

// Hard delete user (permanent) - for development/testing only
router.delete("/:id/permanent", userController.hardDeleteUser);

export default router;
