import { Request, Response } from "express";
import { LikeModel } from "../models/Like";
import { PostModel } from "../models/Post";
import { UserModel } from "../models/User";
import { AppError, asyncHandler } from "../middlewares/errorHandler";

export const likeController = {
  // Like a post
  likePost: asyncHandler(async (req: Request, res: Response) => {
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

    // Check if already liked
    const hasLiked = await LikeModel.hasLiked(user_id, post_id);
    if (hasLiked) {
      throw new AppError("Post already liked", 409);
    }

    const like = await LikeModel.create({ user_id, post_id });

    res.status(201).json({
      status: "success",
      data: { like },
    });
  }),

  // Unlike a post
  unlikePost: asyncHandler(async (req: Request, res: Response) => {
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

    const deleted = await LikeModel.delete(userId, postId);
    if (!deleted) {
      throw new AppError("Like not found", 404);
    }

    res.json({
      status: "success",
      message: "Post unliked successfully",
    });
  }),

  // Get users who liked a post
  getUsersWhoLiked: asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Check if post exists
    const post = await PostModel.findById(postId);
    if (!post) {
      throw new AppError("Post not found", 404);
    }

    const users = await LikeModel.getUsersWhoLiked(postId, limit, offset);
    const count = await LikeModel.getCountByPost(postId);

    res.json({
      status: "success",
      data: {
        users,
        total_likes: count,
        pagination: {
          limit,
          offset,
          count: users.length,
        },
      },
    });
  }),

  // Get posts liked by a user
  getPostsLikedByUser: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const posts = await LikeModel.getPostsLikedByUser(userId, limit, offset);

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

  // Check if user has liked a post
  checkIfLiked: asyncHandler(async (req: Request, res: Response) => {
    const { userId, postId } = req.params;

    const hasLiked = await LikeModel.hasLiked(userId, postId);

    res.json({
      status: "success",
      data: { has_liked: hasLiked },
    });
  }),
};
