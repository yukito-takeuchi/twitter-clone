import { Router } from "express";
import { bookmarkController } from "../controllers/bookmarkController";
import { validatePagination } from "../middlewares/validator";

const router = Router();

// Bookmark a post
router.post("/", bookmarkController.bookmarkPost);

// Unbookmark a post
router.delete("/:userId/:postId", bookmarkController.unbookmarkPost);

// Get posts bookmarked by a user
router.get("/user/:userId", validatePagination, bookmarkController.getBookmarkedPosts);

// Check if user has bookmarked a post
router.get("/check/:userId/:postId", bookmarkController.checkIfBookmarked);

export default router;
