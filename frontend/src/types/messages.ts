export type MessageType = "text" | "image" | "post_share";

export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithDetails extends Conversation {
  participant1_username: string;
  participant1_display_name: string;
  participant1_avatar: string | null;
  participant2_username: string;
  participant2_display_name: string;
  participant2_avatar: string | null;
  last_message_content: string | null;
  last_message_type: MessageType | null;
  last_message_sender_id: string | null;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: MessageType;
  content: string | null;
  image_id: string | null;
  shared_post_id: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageWithDetails extends Message {
  sender_username: string;
  sender_display_name: string;
  sender_avatar: string | null;
  image_url: string | null;
  read_count: number;
  is_read_by_recipient?: boolean;
}

export interface CreateMessageInput {
  conversation_id: string;
  sender_id: string;
  message_type: MessageType;
  content?: string;
  image_id?: string;
  shared_post_id?: string;
}

export interface SendMessageData {
  conversationId: string;
  senderId: string;
  messageType: MessageType;
  content?: string;
  imageId?: string;
  sharedPostId?: string;
}

// Socket.IO event types
export interface SocketMessageReceive extends MessageWithDetails {}

export interface SocketTypingEvent {
  userId: string;
}

export interface SocketReadConfirmation {
  messageId: string;
  userId: string;
  readAt: string;
}

export interface SocketUserStatus {
  userId: string;
}

export interface SocketNotification {
  type: string;
  conversationId: string;
  senderId: string;
  messagePreview: string;
}

// Helper type for getting the other participant
export interface OtherParticipant {
  id: string;
  username: string;
  display_name: string;
  avatar: string | null;
}

// Helper function type
export type GetOtherParticipant = (
  conversation: ConversationWithDetails,
  currentUserId: string
) => OtherParticipant;
