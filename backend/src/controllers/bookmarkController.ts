import { Request, Response } from "express";
import { BookmarkModel } from "../models/Bookmark";
import { PostModel } from "../models/Post";
import { UserModel } from "../models/User";
import { AppError, asyncHandler } from "../middlewares/errorHandler";

export const bookmarkController = {
  // Bookmark a post
  bookmarkPost: asyncHandler(async (req: Request, res: Response) => {
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

    // Check if already bookmarked
    const hasBookmarked = await BookmarkModel.hasBookmarked(user_id, post_id);
    if (hasBookmarked) {
      throw new AppError("Post already bookmarked", 409);
    }

    const bookmark = await BookmarkModel.create({ user_id, post_id });

    res.status(201).json({
      status: "success",
      data: { bookmark },
    });
  }),

  // Unbookmark a post
  unbookmarkPost: asyncHandler(async (req: Request, res: Response) => {
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

    const deleted = await BookmarkModel.delete(userId, postId);
    if (!deleted) {
      throw new AppError("Bookmark not found", 404);
    }

    res.json({
      status: "success",
      message: "Bookmark removed successfully",
    });
  }),

  // Get posts bookmarked by a user
  getBookmarkedPosts: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const posts = await BookmarkModel.getPostsBookmarkedByUser(userId, limit, offset);
    const count = await BookmarkModel.getCountByUser(userId);

    res.json({
      status: "success",
      data: {
        posts,
        total_bookmarks: count,
        pagination: {
          limit,
          offset,
          count: posts.length,
        },
      },
    });
  }),

  // Check if user has bookmarked a post
  checkIfBookmarked: asyncHandler(async (req: Request, res: Response) => {
    const { userId, postId } = req.params;

    const hasBookmarked = await BookmarkModel.hasBookmarked(userId, postId);

    res.json({
      status: "success",
      data: { has_bookmarked: hasBookmarked },
    });
  }),
};
