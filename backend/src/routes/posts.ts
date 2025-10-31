import { Router } from "express";
import { postController } from "../controllers/postController";
import {
  validateCreatePost,
  validateUpdatePost,
  validatePagination,
} from "../middlewares/validator";

const router = Router();

// Create a new post
router.post("/", validateCreatePost, postController.createPost);

// Get all posts
router.get("/", validatePagination, postController.getAllPosts);

// Search posts
router.get("/search", validatePagination, postController.searchPosts);

// Get timeline for a user
router.get("/timeline/:userId", validatePagination, postController.getTimeline);

// Get posts by user
router.get("/user/:userId", validatePagination, postController.getPostsByUser);

// Get replies by user
router.get("/user/:userId/replies", validatePagination, postController.getRepliesByUser);

// Get post by ID
router.get("/:id", postController.getPostById);

// Get replies to a post
router.get("/:id/replies", validatePagination, postController.getReplies);

// Update post
router.put("/:id", validateUpdatePost, postController.updatePost);

// Delete post
router.delete("/:id", postController.deletePost);

// Pin post to profile
router.post("/:postId/pin", postController.pinPost);

// Unpin post from profile
router.delete("/:userId/:postId/pin", postController.unpinPost);

export default router;
