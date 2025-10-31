import { Router } from "express";
import { repostController } from "../controllers/repostController";
import { validatePagination } from "../middlewares/validator";

const router = Router();

// Repost a post
router.post("/", repostController.repostPost);

// Unrepost a post
router.delete("/:userId/:postId", repostController.unrepostPost);

// Get users who reposted a post
router.get("/post/:postId", validatePagination, repostController.getUsersWhoReposted);

// Get posts reposted by a user
router.get("/user/:userId", validatePagination, repostController.getPostsRepostedByUser);

// Check if user has reposted a post
router.get("/check/:userId/:postId", repostController.checkIfReposted);

// Pin repost to profile
router.post("/:postId/pin", repostController.pinRepost);

// Unpin repost from profile
router.delete("/:userId/:postId/pin", repostController.unpinRepost);

export default router;
