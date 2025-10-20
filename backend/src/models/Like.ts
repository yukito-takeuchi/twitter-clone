import { query } from "../config/database";

export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: Date;
}

export interface CreateLikeInput {
  user_id: string;
  post_id: string;
}

export class LikeModel {
  // Create a like (like a post)
  static async create(input: CreateLikeInput): Promise<Like> {
    const result = await query(
      `INSERT INTO likes (user_id, post_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, post_id) DO NOTHING
       RETURNING *`,
      [input.user_id, input.post_id]
    );
    return result.rows[0];
  }

  // Delete a like (unlike a post)
  static async delete(userId: string, postId: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM likes WHERE user_id = $1 AND post_id = $2`,
      [userId, postId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Check if user has liked a post
  static async hasLiked(userId: string, postId: string): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2`,
      [userId, postId]
    );
    return result.rows.length > 0;
  }

  // Get like count for a post
  static async getCountByPost(postId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM likes WHERE post_id = $1`,
      [postId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  // Get all likes for a post
  static async findByPost(
    postId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Like[]> {
    const result = await query(
      `SELECT * FROM likes
       WHERE post_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [postId, limit, offset]
    );
    return result.rows;
  }

  // Get all posts liked by a user
  static async findByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Like[]> {
    const result = await query(
      `SELECT * FROM likes
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  // Get users who liked a post (with user info)
  static async getUsersWhoLiked(
    postId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    const result = await query(
      `SELECT u.id, u.username, u.display_name, p.avatar_url, l.created_at
       FROM likes l
       JOIN users u ON l.user_id = u.id
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE l.post_id = $1
       ORDER BY l.created_at DESC
       LIMIT $2 OFFSET $3`,
      [postId, limit, offset]
    );
    return result.rows;
  }

  // Get posts liked by a user (with post details)
  static async getPostsLikedByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    const result = await query(
      `SELECT p.*, l.created_at as liked_at
       FROM likes l
       JOIN posts_with_stats p ON l.post_id = p.id
       WHERE l.user_id = $1
       ORDER BY l.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }
}
