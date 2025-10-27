import type { ConversationWithDetails, OtherParticipant } from "@/types/messages";

/**
 * Get the other participant in a conversation
 */
export const getOtherParticipant = (
  conversation: ConversationWithDetails,
  currentUserId: string
): OtherParticipant => {
  const isParticipant1 = conversation.participant1_id === currentUserId;

  return {
    id: isParticipant1 ? conversation.participant2_id : conversation.participant1_id,
    username: isParticipant1
      ? conversation.participant2_username
      : conversation.participant1_username,
    display_name: isParticipant1
      ? conversation.participant2_display_name
      : conversation.participant1_display_name,
    avatar: isParticipant1
      ? conversation.participant2_avatar
      : conversation.participant1_avatar,
  };
};

/**
 * Format timestamp for message display
 */
export const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "Now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d`;
  } else {
    // Return formatted date
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
};

/**
 * Format full timestamp for message details
 */
export const formatFullMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } else {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
};

/**
 * Truncate message preview
 */
export const truncateMessage = (message: string, maxLength: number = 50): string => {
  if (message.length <= maxLength) {
    return message;
  }
  return message.substring(0, maxLength) + "...";
};

/**
 * Get message preview text based on type
 */
export const getMessagePreview = (
  content: string | null,
  messageType: "text" | "image" | "post_share" | null
): string => {
  if (messageType === "image") {
    return content ? `📷 ${content}` : "📷 Photo";
  } else if (messageType === "post_share") {
    return content ? `📎 ${content}` : "📎 Shared a post";
  } else if (content) {
    return content;
  }
  return "";
};
