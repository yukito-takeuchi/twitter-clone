import { query } from "../config/database";

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
  created_at: Date;
  updated_at: Date;
}

export interface UpdateNotificationSettingsInput {
  enable_likes?: boolean;
  enable_replies?: boolean;
  enable_follows?: boolean;
  enable_reposts?: boolean;
  enable_quotes?: boolean;
  enable_dms?: boolean;
  enable_new_posts_from_following?: boolean;
  enable_email_notifications?: boolean;
  email_frequency?: EmailFrequency;
}

export class NotificationSettingsModel {
  /**
   * Get notification settings for a user
   * Creates default settings if not exists
   */
  static async findByUserId(userId: string): Promise<NotificationSettings> {
    const result = await query(
      `SELECT * FROM notification_settings WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Create default settings if not exists
      return this.createDefault(userId);
    }

    return result.rows[0];
  }

  /**
   * Create default notification settings for a user
   */
  static async createDefault(userId: string): Promise<NotificationSettings> {
    const result = await query(
      `INSERT INTO notification_settings (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE
       SET user_id = EXCLUDED.user_id
       RETURNING *`,
      [userId]
    );

    return result.rows[0];
  }

  /**
   * Update notification settings for a user
   */
  static async update(
    userId: string,
    updates: UpdateNotificationSettingsInput
  ): Promise<NotificationSettings> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic update query
    if (updates.enable_likes !== undefined) {
      fields.push(`enable_likes = $${paramCount++}`);
      values.push(updates.enable_likes);
    }
    if (updates.enable_replies !== undefined) {
      fields.push(`enable_replies = $${paramCount++}`);
      values.push(updates.enable_replies);
    }
    if (updates.enable_follows !== undefined) {
      fields.push(`enable_follows = $${paramCount++}`);
      values.push(updates.enable_follows);
    }
    if (updates.enable_reposts !== undefined) {
      fields.push(`enable_reposts = $${paramCount++}`);
      values.push(updates.enable_reposts);
    }
    if (updates.enable_quotes !== undefined) {
      fields.push(`enable_quotes = $${paramCount++}`);
      values.push(updates.enable_quotes);
    }
    if (updates.enable_dms !== undefined) {
      fields.push(`enable_dms = $${paramCount++}`);
      values.push(updates.enable_dms);
    }
    if (updates.enable_new_posts_from_following !== undefined) {
      fields.push(`enable_new_posts_from_following = $${paramCount++}`);
      values.push(updates.enable_new_posts_from_following);
    }
    if (updates.enable_email_notifications !== undefined) {
      fields.push(`enable_email_notifications = $${paramCount++}`);
      values.push(updates.enable_email_notifications);
    }
    if (updates.email_frequency !== undefined) {
      fields.push(`email_frequency = $${paramCount++}`);
      values.push(updates.email_frequency);
    }

    // Always update updated_at
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(userId);

    const result = await query(
      `UPDATE notification_settings
       SET ${fields.join(", ")}
       WHERE user_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      // If settings don't exist, create default and then update
      await this.createDefault(userId);
      return this.update(userId, updates);
    }

    return result.rows[0];
  }

  /**
   * Check if a specific notification type is enabled for a user
   */
  static async isNotificationEnabled(
    userId: string,
    notificationType: keyof Omit<NotificationSettings, "id" | "user_id" | "created_at" | "updated_at" | "enable_email_notifications" | "email_frequency">
  ): Promise<boolean> {
    const settings = await this.findByUserId(userId);
    return settings[notificationType] as boolean;
  }

  /**
   * Delete notification settings for a user
   */
  static async delete(userId: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM notification_settings WHERE user_id = $1`,
      [userId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}
