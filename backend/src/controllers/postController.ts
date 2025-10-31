import { Request, Response } from "express";
import { PostModel } from "../models/Post";
import { UserModel } from "../models/User";
import { NotificationModel } from "../models/Notification";
import { AppError, asyncHandler } from "../middlewares/errorHandler";

export const postController = {
  // Create a new post
  createPost: asyncHandler(async (req: Request, res: Response) => {
    const { user_id, content, image_url, reply_to_id, repost_of_id, quoted_post_id } = req.body;

    console.log('[postController] Creating post:', {
      user_id,
      user_id_type: typeof user_id,
      content: content?.substring(0, 20),
      quoted_post_id,
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

    // If quoting, check if quoted post exists
    if (quoted_post_id) {
      const quotedPost = await PostModel.findById(quoted_post_id);
      if (!quotedPost) {
        throw new AppError("Quoted post not found", 404);
      }
    }

    const post = await PostModel.create({
      user_id,
      content,
      image_url,
      reply_to_id,
      repost_of_id,
      quoted_post_id,
    });

    // Create notifications
    try {
      // Reply notification
      if (reply_to_id) {
        const parentPost = await PostModel.findById(reply_to_id);
        if (parentPost) {
          await NotificationModel.createReplyNotification(
            parentPost.user_id,
            user_id,
            post.id,
            reply_to_id
          );
        }
      }

      // Quote notification
      if (quoted_post_id) {
        const quotedPost = await PostModel.findById(quoted_post_id);
        if (quotedPost) {
          await NotificationModel.createQuoteNotification(
            quotedPost.user_id,
            user_id,
            post.id,
            quoted_post_id
          );
        }
      }

      // New post notification for followers (only for regular posts, not replies/reposts/quotes)
      if (!reply_to_id && !repost_of_id && !quoted_post_id) {
        await NotificationModel.createNewPostNotifications(user_id, post.id);
      }
    } catch (error) {
      console.error("Failed to create post notification:", error);
      // Don't fail the post creation if notification fails
    }

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

  /**
   * Pin a post to user's profile
   * POST /api/posts/:postId/pin
   */
  pinPost: asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { user_id } = req.body;

    console.log('[pinPost] Request:', { postId, user_id, body: req.body, params: req.params });

    if (!user_id) {
      res.status(400).json({
        status: "error",
        message: "user_id is required in request body",
        received: { postId, user_id },
      });
      return;
    }

    if (!postId) {
      res.status(400).json({
        status: "error",
        message: "postId is required in URL parameter",
        received: { postId, user_id },
      });
      return;
    }

    // Check if user exists
    const user = await UserModel.findById(user_id);
    if (!user) {
      res.status(404).json({
        status: "error",
        message: "User not found",
        details: { user_id },
      });
      return;
    }

    // Check if post exists
    const post = await PostModel.findById(postId);
    if (!post) {
      res.status(404).json({
        status: "error",
        message: "Post not found",
        details: { postId },
      });
      return;
    }

    // Check if user owns the post
    if (post.user_id !== user_id) {
      res.status(403).json({
        status: "error",
        message: "You can only pin your own posts",
        details: { post_owner: post.user_id, requesting_user: user_id },
      });
      return;
    }

    const success = await PostModel.pinPost(user_id, postId);

    if (!success) {
      res.status(500).json({
        status: "error",
        message: "Failed to pin post due to database error",
        details: { user_id, postId },
      });
      return;
    }

    res.json({
      status: "success",
      message: "Post pinned successfully",
      data: { user_id, postId },
    });
  }),

  /**
   * Unpin a post from user's profile
   * DELETE /api/posts/:userId/:postId/pin
   */
  unpinPost: asyncHandler(async (req: Request, res: Response) => {
    const { userId, postId } = req.params;

    console.log('[unpinPost] Request:', { userId, postId, params: req.params });

    if (!userId) {
      res.status(400).json({
        status: "error",
        message: "userId is required in URL parameter",
        received: { userId, postId },
      });
      return;
    }

    if (!postId) {
      res.status(400).json({
        status: "error",
        message: "postId is required in URL parameter",
        received: { userId, postId },
      });
      return;
    }

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({
        status: "error",
        message: "User not found",
        details: { userId },
      });
      return;
    }

    // Check if post exists
    const post = await PostModel.findById(postId);
    if (!post) {
      res.status(404).json({
        status: "error",
        message: "Post not found",
        details: { postId },
      });
      return;
    }

    const success = await PostModel.unpinPost(userId, postId);

    if (!success) {
      res.status(400).json({
        status: "error",
        message: "Failed to unpin post. Post may not be pinned or you may not own it.",
        details: { userId, postId },
      });
      return;
    }

    res.json({
      status: "success",
      message: "Post unpinned successfully",
      data: { userId, postId },
    });
  }),

  /**
   * Get pinned post for a user
   * GET /api/users/:userId/pinned-post
   */
  getPinnedPost: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { current_user_id } = req.query;

    console.log('[getPinnedPost] Request:', { userId, current_user_id, params: req.params, query: req.query });

    if (!userId) {
      res.status(400).json({
        status: "error",
        message: "userId is required in URL parameter",
        received: { userId, current_user_id },
      });
      return;
    }

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({
        status: "error",
        message: "User not found",
        details: { userId },
      });
      return;
    }

    const pinnedPost = await PostModel.getPinnedPost(userId, current_user_id as string);

    if (!pinnedPost) {
      res.json({
        status: "success",
        data: {
          pinnedPost: null,
        },
        message: "No pinned post found for this user",
      });
      return;
    }

    res.json({
      status: "success",
      data: {
        pinnedPost,
      },
    });
  }),
};
