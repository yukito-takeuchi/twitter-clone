import { Request, Response } from "express";
import { PostModel } from "../models/Post";
import { UserModel } from "../models/User";
import { AppError, asyncHandler } from "../middlewares/errorHandler";

export const postController = {
  // Create a new post
  createPost: asyncHandler(async (req: Request, res: Response) => {
    const { user_id, content, image_url, reply_to_id, repost_of_id } = req.body;

    console.log('[postController] Creating post:', {
      user_id,
      user_id_type: typeof user_id,
      content: content?.substring(0, 20),
      body: req.body,
    });

    // Check if user exists
    const user = await UserModel.findById(user_id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // If replying, check if parent post exists
    if (reply_to_id) {
      const parentPost = await PostModel.findById(reply_to_id);
      if (!parentPost) {
        throw new AppError("Parent post not found", 404);
      }
    }

    // If reposting, check if original post exists
    if (repost_of_id) {
      const originalPost = await PostModel.findById(repost_of_id);
      if (!originalPost) {
        throw new AppError("Original post not found", 404);
      }
    }

    const post = await PostModel.create({
      user_id,
      content,
      image_url,
      reply_to_id,
      repost_of_id,
    });

    res.status(201).json({
      status: "success",
      data: { post },
    });
  }),

  // Get post by ID
  getPostById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUserId = req.query.currentUserId as string | undefined;

    const post = await PostModel.findByIdWithStats(id, currentUserId);
    if (!post) {
      throw new AppError("Post not found", 404);
    }

    // Increment view count
    await PostModel.incrementViewCount(id);

    res.json({
      status: "success",
      data: { post },
    });
  }),

  // Get all posts
  getAllPosts: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const currentUserId = req.query.currentUserId as string | undefined;

    const posts = await PostModel.findAll(limit, offset, currentUserId);

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

  // Get posts by user ID (excluding replies)
  getPostsByUser: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const currentUserId = req.query.currentUserId as string | undefined;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const posts = await PostModel.findByUserId(userId, limit, offset, currentUserId);

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

  // Get replies by user ID
  getRepliesByUser: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const currentUserId = req.query.currentUserId as string | undefined;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const replies = await PostModel.findRepliesByUserId(userId, limit, offset, currentUserId);

    res.json({
      status: "success",
      data: {
        replies,
        pagination: {
          limit,
          offset,
          count: replies.length,
        },
      },
    });
  }),

  // Get timeline (posts from followed users)
  getTimeline: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const currentUserId = req.query.currentUserId as string | undefined;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const posts = await PostModel.getTimeline(userId, limit, offset, currentUserId);

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

  // Get replies to a post
  getReplies: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const currentUserId = req.query.currentUserId as string | undefined;

    // Check if post exists
    const post = await PostModel.findById(id);
    if (!post) {
      throw new AppError("Post not found", 404);
    }

    const replies = await PostModel.getReplies(id, limit, offset, currentUserId);

    res.json({
      status: "success",
      data: {
        replies,
        pagination: {
          limit,
          offset,
          count: replies.length,
        },
      },
    });
  }),

  // Update post
  updatePost: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { content, image_url } = req.body;

    const existingPost = await PostModel.findById(id);
    if (!existingPost) {
      throw new AppError("Post not found", 404);
    }

    const post = await PostModel.update(id, {
      content,
      image_url,
    });

    res.json({
      status: "success",
      data: { post },
    });
  }),

  // Delete post
  deletePost: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const existingPost = await PostModel.findById(id);
    if (!existingPost) {
      throw new AppError("Post not found", 404);
    }

    await PostModel.softDelete(id);

    res.json({
      status: "success",
      message: "Post deleted successfully",
    });
  }),

  // Search posts
  searchPosts: asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!q || typeof q !== "string") {
      throw new AppError("Search query 'q' is required", 400);
    }

    const posts = await PostModel.search(q, limit, offset);

    res.json({
      status: "success",
      data: {
        posts,
        query: q,
        pagination: {
          limit,
          offset,
          count: posts.length,
        },
      },
    });
  }),
};
