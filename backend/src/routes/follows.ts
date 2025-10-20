import { Router } from "express";
import { followController } from "../controllers/followController";
import { validatePagination } from "../middlewares/validator";

const router = Router();

// Follow a user
router.post("/", followController.followUser);

// Unfollow a user
router.delete("/:followerId/:followingId", followController.unfollowUser);

// Get followers of a user
router.get("/followers/:userId", validatePagination, followController.getFollowers);

// Get users that a user is following
router.get("/following/:userId", validatePagination, followController.getFollowing);

// Get mutual follows
router.get("/mutual/:userId", validatePagination, followController.getMutualFollows);

// Get suggested users to follow
router.get("/suggestions/:userId", followController.getSuggestions);

// Check if user is following another user
router.get("/check/:followerId/:followingId", followController.checkIfFollowing);

export default router;
