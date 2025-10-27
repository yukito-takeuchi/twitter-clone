import { query } from "../config/database";

export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_at: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ConversationWithDetails extends Conversation {
  participant1_username: string;
  participant1_display_name: string;
  participant1_avatar: string | null;
  participant2_username: string;
  participant2_display_name: string;
  participant2_avatar: string | null;
  last_message_content: string | null;
  last_message_type: "text" | "image" | "post_share" | null;
  last_message_sender_id: string | null;
  unread_count?: number;
}

export interface CreateConversationInput {
  user1_id: string;
  user2_id: string;
}

export class ConversationModel {
  /**
   * Find or create a conversation between two users
   * Automatically orders user IDs to maintain consistency
   */
  static async findOrCreate(
    user1_id: string,
    user2_id: string
  ): Promise<Conversation> {
    // Ensure participant1_id < participant2_id
    const [participant1_id, participant2_id] =
      user1_id < user2_id ? [user1_id, user2_id] : [user2_id, user1_id];

    // Try to find existing conversation
    const existing = await query(
      `SELECT * FROM conversations
       WHERE participant1_id = $1 AND participant2_id = $2 AND is_active = true`,
      [participant1_id, participant2_id]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    // Create new conversation
    const result = await query(
      `INSERT INTO conversations (participant1_id, participant2_id)
       VALUES ($1, $2)
       RETURNING *`,
      [participant1_id, participant2_id]
    );

    return result.rows[0];
  }

  /**
   * Get all conversations for a user with details
   */
  static async findByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ConversationWithDetails[]> {
    const result = await query(
      `SELECT * FROM conversations_with_details
       WHERE (participant1_id = $1 OR participant2_id = $1)
       ORDER BY last_message_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Add unread count for each conversation
    const conversations: ConversationWithDetails[] = await Promise.all(
      result.rows.map(async (conv: ConversationWithDetails) => {
        const unreadResult = await query(
          `SELECT get_unread_count($1, $2) as unread_count`,
          [conv.id, userId]
        );
        return {
          ...conv,
          unread_count: parseInt(unreadResult.rows[0].unread_count, 10),
        };
      })
    );

    return conversations;
  }

  /**
   * Get a specific conversation by ID
   */
  static async findById(id: string): Promise<Conversation | null> {
    const result = await query(
      `SELECT * FROM conversations WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Get conversation between two specific users
   */
  static async findByParticipants(
    user1_id: string,
    user2_id: string
  ): Promise<Conversation | null> {
    const [participant1_id, participant2_id] =
      user1_id < user2_id ? [user1_id, user2_id] : [user2_id, user1_id];

    const result = await query(
      `SELECT * FROM conversations
       WHERE participant1_id = $1 AND participant2_id = $2 AND is_active = true`,
      [participant1_id, participant2_id]
    );

    return result.rows[0] || null;
  }

  /**
   * Check if a user is a participant in a conversation
   */
  static async isParticipant(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    const result = await query(
      `SELECT EXISTS(
        SELECT 1 FROM conversations
        WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)
      ) as is_participant`,
      [conversationId, userId]
    );

    return result.rows[0].is_participant;
  }

  /**
   * Get the other participant in a conversation
   */
  static async getOtherParticipant(
    conversationId: string,
    userId: string
  ): Promise<string | null> {
    const conversation = await this.findById(conversationId);
    if (!conversation) return null;

    return conversation.participant1_id === userId
      ? conversation.participant2_id
      : conversation.participant1_id;
  }

  /**
   * Soft delete a conversation
   */
  static async delete(id: string): Promise<boolean> {
    const result = await query(
      `UPDATE conversations SET is_active = false WHERE id = $1`,
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Check if two users are mutual followers
   */
  static async areMutualFollowers(
    user1_id: string,
    user2_id: string
  ): Promise<boolean> {
    const result = await query(
      `SELECT are_mutual_followers($1, $2) as is_mutual`,
      [user1_id, user2_id]
    );
    return result.rows[0].is_mutual;
  }

  /**
   * Get total unread message count across all conversations for a user
   */
  static async getTotalUnreadCount(userId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as total_unread
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE (c.participant1_id = $1 OR c.participant2_id = $1)
       AND m.sender_id != $1
       AND m.is_deleted = false
       AND c.is_active = true
       AND NOT EXISTS (
         SELECT 1 FROM message_read_status mrs
         WHERE mrs.message_id = m.id AND mrs.user_id = $1
       )`,
      [userId]
    );

    return parseInt(result.rows[0].total_unread, 10);
  }

  /**
   * Update last_message_at (automatically handled by trigger, but useful for manual updates)
   */
  static async updateLastMessageAt(id: string): Promise<void> {
    await query(
      `UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );
  }
}
