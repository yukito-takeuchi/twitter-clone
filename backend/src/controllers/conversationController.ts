import { Request, Response } from "express";
import { ConversationModel } from "../models/Conversation";
import { MessageModel } from "../models/Message";
import { AppError, asyncHandler } from "../middlewares/errorHandler";

export const conversationController = {
  /**
   * Get all conversations for the authenticated user
   * GET /api/conversations
   */
  getAllConversations: asyncHandler(async (req: Request, res: Response) => {
    const { user_id } = req.query;

    if (!user_id || typeof user_id !== "string") {
      throw new AppError("User ID is required", 400);
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const conversations = await ConversationModel.findByUserId(
      user_id,
      limit,
      offset
    );

    res.json({
      status: "success",
      data: {
        conversations,
        count: conversations.length,
      },
    });
  }),

  /**
   * Get or create a conversation with a specific user
   * GET /api/conversations/:userId
   */
  getOrCreateConversation: asyncHandler(
    async (req: Request, res: Response) => {
      const { userId: otherUserId } = req.params;
      const { user_id: currentUserId } = req.query;

      if (!currentUserId || typeof currentUserId !== "string") {
        throw new AppError("Current user ID is required", 400);
      }

      if (!otherUserId) {
        throw new AppError("Other user ID is required", 400);
      }

      if (currentUserId === otherUserId) {
        throw new AppError("Cannot create conversation with yourself", 400);
      }

      // Check if users are mutual followers
      const areMutual = await ConversationModel.areMutualFollowers(
        currentUserId,
        otherUserId
      );

      if (!areMutual) {
        throw new AppError(
          "You can only message users who mutually follow you",
          403
        );
      }

      // Find or create conversation
      const conversation = await ConversationModel.findOrCreate(
        currentUserId,
        otherUserId
      );

      // Get unread count
      const unreadCount = await MessageModel.getUnreadCount(
        conversation.id,
        currentUserId
      );

      res.json({
        status: "success",
        data: {
          conversation,
          unread_count: unreadCount,
        },
      });
    }
  ),

  /**
   * Get a specific conversation by ID
   * GET /api/conversations/:conversationId/details
   */
  getConversationDetails: asyncHandler(async (req: Request, res: Response) => {
    const { conversationId } = req.params;
    const { user_id } = req.query;

    if (!user_id || typeof user_id !== "string") {
      throw new AppError("User ID is required", 400);
    }

    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    // Check if user is a participant
    const isParticipant = await ConversationModel.isParticipant(
      conversationId,
      user_id
    );

    if (!isParticipant) {
      throw new AppError("You are not a participant in this conversation", 403);
    }

    // Get unread count
    const unreadCount = await MessageModel.getUnreadCount(
      conversationId,
      user_id
    );

    // Get conversation stats
    const stats = await MessageModel.getConversationStats(conversationId);

    res.json({
      status: "success",
      data: {
        conversation,
        unread_count: unreadCount,
        stats,
      },
    });
  }),

  /**
   * Delete (archive) a conversation
   * DELETE /api/conversations/:conversationId
   */
  deleteConversation: asyncHandler(async (req: Request, res: Response) => {
    const { conversationId } = req.params;
    const { user_id } = req.query;

    if (!user_id || typeof user_id !== "string") {
      throw new AppError("User ID is required", 400);
    }

    // Check if user is a participant
    const isParticipant = await ConversationModel.isParticipant(
      conversationId,
      user_id
    );

    if (!isParticipant) {
      throw new AppError("You are not a participant in this conversation", 403);
    }

    const deleted = await ConversationModel.delete(conversationId);

    if (!deleted) {
      throw new AppError("Failed to delete conversation", 500);
    }

    res.json({
      status: "success",
      message: "Conversation deleted successfully",
    });
  }),

  /**
   * Get total unread count across all conversations
   * GET /api/conversations/unread/count
   */
  getTotalUnreadCount: asyncHandler(async (req: Request, res: Response) => {
    const { user_id } = req.query;

    if (!user_id || typeof user_id !== "string") {
      throw new AppError("User ID is required", 400);
    }

    const totalUnread = await ConversationModel.getTotalUnreadCount(user_id);

    res.json({
      status: "success",
      data: {
        total_unread: totalUnread,
      },
    });
  }),

  /**
   * Check if two users can message each other (mutual followers)
   * GET /api/conversations/can-message/:userId
   */
  canMessageUser: asyncHandler(async (req: Request, res: Response) => {
    const { userId: otherUserId } = req.params;
    const { user_id: currentUserId } = req.query;

    if (!currentUserId || typeof currentUserId !== "string") {
      throw new AppError("Current user ID is required", 400);
    }

    if (!otherUserId) {
      throw new AppError("Other user ID is required", 400);
    }

    const areMutual = await ConversationModel.areMutualFollowers(
      currentUserId,
      otherUserId
    );

    res.json({
      status: "success",
      data: {
        can_message: areMutual,
      },
    });
  }),
};
