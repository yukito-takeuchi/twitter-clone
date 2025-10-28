export type NotificationType =
  | "dm"
  | "like"
  | "follow"
  | "reply"
  | "mention"
  | "repost"
  | "quote"
  | "new_post";

export interface Notification {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  content: NotificationContent;
  related_user_id: string | null;
  related_post_id: string | null;
  related_message_id: string | null;
  is_read: boolean;
  is_sent_email: boolean;
  read_at: string | null;
  created_at: string;
}

export type NotificationContent =
  | NotificationContentDM
  | NotificationContentLike
  | NotificationContentFollow
  | NotificationContentReply
  | NotificationContentQuote
  | NotificationContentRepost
  | NotificationContentNewPost;

export interface NotificationContentDM {
  sender_username: string;
  sender_display_name: string;
  message_preview: string;
  conversation_id: string;
}

export interface NotificationContentLike {
  liker_username: string;
  liker_display_name: string;
  post_content: string;
}

export interface NotificationContentFollow {
  follower_username: string;
  follower_display_name: string;
}

export interface NotificationContentReply {
  replier_username: string;
  replier_display_name: string;
  reply_content: string;
  original_post_content: string;
}

export interface NotificationContentQuote {
  quoter_username: string;
  quoter_display_name: string;
  quote_content: string;
  original_post_content: string;
}

export interface NotificationContentRepost {
  reposter_username: string;
  reposter_display_name: string;
  post_content: string;
}

export interface NotificationContentNewPost {
  poster_username: string;
  poster_display_name: string;
  post_content: string;
}

export type EmailFrequency = "instant" | "daily" | "weekly" | "never";

export interface NotificationSettings {
  id: string;
  user_id: string;
  enable_likes: boolean;
  enable_replies: boolean;
  enable_follows: boolean;
  enable_reposts: boolean;
  enable_quotes: boolean;
  enable_dms: boolean;
  enable_new_posts_from_following: boolean;
  enable_email_notifications: boolean;
  email_frequency: EmailFrequency;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<NotificationType, number>;
}

export interface GroupedNotification {
  id: string;
  notification_type: NotificationType;
  notifications: Notification[];
  users: Array<{
    username: string;
    display_name: string;
    avatar_url?: string;
  }>;
  related_post_id?: string;
  post_content?: string;
  is_read: boolean;
  created_at: string;
  count: number;
}

export type NotificationOrGroup = Notification | GroupedNotification;
