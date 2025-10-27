import { query } from "../config/database";

export type NotificationType = "dm" | "like" | "follow" | "reply" | "mention" | "repost";

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
        COUNT(*) FILTER (WHERE notification_type = 'repost') as repost_count
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
      },
    };
  }
}
