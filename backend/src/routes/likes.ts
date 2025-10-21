import { Router } from "express";
import { likeController } from "../controllers/likeController";
import { validatePagination } from "../middlewares/validator";

const router = Router();

// Like a post
router.post("/", likeController.likePost);

// Unlike a post
router.delete("/:userId/:postId", likeController.unlikePost);

// Get users who liked a post
router.get("/post/:postId", validatePagination, likeController.getUsersWhoLiked);

// Get posts liked by a user
router.get("/user/:userId", validatePagination, likeController.getPostsLikedByUser);

// Check if user has liked a post
router.get("/check/:userId/:postId", likeController.checkIfLiked);

export default router;
