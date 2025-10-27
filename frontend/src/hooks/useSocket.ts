import { useEffect, useRef, useCallback } from "react";
import {
  initializeSocket,
  getSocket,
  disconnectSocket,
  joinConversation as socketJoinConversation,
  leaveConversation as socketLeaveConversation,
  onMessageReceive,
  onTypingStart,
  onTypingStop,
  onMessageReadConfirmation,
  onUserOnline,
  onUserOffline,
  onNotification,
  removeAllListeners,
} from "@/lib/socket";
import type {
  SocketMessageReceive,
  SocketTypingEvent,
  SocketReadConfirmation,
  SocketUserStatus,
  SocketNotification,
} from "@/types/messages";

interface UseSocketOptions {
  userId: string;
  onMessage?: (message: SocketMessageReceive) => void;
  onTypingStart?: (data: SocketTypingEvent) => void;
  onTypingStop?: (data: SocketTypingEvent) => void;
  onReadConfirmation?: (data: SocketReadConfirmation) => void;
  onUserOnline?: (data: SocketUserStatus) => void;
  onUserOffline?: (data: SocketUserStatus) => void;
  onNotification?: (data: SocketNotification) => void;
}

/**
 * Custom hook for Socket.IO connection and event handling
 */
export const useSocket = (options: UseSocketOptions) => {
  const {
    userId,
    onMessage,
    onTypingStart: onTypingStartCallback,
    onTypingStop: onTypingStopCallback,
    onReadConfirmation,
    onUserOnline: onUserOnlineCallback,
    onUserOffline: onUserOfflineCallback,
    onNotification: onNotificationCallback,
  } = options;

  const socketRef = useRef(getSocket());
  const isInitialized = useRef(false);

  // Initialize socket connection
  useEffect(() => {
    if (!userId || isInitialized.current) return;

    console.log("Initializing socket for user:", userId);
    const socket = initializeSocket(userId);
    socketRef.current = socket;
    isInitialized.current = true;

    return () => {
      // Don't disconnect on unmount, keep connection alive
      // disconnectSocket();
      // isInitialized.current = false;
    };
  }, [userId]);

  // Set up event listeners
  useEffect(() => {
    if (!socketRef.current) return;

    if (onMessage) {
      onMessageReceive(onMessage);
    }

    if (onTypingStartCallback) {
      onTypingStart(onTypingStartCallback);
    }

    if (onTypingStopCallback) {
      onTypingStop(onTypingStopCallback);
    }

    if (onReadConfirmation) {
      onMessageReadConfirmation(onReadConfirmation);
    }

    if (onUserOnlineCallback) {
      onUserOnline(onUserOnlineCallback);
    }

    if (onUserOfflineCallback) {
      onUserOffline(onUserOfflineCallback);
    }

    if (onNotificationCallback) {
      onNotification(onNotificationCallback);
    }

    // Cleanup function
    return () => {
      // Remove only the specific listeners
      // removeAllListeners();
    };
  }, [
    onMessage,
    onTypingStartCallback,
    onTypingStopCallback,
    onReadConfirmation,
    onUserOnlineCallback,
    onUserOfflineCallback,
    onNotificationCallback,
  ]);

  const joinConversation = useCallback(
    (conversationId: string) => {
      socketJoinConversation(conversationId, userId);
    },
    [userId]
  );

  const leaveConversation = useCallback(
    (conversationId: string) => {
      socketLeaveConversation(conversationId, userId);
    },
    [userId]
  );

  const disconnect = useCallback(() => {
    disconnectSocket();
    isInitialized.current = false;
    socketRef.current = null;
  }, []);

  return {
    socket: socketRef.current,
    joinConversation,
    leaveConversation,
    disconnect,
    isConnected: socketRef.current?.connected ?? false,
  };
};

/**
 * Custom hook for managing conversation state with Socket.IO
 */
export const useConversation = (conversationId: string | null, userId: string) => {
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!conversationId || !userId || joinedRef.current) return;

    console.log("Joining conversation:", conversationId);
    socketJoinConversation(conversationId, userId);
    joinedRef.current = true;

    return () => {
      if (conversationId && joinedRef.current) {
        console.log("Leaving conversation:", conversationId);
        socketLeaveConversation(conversationId, userId);
        joinedRef.current = false;
      }
    };
  }, [conversationId, userId]);

  return {
    isJoined: joinedRef.current,
  };
};
