import { Request, Response } from "express";
import { RepostModel } from "../models/Repost";
import { PostModel } from "../models/Post";
import { UserModel } from "../models/User";
import { NotificationModel } from "../models/Notification";
import { AppError, asyncHandler } from "../middlewares/errorHandler";

export const repostController = {
  // Repost a post
  repostPost: asyncHandler(async (req: Request, res: Response) => {
    const { user_id, post_id } = req.body;

    // Check if user exists
    const user = await UserModel.findById(user_id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Check if post exists
    const post = await PostModel.findById(post_id);
    if (!post) {
      throw new AppError("Post not found", 404);
    }

    // Check if already reposted
    const hasReposted = await RepostModel.hasReposted(user_id, post_id);
    if (hasReposted) {
      throw new AppError("Post already reposted", 409);
    }

    const repost = await RepostModel.create({ user_id, post_id });

    // Create repost notification for the original poster
    try {
      await NotificationModel.createRepostNotification(post.user_id, user_id, post_id);
    } catch (error) {
      console.error("Failed to create repost notification:", error);
      // Don't fail the repost operation if notification fails
    }

    // Create new post notifications for the reposter's followers
    try {
      await NotificationModel.createNewPostNotifications(user_id, post_id);
    } catch (error) {
      console.error("Failed to create new post notifications for followers:", error);
      // Don't fail the repost operation if notification fails
    }

    res.status(201).json({
      status: "success",
      data: { repost },
    });
  }),

  // Unrepost a post
  unrepostPost: asyncHandler(async (req: Request, res: Response) => {
    const { userId, postId } = req.params;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Check if post exists
    const post = await PostModel.findById(postId);
    if (!post) {
      throw new AppError("Post not found", 404);
    }

    const deleted = await RepostModel.delete(userId, postId);
    if (!deleted) {
      throw new AppError("Repost not found", 404);
    }

    res.json({
      status: "success",
      message: "Repost removed successfully",
    });
  }),

  // Get users who reposted a post
  getUsersWhoReposted: asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Check if post exists
    const post = await PostModel.findById(postId);
    if (!post) {
      throw new AppError("Post not found", 404);
    }

    const users = await RepostModel.getUsersWhoReposted(postId, limit, offset);
    const count = await RepostModel.getCountByPost(postId);

    res.json({
      status: "success",
      data: {
        users,
        total_reposts: count,
        pagination: {
          limit,
          offset,
          count: users.length,
        },
      },
    });
  }),

  // Get posts reposted by a user
  getPostsRepostedByUser: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const currentUserId = req.query.currentUserId as string | undefined;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const posts = await RepostModel.getPostsRepostedByUser(userId, limit, offset, currentUserId);
    const count = await RepostModel.getCountByPost(userId); // Note: This should be total count for user

    res.json({
      status: "success",
      data: {
        posts,
        pagination: {
          limit,
          offset,
          count: posts.length,
        },
      },
    });
  }),

  // Check if user has reposted a post
  checkIfReposted: asyncHandler(async (req: Request, res: Response) => {
    const { userId, postId } = req.params;

    const hasReposted = await RepostModel.hasReposted(userId, postId);

    res.json({
      status: "success",
      data: { has_reposted: hasReposted },
    });
  }),

  /**
   * Pin a repost to user's profile
   * POST /api/reposts/:postId/pin
   */
  pinRepost: asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      res.status(400).json({
        status: "error",
        message: "user_id is required",
      });
      return;
    }

    const success = await RepostModel.pinRepost(user_id, postId);

    if (!success) {
      res.status(400).json({
        status: "error",
        message: "Failed to pin repost. Repost may not exist or you may not own it.",
      });
      return;
    }

    res.json({
      status: "success",
      message: "Repost pinned successfully",
    });
  }),

  /**
   * Unpin a repost from user's profile
   * DELETE /api/reposts/:postId/pin
   */
  unpinRepost: asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      res.status(400).json({
        status: "error",
        message: "user_id is required",
      });
      return;
    }

    const success = await RepostModel.unpinRepost(user_id, postId);

    if (!success) {
      res.status(400).json({
        status: "error",
        message: "Failed to unpin repost",
      });
      return;
    }

    res.json({
      status: "success",
      message: "Repost unpinned successfully",
    });
  }),

  /**
   * Get pinned repost for a user
   * GET /api/users/:userId/pinned-repost
   */
  getPinnedRepost: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { current_user_id } = req.query;

    const pinnedRepost = await RepostModel.getPinnedRepost(userId, current_user_id as string);

    if (!pinnedRepost) {
      res.json({
        status: "success",
        data: {
          pinnedRepost: null,
        },
      });
      return;
    }

    res.json({
      status: "success",
      data: {
        pinnedRepost,
      },
    });
  }),
};
