import { query } from "../config/database";

export type MessageType = "text" | "image" | "post_share";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: MessageType;
  content: string | null;
  image_id: string | null;
  shared_post_id: string | null;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
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

export interface MessagePaginationParams {
  conversation_id: string;
  limit?: number;
  offset?: number;
  before_message_id?: string; // For cursor-based pagination
}

export class MessageModel {
  /**
   * Create a new message
   */
  static async create(input: CreateMessageInput): Promise<Message> {
    const { conversation_id, sender_id, message_type, content, image_id, shared_post_id } = input;

    // Validation
    if (message_type === "text" && (!content || content.trim().length === 0)) {
      throw new Error("Text messages must have content");
    }
    if (message_type === "image" && !image_id) {
      throw new Error("Image messages must have an image_id");
    }
    if (message_type === "post_share" && !shared_post_id) {
      throw new Error("Post share messages must have a shared_post_id");
    }

    const result = await query(
      `INSERT INTO messages (conversation_id, sender_id, message_type, content, image_id, shared_post_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        conversation_id,
        sender_id,
        message_type,
        content || null,
        image_id || null,
        shared_post_id || null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Get messages for a conversation with pagination
   */
  static async findByConversationId(
    params: MessagePaginationParams,
    recipientId?: string
  ): Promise<MessageWithDetails[]> {
    const { conversation_id, limit = 50, offset = 0, before_message_id } = params;

    let queryText = `
      SELECT
        m.*,
        u.username as sender_username,
        u.display_name as sender_display_name,
        pr.avatar_url as sender_avatar,
        i.url as image_url,
        COUNT(DISTINCT mrs.id) as read_count
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN profiles pr ON u.id = pr.user_id
      LEFT JOIN images i ON m.image_id = i.id
      LEFT JOIN message_read_status mrs ON m.id = mrs.message_id
      WHERE m.conversation_id = $1 AND m.is_deleted = false
    `;

    const queryParams: any[] = [conversation_id];
    let paramIndex = 2;

    // Cursor-based pagination (load messages before a specific message)
    if (before_message_id) {
      const beforeMessage = await this.findById(before_message_id);
      if (beforeMessage) {
        queryText += ` AND m.created_at < $${paramIndex}`;
        queryParams.push(beforeMessage.created_at);
        paramIndex++;
      }
    }

    queryText += `
      GROUP BY m.id, u.id, pr.avatar_url, i.url
      ORDER BY m.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // If recipientId is provided, add is_read_by_recipient flag
    if (recipientId) {
      const messages: MessageWithDetails[] = await Promise.all(
        result.rows.map(async (msg: MessageWithDetails) => {
          const isRead = await this.isReadBy(msg.id, recipientId);
          return {
            ...msg,
            read_count: parseInt(msg.read_count as any, 10),
            is_read_by_recipient: isRead,
          };
        })
      );
      return messages;
    }

    return result.rows.map((msg: MessageWithDetails) => ({
      ...msg,
      read_count: parseInt(msg.read_count as any, 10),
    }));
  }

  /**
   * Get a single message by ID
   */
  static async findById(id: string): Promise<Message | null> {
    const result = await query(
      `SELECT * FROM messages WHERE id = $1 AND is_deleted = false`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Get the latest message in a conversation
   */
  static async findLatestByConversationId(
    conversationId: string
  ): Promise<Message | null> {
    const result = await query(
      `SELECT * FROM messages
       WHERE conversation_id = $1 AND is_deleted = false
       ORDER BY created_at DESC
       LIMIT 1`,
      [conversationId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get unread messages for a user in a conversation
   */
  static async findUnreadByConversationAndUser(
    conversationId: string,
    userId: string
  ): Promise<Message[]> {
    const result = await query(
      `SELECT m.* FROM messages m
       WHERE m.conversation_id = $1
       AND m.sender_id != $2
       AND m.is_deleted = false
       AND NOT EXISTS (
         SELECT 1 FROM message_read_status mrs
         WHERE mrs.message_id = m.id AND mrs.user_id = $2
       )
       ORDER BY m.created_at ASC`,
      [conversationId, userId]
    );
    return result.rows;
  }

  /**
   * Get unread message count for a user in a conversation
   */
  static async getUnreadCount(
    conversationId: string,
    userId: string
  ): Promise<number> {
    const result = await query(
      `SELECT get_unread_count($1, $2) as count`,
      [conversationId, userId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Mark a message as read by a user
   */
  static async markAsRead(messageId: string, userId: string): Promise<void> {
    await query(
      `INSERT INTO message_read_status (message_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (message_id, user_id) DO NOTHING`,
      [messageId, userId]
    );
  }

  /**
   * Mark all messages in a conversation as read by a user
   */
  static async markAllAsRead(
    conversationId: string,
    userId: string
  ): Promise<number> {
    const result = await query(
      `INSERT INTO message_read_status (message_id, user_id)
       SELECT m.id, $2
       FROM messages m
       WHERE m.conversation_id = $1
       AND m.sender_id != $2
       AND m.is_deleted = false
       AND NOT EXISTS (
         SELECT 1 FROM message_read_status mrs
         WHERE mrs.message_id = m.id AND mrs.user_id = $2
       )
       ON CONFLICT (message_id, user_id) DO NOTHING
       RETURNING *`,
      [conversationId, userId]
    );
    return result.rowCount || 0;
  }

  /**
   * Check if a message has been read by a specific user
   */
  static async isReadBy(messageId: string, userId: string): Promise<boolean> {
    const result = await query(
      `SELECT EXISTS(
        SELECT 1 FROM message_read_status
        WHERE message_id = $1 AND user_id = $2
      ) as is_read`,
      [messageId, userId]
    );
    return result.rows[0].is_read;
  }

  /**
   * Soft delete a message
   */
  static async delete(id: string): Promise<boolean> {
    const result = await query(
      `UPDATE messages SET is_deleted = true WHERE id = $1`,
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Delete all messages in a conversation
   */
  static async deleteByConversationId(
    conversationId: string
  ): Promise<number> {
    const result = await query(
      `UPDATE messages SET is_deleted = true WHERE conversation_id = $1`,
      [conversationId]
    );
    return result.rowCount || 0;
  }

  /**
   * Search messages in a conversation
   */
  static async search(
    conversationId: string,
    searchTerm: string,
    limit: number = 20
  ): Promise<MessageWithDetails[]> {
    const result = await query(
      `SELECT * FROM messages_with_details
       WHERE conversation_id = $1
       AND content ILIKE $2
       ORDER BY created_at DESC
       LIMIT $3`,
      [conversationId, `%${searchTerm}%`, limit]
    );
    return result.rows;
  }

  /**
   * Get message statistics for a conversation
   */
  static async getConversationStats(conversationId: string): Promise<{
    total_messages: number;
    text_messages: number;
    image_messages: number;
    post_shares: number;
  }> {
    const result = await query(
      `SELECT
        COUNT(*) as total_messages,
        COUNT(*) FILTER (WHERE message_type = 'text') as text_messages,
        COUNT(*) FILTER (WHERE message_type = 'image') as image_messages,
        COUNT(*) FILTER (WHERE message_type = 'post_share') as post_shares
       FROM messages
       WHERE conversation_id = $1 AND is_deleted = false`,
      [conversationId]
    );

    return {
      total_messages: parseInt(result.rows[0].total_messages, 10),
      text_messages: parseInt(result.rows[0].text_messages, 10),
      image_messages: parseInt(result.rows[0].image_messages, 10),
      post_shares: parseInt(result.rows[0].post_shares, 10),
    };
  }
}
