import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { MessageModel } from "../models/Message";
import { ConversationModel } from "../models/Conversation";
import { NotificationModel } from "../models/Notification";

interface SocketUser {
  userId: string;
  socketId: string;
}

// Store online users: userId -> socketId[]
const onlineUsers = new Map<string, Set<string>>();

// Store socket to user mapping
const socketToUser = new Map<string, string>();

export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: [
        "http://localhost:3000",
        "https://twitter-clone-one-dusky.vercel.app",
        /\.vercel\.app$/,
        /\.vercel\.dev$/,
      ],
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    /**
     * User authentication
     * Client should emit this immediately after connection
     */
    socket.on("user:authenticate", (userId: string) => {
      if (!userId) {
        socket.emit("error", { message: "User ID is required" });
        return;
      }

      // Add user to online users
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId)!.add(socket.id);
      socketToUser.set(socket.id, userId);

      console.log(`👤 User authenticated: ${userId} (${socket.id})`);

      // Notify user's contacts that they're online
      socket.broadcast.emit("user:online", { userId });

      // Join user to their personal room
      socket.join(`user:${userId}`);
    });

    /**
     * Join a conversation room
     */
    socket.on("conversation:join", async (data: { conversationId: string; userId: string }) => {
      const { conversationId, userId } = data;

      if (!conversationId || !userId) {
        socket.emit("error", { message: "Conversation ID and User ID are required" });
        return;
      }

      // Verify user is a participant
      const isParticipant = await ConversationModel.isParticipant(conversationId, userId);

      if (!isParticipant) {
        socket.emit("error", { message: "You are not a participant in this conversation" });
        return;
      }

      socket.join(`conversation:${conversationId}`);
      console.log(`📨 User ${userId} joined conversation ${conversationId}`);

      // Mark all messages as read when joining
      await MessageModel.markAllAsRead(conversationId, userId);

      // Notify other participant
      socket.to(`conversation:${conversationId}`).emit("user:joined:conversation", {
        conversationId,
        userId,
      });
    });

    /**
     * Leave a conversation room
     */
    socket.on("conversation:leave", (data: { conversationId: string; userId: string }) => {
      const { conversationId, userId } = data;

      socket.leave(`conversation:${conversationId}`);
      console.log(`📤 User ${userId} left conversation ${conversationId}`);

      socket.to(`conversation:${conversationId}`).emit("user:left:conversation", {
        conversationId,
        userId,
      });
    });

    /**
     * Send a message
     */
    socket.on("message:send", async (data: {
      conversationId: string;
      senderId: string;
      messageType: "text" | "image" | "post_share";
      content?: string;
      imageId?: string;
      sharedPostId?: string;
    }) => {
      try {
        const { conversationId, senderId, messageType, content, imageId, sharedPostId } = data;

        // Verify user is a participant
        const isParticipant = await ConversationModel.isParticipant(conversationId, senderId);

        if (!isParticipant) {
          socket.emit("error", { message: "You are not a participant in this conversation" });
          return;
        }

        // Create message
        const message = await MessageModel.create({
          conversation_id: conversationId,
          sender_id: senderId,
          message_type: messageType,
          content,
          image_id: imageId,
          shared_post_id: sharedPostId,
        });

        // Get message with details
        const messages = await MessageModel.findByConversationId({
          conversation_id: conversationId,
          limit: 1,
          offset: 0,
        });

        const messageWithDetails = messages[0];

        // Broadcast to conversation room
        io.to(`conversation:${conversationId}`).emit("message:receive", messageWithDetails);

        // Get recipient and send notification
        const recipientId = await ConversationModel.getOtherParticipant(conversationId, senderId);

        if (recipientId) {
          const messagePreview =
            messageType === "text"
              ? content || ""
              : messageType === "image"
              ? "📷 Sent an image"
              : "📎 Shared a post";

          await NotificationModel.createDMNotification(
            recipientId,
            senderId,
            messagePreview,
            conversationId,
            message.id
          );

          // Send notification to recipient's personal room
          io.to(`user:${recipientId}`).emit("notification:new", {
            type: "dm",
            conversationId,
            senderId,
            messagePreview,
          });
        }

        console.log(`✉️  Message sent in conversation ${conversationId}`);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", {
          message: error instanceof Error ? error.message : "Failed to send message",
        });
      }
    });

    /**
     * Mark message as read
     */
    socket.on("message:read", async (data: {
      messageId: string;
      userId: string;
      conversationId: string;
    }) => {
      try {
        const { messageId, userId, conversationId } = data;

        await MessageModel.markAsRead(messageId, userId);

        // Notify sender that message was read
        socket.to(`conversation:${conversationId}`).emit("message:read:confirmation", {
          messageId,
          userId,
          readAt: new Date(),
        });

        console.log(`✓ Message ${messageId} marked as read by ${userId}`);
      } catch (error) {
        console.error("Error marking message as read:", error);
        socket.emit("error", {
          message: error instanceof Error ? error.message : "Failed to mark message as read",
        });
      }
    });

    /**
     * Typing indicator - start
     */
    socket.on("typing:start", (data: { conversationId: string; userId: string }) => {
      const { conversationId, userId } = data;
      socket.to(`conversation:${conversationId}`).emit("typing:start", { userId });
    });

    /**
     * Typing indicator - stop
     */
    socket.on("typing:stop", (data: { conversationId: string; userId: string }) => {
      const { conversationId, userId } = data;
      socket.to(`conversation:${conversationId}`).emit("typing:stop", { userId });
    });

    /**
     * Handle disconnection
     */
    socket.on("disconnect", () => {
      const userId = socketToUser.get(socket.id);

      if (userId) {
        const userSockets = onlineUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);

          // If user has no more active sockets, mark as offline
          if (userSockets.size === 0) {
            onlineUsers.delete(userId);
            socket.broadcast.emit("user:offline", { userId });
            console.log(`👋 User ${userId} is now offline`);
          }
        }

        socketToUser.delete(socket.id);
      }

      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  console.log("✅ Socket.IO initialized");

  return io;
}

/**
 * Helper function to check if a user is online
 */
export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId) && onlineUsers.get(userId)!.size > 0;
}

/**
 * Helper function to get all online users
 */
export function getOnlineUsers(): string[] {
  return Array.from(onlineUsers.keys());
}

/**
 * Helper function to emit to a specific user (all their connections)
 */
export function emitToUser(io: SocketIOServer, userId: string, event: string, data: any): void {
  io.to(`user:${userId}`).emit(event, data);
}
