import { Request, Response } from "express";
import { MessageModel, CreateMessageInput } from "../models/Message";
import { ConversationModel } from "../models/Conversation";
import { NotificationModel } from "../models/Notification";
import { AppError, asyncHandler } from "../middlewares/errorHandler";
import { uploadToGCS, isProduction } from "../config/storage";

export const messageController = {
  /**
   * Get messages for a conversation
   * GET /api/messages/:conversationId
   */
  getMessages: asyncHandler(async (req: Request, res: Response) => {
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

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const beforeMessageId = req.query.before_message_id as string | undefined;

    const messages = await MessageModel.findByConversationId(
      {
        conversation_id: conversationId,
        limit,
        offset,
        before_message_id: beforeMessageId,
      },
      user_id
    );

    res.json({
      status: "success",
      data: {
        messages,
        count: messages.length,
      },
    });
  }),

  /**
   * Send a text message
   * POST /api/messages
   */
  sendMessage: asyncHandler(async (req: Request, res: Response) => {
    const {
      conversation_id,
      sender_id,
      message_type = "text",
      content,
      shared_post_id,
    } = req.body;

    // Validation
    if (!conversation_id || !sender_id) {
      throw new AppError("Conversation ID and sender ID are required", 400);
    }

    // Check if sender is a participant
    const isParticipant = await ConversationModel.isParticipant(
      conversation_id,
      sender_id
    );

    if (!isParticipant) {
      throw new AppError("You are not a participant in this conversation", 403);
    }

    // Create message input
    const messageInput: CreateMessageInput = {
      conversation_id,
      sender_id,
      message_type,
      content,
      shared_post_id,
    };

    // Create message
    const message = await MessageModel.create(messageInput);

    // Get recipient ID
    const recipientId = await ConversationModel.getOtherParticipant(
      conversation_id,
      sender_id
    );

    // Create notification for recipient
    if (recipientId) {
      const messagePreview =
        message_type === "text"
          ? content || ""
          : message_type === "image"
          ? "📷 Sent an image"
          : "📎 Shared a post";

      await NotificationModel.createDMNotification(
        recipientId,
        sender_id,
        messagePreview,
        conversation_id,
        message.id
      );
    }

    res.status(201).json({
      status: "success",
      data: {
        message,
      },
    });
  }),

  /**
   * Send an image message
   * POST /api/messages/image
   */
  sendImageMessage: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError("No image file uploaded", 400);
    }

    const { conversation_id, sender_id, content } = req.body;

    if (!conversation_id || !sender_id) {
      throw new AppError("Conversation ID and sender ID are required", 400);
    }

    // Check if sender is a participant
    const isParticipant = await ConversationModel.isParticipant(
      conversation_id,
      sender_id
    );

    if (!isParticipant) {
      throw new AppError("You are not a participant in this conversation", 403);
    }

    // Upload image
    let imageUrl: string;
    let storageType: "local" | "gcs";

    if (isProduction) {
      imageUrl = await uploadToGCS(req.file);
      storageType = "gcs";
    } else {
      imageUrl = `/uploads/${req.file.filename}`;
      storageType = "local";
    }

    // Save image to images table
    const { query } = await import("../config/database");
    const imageResult = await query(
      `INSERT INTO images (user_id, url, storage_type, file_name, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        sender_id,
        imageUrl,
        storageType,
        req.file.originalname,
        req.file.size,
        req.file.mimetype,
      ]
    );

    const image = imageResult.rows[0];

    // Create image message
    const message = await MessageModel.create({
      conversation_id,
      sender_id,
      message_type: "image",
      content: content || null,
      image_id: image.id,
    });

    // Emit Socket.IO event for real-time message delivery
    const io = req.app.get("io");
    if (io) {
      try {
        // Get message with full details (sender info, etc.)
        const messages = await MessageModel.findByConversationId(
          {
            conversation_id: conversation_id,
            limit: 1,
            offset: 0,
          },
          sender_id
        );
        const messageWithDetails = messages[0];

        if (messageWithDetails) {
          // Broadcast to conversation room for real-time update
          io.to(`conversation:${conversation_id}`).emit(
            "message:receive",
            messageWithDetails
          );
        }
      } catch (error) {
        console.error("Failed to emit Socket.IO event for image message:", error);
        // Continue execution even if Socket.IO fails
      }
    }

    // Get recipient ID and create notification
    const recipientId = await ConversationModel.getOtherParticipant(
      conversation_id,
      sender_id
    );

    if (recipientId) {
      await NotificationModel.createDMNotification(
        recipientId,
        sender_id,
        "📷 Sent an image",
        conversation_id,
        message.id
      );
    }

    res.status(201).json({
      status: "success",
      data: {
        message,
        image_url: imageUrl,
      },
    });
  }),

  /**
   * Mark a message as read
   * PUT /api/messages/:messageId/read
   */
  markAsRead: asyncHandler(async (req: Request, res: Response) => {
    const { messageId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      throw new AppError("User ID is required", 400);
    }

    const message = await MessageModel.findById(messageId);

    if (!message) {
      throw new AppError("Message not found", 404);
    }

    // Check if user is a participant
    const isParticipant = await ConversationModel.isParticipant(
      message.conversation_id,
      user_id
    );

    if (!isParticipant) {
      throw new AppError("You are not a participant in this conversation", 403);
    }

    // Can't mark own messages as read
    if (message.sender_id === user_id) {
      throw new AppError("Cannot mark your own message as read", 400);
    }

    await MessageModel.markAsRead(messageId, user_id);

    res.json({
      status: "success",
      message: "Message marked as read",
    });
  }),

  /**
   * Mark all messages in a conversation as read
   * PUT /api/messages/conversation/:conversationId/read-all
   */
  markAllAsRead: asyncHandler(async (req: Request, res: Response) => {
    const { conversationId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
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

    const markedCount = await MessageModel.markAllAsRead(conversationId, user_id);

    res.json({
      status: "success",
      message: `${markedCount} messages marked as read`,
      data: {
        marked_count: markedCount,
      },
    });
  }),

  /**
   * Get unread message count for a conversation
   * GET /api/messages/conversation/:conversationId/unread-count
   */
  getUnreadCount: asyncHandler(async (req: Request, res: Response) => {
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

    const unreadCount = await MessageModel.getUnreadCount(conversationId, user_id);

    res.json({
      status: "success",
      data: {
        unread_count: unreadCount,
      },
    });
  }),

  /**
   * Delete a message
   * DELETE /api/messages/:messageId
   */
  deleteMessage: asyncHandler(async (req: Request, res: Response) => {
    const { messageId } = req.params;
    const { user_id } = req.query;

    if (!user_id || typeof user_id !== "string") {
      throw new AppError("User ID is required", 400);
    }

    const message = await MessageModel.findById(messageId);

    if (!message) {
      throw new AppError("Message not found", 404);
    }

    // Only sender can delete their message
    if (message.sender_id !== user_id) {
      throw new AppError("You can only delete your own messages", 403);
    }

    const deleted = await MessageModel.delete(messageId);

    if (!deleted) {
      throw new AppError("Failed to delete message", 500);
    }

    res.json({
      status: "success",
      message: "Message deleted successfully",
    });
  }),

  /**
   * Search messages in a conversation
   * GET /api/messages/conversation/:conversationId/search
   */
  searchMessages: asyncHandler(async (req: Request, res: Response) => {
    const { conversationId } = req.params;
    const { user_id, q: searchTerm } = req.query;

    if (!user_id || typeof user_id !== "string") {
      throw new AppError("User ID is required", 400);
    }

    if (!searchTerm || typeof searchTerm !== "string") {
      throw new AppError("Search term is required", 400);
    }

    // Check if user is a participant
    const isParticipant = await ConversationModel.isParticipant(
      conversationId,
      user_id
    );

    if (!isParticipant) {
      throw new AppError("You are not a participant in this conversation", 403);
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const messages = await MessageModel.search(conversationId, searchTerm, limit);

    res.json({
      status: "success",
      data: {
        messages,
        count: messages.length,
      },
    });
  }),
};
