import { Request, Response } from "express";
import { FollowModel } from "../models/Follow";
import { UserModel } from "../models/User";
import { AppError, asyncHandler } from "../middlewares/errorHandler";

export const followController = {
  // Follow a user
  followUser: asyncHandler(async (req: Request, res: Response) => {
    const { follower_id, following_id } = req.body;

    // Check if trying to follow self
    if (follower_id === following_id) {
      throw new AppError("Cannot follow yourself", 400);
    }

    // Check if both users exist
    const follower = await UserModel.findById(follower_id);
    if (!follower) {
      throw new AppError("Follower user not found", 404);
    }

    const following = await UserModel.findById(following_id);
    if (!following) {
      throw new AppError("User to follow not found", 404);
    }

    // Check if already following
    const isFollowing = await FollowModel.isFollowing(follower_id, following_id);
    if (isFollowing) {
      throw new AppError("Already following this user", 409);
    }

    const follow = await FollowModel.create({ follower_id, following_id });

    res.status(201).json({
      status: "success",
      data: { follow },
    });
  }),

  // Unfollow a user
  unfollowUser: asyncHandler(async (req: Request, res: Response) => {
    const { followerId, followingId } = req.params;

    // Check if both users exist
    const follower = await UserModel.findById(followerId);
    if (!follower) {
      throw new AppError("Follower user not found", 404);
    }

    const following = await UserModel.findById(followingId);
    if (!following) {
      throw new AppError("Following user not found", 404);
    }

    const deleted = await FollowModel.delete(followerId, followingId);
    if (!deleted) {
      throw new AppError("Follow relationship not found", 404);
    }

    res.json({
      status: "success",
      message: "User unfollowed successfully",
    });
  }),

  // Get followers of a user
  getFollowers: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const currentUserId = req.query.currentUserId as string | undefined;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const followers = await FollowModel.getFollowers(userId, limit, offset, currentUserId);
    const count = await FollowModel.getFollowerCount(userId);

    res.json({
      status: "success",
      data: {
        followers,
        total_followers: count,
        pagination: {
          limit,
          offset,
          count: followers.length,
        },
      },
    });
  }),

  // Get users that a user is following
  getFollowing: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const currentUserId = req.query.currentUserId as string | undefined;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const following = await FollowModel.getFollowing(userId, limit, offset, currentUserId);
    const count = await FollowModel.getFollowingCount(userId);

    res.json({
      status: "success",
      data: {
        following,
        total_following: count,
        pagination: {
          limit,
          offset,
          count: following.length,
        },
      },
    });
  }),

  // Get mutual follows (users who follow each other)
  getMutualFollows: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const currentUserId = req.query.currentUserId as string | undefined;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const mutualFollows = await FollowModel.getMutualFollows(userId, limit, offset, currentUserId);

    res.json({
      status: "success",
      data: {
        mutual_follows: mutualFollows,
        pagination: {
          limit,
          offset,
          count: mutualFollows.length,
        },
      },
    });
  }),

  // Get suggested users to follow
  getSuggestions: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const suggestions = await FollowModel.getSuggestions(userId, limit);

    res.json({
      status: "success",
      data: {
        suggestions,
        count: suggestions.length,
      },
    });
  }),

  // Check if user is following another user
  checkIfFollowing: asyncHandler(async (req: Request, res: Response) => {
    const { followerId, followingId } = req.params;

    const isFollowing = await FollowModel.isFollowing(followerId, followingId);

    res.json({
      status: "success",
      data: { is_following: isFollowing },
    });
  }),
};
