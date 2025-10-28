import { query } from "../config/database";
import { NotificationSettingsModel } from "./NotificationSettings";

export type NotificationType = "dm" | "like" | "follow" | "reply" | "mention" | "repost" | "quote" | "new_post";

export interface Notification {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  content: Record<string, any>; // JSONB content
  related_user_id: string | null;
  related_post_id: string | null;
  related_message_id: string | null;
  is_read: boolean;
  is_sent_email: boolean;
  read_at: Date | null;
  created_at: Date;
}

export interface CreateNotificationInput {
  user_id: string;
  notification_type: NotificationType;
  content: Record<string, any>;
  related_user_id?: string;
  related_post_id?: string;
  related_message_id?: string;
}

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

export class NotificationModel {
  /**
   * Create a new notification
   */
  static async create(input: CreateNotificationInput): Promise<Notification> {
    const {
      user_id,
      notification_type,
      content,
      related_user_id,
      related_post_id,
      related_message_id,
    } = input;

    const result = await query(
      `INSERT INTO notifications (user_id, notification_type, content, related_user_id, related_post_id, related_message_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        user_id,
        notification_type,
        JSON.stringify(content),
        related_user_id || null,
        related_post_id || null,
        related_message_id || null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Get all notifications for a user
   */
  static async findByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    const result = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get unread notifications for a user
   */
  static async findUnreadByUserId(
    userId: string,
    limit: number = 50
  ): Promise<Notification[]> {
    const result = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1 AND is_read = false
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM notifications
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Get notifications by type
   */
  static async findByType(
    userId: string,
    notificationType: NotificationType,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    const result = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1 AND notification_type = $2
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, notificationType, limit, offset]
    );
    return result.rows;
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(id: string): Promise<boolean> {
    const result = await query(
      `UPDATE notifications
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND is_read = false
       RETURNING *`,
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<number> {
    const result = await query(
      `UPDATE notifications
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return result.rowCount || 0;
  }

  /**
   * Mark notification as email sent
   */
  static async markEmailSent(id: string): Promise<boolean> {
    const result = await query(
      `UPDATE notifications
       SET is_sent_email = true
       WHERE id = $1`,
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Get notifications that need email sending
   */
  static async findPendingEmailNotifications(
    limit: number = 100
  ): Promise<Notification[]> {
    const result = await query(
      `SELECT * FROM notifications
       WHERE is_sent_email = false
       AND created_at > NOW() - INTERVAL '1 hour'
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Delete a notification
   */
  static async delete(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM notifications WHERE id = $1`, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteByUserId(userId: string): Promise<number> {
    const result = await query(`DELETE FROM notifications WHERE user_id = $1`, [
      userId,
    ]);
    return result.rowCount || 0;
  }

  /**
   * Delete old read notifications (cleanup)
   */
  static async deleteOldReadNotifications(daysOld: number = 30): Promise<number> {
    const result = await query(
      `DELETE FROM notifications
       WHERE is_read = true
       AND read_at < NOW() - INTERVAL '${daysOld} days'`,
      []
    );
    return result.rowCount || 0;
  }

  /**
   * Create a DM notification
   */
  static async createDMNotification(
    recipientId: string,
    senderId: string,
    messagePreview: string,
    conversationId: string,
    messageId: string
  ): Promise<Notification> {
    // Get sender info
    const senderResult = await query(
      `SELECT username, display_name FROM users WHERE id = $1`,
      [senderId]
    );

    if (senderResult.rows.length === 0) {
      throw new Error("Sender not found");
    }

    const sender = senderResult.rows[0];

    const content: NotificationContentDM = {
      sender_username: sender.username,
      sender_display_name: sender.display_name,
      message_preview: messagePreview.substring(0, 100), // Limit preview length
      conversation_id: conversationId,
    };

    return this.create({
      user_id: recipientId,
      notification_type: "dm",
      content,
      related_user_id: senderId,
      related_message_id: messageId,
    });
  }

  /**
   * Get notification statistics for a user
   */
  static async getUserNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    by_type: Record<NotificationType, number>;
  }> {
    const result = await query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_read = false) as unread,
        COUNT(*) FILTER (WHERE notification_type = 'dm') as dm_count,
        COUNT(*) FILTER (WHERE notification_type = 'like') as like_count,
        COUNT(*) FILTER (WHERE notification_type = 'follow') as follow_count,
        COUNT(*) FILTER (WHERE notification_type = 'reply') as reply_count,
        COUNT(*) FILTER (WHERE notification_type = 'mention') as mention_count,
        COUNT(*) FILTER (WHERE notification_type = 'repost') as repost_count,
        COUNT(*) FILTER (WHERE notification_type = 'quote') as quote_count,
        COUNT(*) FILTER (WHERE notification_type = 'new_post') as new_post_count
       FROM notifications
       WHERE user_id = $1`,
      [userId]
    );

    const row = result.rows[0];

    return {
      total: parseInt(row.total, 10),
      unread: parseInt(row.unread, 10),
      by_type: {
        dm: parseInt(row.dm_count, 10),
        like: parseInt(row.like_count, 10),
        follow: parseInt(row.follow_count, 10),
        reply: parseInt(row.reply_count, 10),
        mention: parseInt(row.mention_count, 10),
        repost: parseInt(row.repost_count, 10),
        quote: parseInt(row.quote_count, 10),
        new_post: parseInt(row.new_post_count, 10),
      },
    };
  }

  /**
   * Create a like notification
   */
  static async createLikeNotification(
    postOwnerId: string,
    likerId: string,
    postId: string
  ): Promise<Notification | null> {
    // Don't notify if liking own post
    if (postOwnerId === likerId) {
      return null;
    }

    // Check if notification is enabled
    const settings = await NotificationSettingsModel.findByUserId(postOwnerId);
    if (!settings.enable_likes) {
      return null;
    }

    // Get liker info and post content
    const result = await query(
      `SELECT
        u.username as liker_username,
        u.display_name as liker_display_name,
        p.content as post_content
       FROM users u, posts p
       WHERE u.id = $1 AND p.id = $2`,
      [likerId, postId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const { liker_username, liker_display_name, post_content } = result.rows[0];

    const content: NotificationContentLike = {
      liker_username,
      liker_display_name,
      post_content: post_content.substring(0, 100),
    };

    return this.create({
      user_id: postOwnerId,
      notification_type: "like",
      content,
      related_user_id: likerId,
      related_post_id: postId,
    });
  }

  /**
   * Create a reply notification
   */
  static async createReplyNotification(
    originalPostOwnerId: string,
    replierId: string,
    replyPostId: string,
    originalPostId: string
  ): Promise<Notification | null> {
    // Don't notify if replying to own post
    if (originalPostOwnerId === replierId) {
      return null;
    }

    // Check if notification is enabled
    const settings = await NotificationSettingsModel.findByUserId(originalPostOwnerId);
    if (!settings.enable_replies) {
      return null;
    }

    // Get replier info and post contents
    const result = await query(
      `SELECT
        u.username as replier_username,
        u.display_name as replier_display_name,
        p1.content as reply_content,
        p2.content as original_content
       FROM users u, posts p1, posts p2
       WHERE u.id = $1 AND p1.id = $2 AND p2.id = $3`,
      [replierId, replyPostId, originalPostId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const { replier_username, replier_display_name, reply_content, original_content } = result.rows[0];

    const content: NotificationContentReply = {
      replier_username,
      replier_display_name,
      reply_content: reply_content.substring(0, 100),
      original_post_content: original_content.substring(0, 100),
    };

    return this.create({
      user_id: originalPostOwnerId,
      notification_type: "reply",
      content,
      related_user_id: replierId,
      related_post_id: originalPostId, // 元の投稿IDを保存してグループ化を可能にする
    });
  }

  /**
   * Create a follow notification
   */
  static async createFollowNotification(
    followedUserId: string,
    followerId: string
  ): Promise<Notification | null> {
    // Check if notification is enabled
    const settings = await NotificationSettingsModel.findByUserId(followedUserId);
    if (!settings.enable_follows) {
      return null;
    }

    // Get follower info
    const result = await query(
      `SELECT username, display_name FROM users WHERE id = $1`,
      [followerId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const { username, display_name } = result.rows[0];

    const content: NotificationContentFollow = {
      follower_username: username,
      follower_display_name: display_name,
    };

    return this.create({
      user_id: followedUserId,
      notification_type: "follow",
      content,
      related_user_id: followerId,
    });
  }

  /**
   * Create a quote (quote tweet) notification
   */
  static async createQuoteNotification(
    originalPostOwnerId: string,
    quoterId: string,
    quotePostId: string,
    originalPostId: string
  ): Promise<Notification | null> {
    // Don't notify if quoting own post
    if (originalPostOwnerId === quoterId) {
      return null;
    }

    // Check if notification is enabled
    const settings = await NotificationSettingsModel.findByUserId(originalPostOwnerId);
    if (!settings.enable_quotes) {
      return null;
    }

    // Get quoter info and post contents
    const result = await query(
      `SELECT
        u.username as quoter_username,
        u.display_name as quoter_display_name,
        p1.content as quote_content,
        p2.content as original_content
       FROM users u, posts p1, posts p2
       WHERE u.id = $1 AND p1.id = $2 AND p2.id = $3`,
      [quoterId, quotePostId, originalPostId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const { quoter_username, quoter_display_name, quote_content, original_content } = result.rows[0];

    const content: NotificationContentQuote = {
      quoter_username,
      quoter_display_name,
      quote_content: quote_content.substring(0, 100),
      original_post_content: original_content.substring(0, 100),
    };

    return this.create({
      user_id: originalPostOwnerId,
      notification_type: "quote",
      content,
      related_user_id: quoterId,
      related_post_id: originalPostId, // 元の投稿IDを保存してグループ化を可能にする
    });
  }

  /**
   * Create new post notifications for followers
   */
  static async createNewPostNotifications(
    posterId: string,
    postId: string
  ): Promise<void> {
    // Get post info
    const postResult = await query(
      `SELECT content FROM posts WHERE id = $1`,
      [postId]
    );

    if (postResult.rows.length === 0) {
      return;
    }

    const postContent = postResult.rows[0].content;

    // Get poster info
    const posterResult = await query(
      `SELECT username, display_name FROM users WHERE id = $1`,
      [posterId]
    );

    if (posterResult.rows.length === 0) {
      return;
    }

    const { username, display_name } = posterResult.rows[0];

    // Get followers who have this notification enabled
    const followersResult = await query(
      `SELECT DISTINCT f.follower_id
       FROM follows f
       JOIN notification_settings ns ON f.follower_id = ns.user_id
       WHERE f.following_id = $1
       AND ns.enable_new_posts_from_following = true`,
      [posterId]
    );

    // Create notifications for each follower
    const notificationPromises = followersResult.rows.map((row) => {
      const content: NotificationContentNewPost = {
        poster_username: username,
        poster_display_name: display_name,
        post_content: postContent.substring(0, 100),
      };

      return this.create({
        user_id: row.follower_id,
        notification_type: "new_post",
        content,
        related_user_id: posterId,
        related_post_id: postId,
      });
    });

    await Promise.all(notificationPromises);
  }
}
