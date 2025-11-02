import axios from "axios";
import type {
  ConversationWithDetails,
  MessageWithDetails,
  CreateMessageInput,
  ApiResponse,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================
// Conversations API
// ============================================

/**
 * Get all conversations for a user
 */
export const getConversations = async (
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ConversationWithDetails[]> => {
  const response = await api.get<
    ApiResponse<{ conversations: ConversationWithDetails[]; count: number }>
  >(`/conversations`, {
    params: { user_id: userId, limit, offset },
  });
  return response.data.data?.conversations || [];
};

/**
 * Get or create a conversation with a specific user
 */
export const getOrCreateConversation = async (
  currentUserId: string,
  otherUserId: string
): Promise<{ conversation: ConversationWithDetails; unread_count: number }> => {
  const response = await api.get<
    ApiResponse<{ conversation: ConversationWithDetails; unread_count: number }>
  >(`/conversations/${otherUserId}`, {
    params: { user_id: currentUserId },
  });
  if (!response.data.data) {
    throw new Error('Failed to get or create conversation');
  }
  return response.data.data;
};

/**
 * Get conversation details
 */
export const getConversationDetails = async (
  conversationId: string,
  userId: string
): Promise<any> => {
  const response = await api.get<ApiResponse<any>>(
    `/conversations/${conversationId}/details`,
    {
      params: { user_id: userId },
    }
  );
  if (!response.data.data) {
    throw new Error('Conversation details not found');
  }
  return response.data.data;
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  await api.delete(`/conversations/${conversationId}`, {
    params: { user_id: userId },
  });
};

/**
 * Get total unread count
 */
export const getTotalUnreadCount = async (userId: string): Promise<number> => {
  const response = await api.get<ApiResponse<{ total_unread: number }>>(
    `/conversations/unread/count`,
    {
      params: { user_id: userId },
    }
  );
  return response.data.data?.total_unread || 0;
};

/**
 * Check if user can message another user
 */
export const canMessageUser = async (
  currentUserId: string,
  otherUserId: string
): Promise<boolean> => {
  const response = await api.get<ApiResponse<{ can_message: boolean }>>(
    `/conversations/can-message/${otherUserId}`,
    {
      params: { user_id: currentUserId },
    }
  );
  return response.data.data?.can_message || false;
};

// ============================================
// Messages API
// ============================================

/**
 * Get messages for a conversation
 */
export const getMessages = async (
  conversationId: string,
  userId: string,
  limit: number = 50,
  offset: number = 0,
  beforeMessageId?: string
): Promise<MessageWithDetails[]> => {
  const response = await api.get<
    ApiResponse<{ messages: MessageWithDetails[]; count: number }>
  >(`/messages/${conversationId}`, {
    params: {
      user_id: userId,
      limit,
      offset,
      before_message_id: beforeMessageId,
    },
  });
  return response.data.data?.messages || [];
};

/**
 * Send a text message
 */
export const sendTextMessage = async (
  input: CreateMessageInput
): Promise<MessageWithDetails> => {
  const response = await api.post<ApiResponse<{ message: MessageWithDetails }>>(
    `/messages`,
    input
  );
  if (!response.data.data?.message) throw new Error('Message not found'); return response.data.data.message;
};

/**
 * Send an image message
 */
export const sendImageMessage = async (
  conversationId: string,
  senderId: string,
  imageFile: File,
  caption?: string
): Promise<{ message: MessageWithDetails; image_url: string }> => {
  const formData = new FormData();
  formData.append("conversation_id", conversationId);
  formData.append("sender_id", senderId);
  formData.append("image", imageFile);
  if (caption) {
    formData.append("content", caption);
  }

  const response = await api.post<
    ApiResponse<{ message: MessageWithDetails; image_url: string }>
  >(`/messages/image`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  if (!response.data.data) {
    throw new Error('Failed to send message with image');
  }
  return response.data.data;
};

/**
 * Share a post in a message
 */
export const sharePost = async (
  conversationId: string,
  senderId: string,
  postId: string,
  comment?: string
): Promise<MessageWithDetails> => {
  const response = await api.post<ApiResponse<{ message: MessageWithDetails }>>(
    `/messages`,
    {
      conversation_id: conversationId,
      sender_id: senderId,
      message_type: "post_share",
      shared_post_id: postId,
      content: comment,
    }
  );
  if (!response.data.data?.message) throw new Error('Message not found'); return response.data.data.message;
};

/**
 * Mark a message as read
 */
export const markMessageAsRead = async (
  messageId: string,
  userId: string
): Promise<void> => {
  await api.put(`/messages/${messageId}/read`, { user_id: userId });
};

/**
 * Mark all messages in a conversation as read
 */
export const markAllMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<number> => {
  const response = await api.put<ApiResponse<{ marked_count: number }>>(
    `/messages/conversation/${conversationId}/read-all`,
    { user_id: userId }
  );
  return response.data.data?.marked_count || 0;
};

/**
 * Get unread count for a conversation
 */
export const getUnreadCount = async (
  conversationId: string,
  userId: string
): Promise<number> => {
  const response = await api.get<ApiResponse<{ unread_count: number }>>(
    `/messages/conversation/${conversationId}/unread-count`,
    {
      params: { user_id: userId },
    }
  );
  return response.data.data?.unread_count || 0;
};

/**
 * Delete a message
 */
export const deleteMessage = async (
  messageId: string,
  userId: string
): Promise<void> => {
  await api.delete(`/messages/${messageId}`, {
    params: { user_id: userId },
  });
};

/**
 * Search messages in a conversation
 */
export const searchMessages = async (
  conversationId: string,
  userId: string,
  searchTerm: string,
  limit: number = 20
): Promise<MessageWithDetails[]> => {
  const response = await api.get<
    ApiResponse<{ messages: MessageWithDetails[]; count: number }>
  >(`/messages/conversation/${conversationId}/search`, {
    params: {
      user_id: userId,
      q: searchTerm,
      limit,
    },
  });
  return response.data.data?.messages || [];
};

export default api;
