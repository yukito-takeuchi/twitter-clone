import { io, Socket } from "socket.io-client";
import type {
  SocketMessageReceive,
  SocketTypingEvent,
  SocketReadConfirmation,
  SocketUserStatus,
  SocketNotification,
  SendMessageData,
} from "@/types/messages";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001";

let socket: Socket | null = null;

/**
 * Initialize Socket.IO connection
 */
export const initializeSocket = (userId: string): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  // Authenticate user on connection
  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket?.id);
    socket?.emit("user:authenticate", userId);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });

  return socket;
};

/**
 * Get current socket instance
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join a conversation room
 */
export const joinConversation = (conversationId: string, userId: string): void => {
  socket?.emit("conversation:join", { conversationId, userId });
};

/**
 * Leave a conversation room
 */
export const leaveConversation = (conversationId: string, userId: string): void => {
  socket?.emit("conversation:leave", { conversationId, userId });
};

/**
 * Send a message via Socket.IO
 */
export const sendMessage = (data: SendMessageData): void => {
  socket?.emit("message:send", data);
};

/**
 * Mark message as read
 */
export const markMessageAsRead = (
  messageId: string,
  userId: string,
  conversationId: string
): void => {
  socket?.emit("message:read", { messageId, userId, conversationId });
};

/**
 * Start typing indicator
 */
export const startTyping = (conversationId: string, userId: string): void => {
  socket?.emit("typing:start", { conversationId, userId });
};

/**
 * Stop typing indicator
 */
export const stopTyping = (conversationId: string, userId: string): void => {
  socket?.emit("typing:stop", { conversationId, userId });
};

/**
 * Listen for incoming messages
 */
export const onMessageReceive = (
  callback: (message: SocketMessageReceive) => void
): void => {
  socket?.on("message:receive", callback);
};

/**
 * Listen for typing start
 */
export const onTypingStart = (callback: (data: SocketTypingEvent) => void): void => {
  socket?.on("typing:start", callback);
};

/**
 * Listen for typing stop
 */
export const onTypingStop = (callback: (data: SocketTypingEvent) => void): void => {
  socket?.on("typing:stop", callback);
};

/**
 * Listen for read confirmations
 */
export const onMessageReadConfirmation = (
  callback: (data: SocketReadConfirmation) => void
): void => {
  socket?.on("message:read:confirmation", callback);
};

/**
 * Listen for user online status
 */
export const onUserOnline = (callback: (data: SocketUserStatus) => void): void => {
  socket?.on("user:online", callback);
};

/**
 * Listen for user offline status
 */
export const onUserOffline = (callback: (data: SocketUserStatus) => void): void => {
  socket?.on("user:offline", callback);
};

/**
 * Listen for notifications
 */
export const onNotification = (callback: (data: SocketNotification) => void): void => {
  socket?.on("notification:new", callback);
};

/**
 * Remove all socket listeners
 */
export const removeAllListeners = (): void => {
  socket?.removeAllListeners();
};

/**
 * Remove specific listener
 */
export const removeListener = (event: string, callback?: (...args: any[]) => void): void => {
  if (callback) {
    socket?.off(event, callback);
  } else {
    socket?.off(event);
  }
};
