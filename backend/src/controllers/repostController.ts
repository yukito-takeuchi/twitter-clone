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

    // Create repost notification
    try {
      await NotificationModel.createRepostNotification(post.user_id, user_id, post_id);
    } catch (error) {
      console.error("Failed to create repost notification:", error);
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
};
