import { query } from "../config/database";

export interface Bookmark {
  id: string;
  user_id: string;
  post_id: string;
  created_at: Date;
}

export interface CreateBookmarkInput {
  user_id: string;
  post_id: string;
}

export class BookmarkModel {
  // Create a bookmark (bookmark a post)
  static async create(input: CreateBookmarkInput): Promise<Bookmark> {
    const result = await query(
      `INSERT INTO bookmarks (user_id, post_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, post_id) DO NOTHING
       RETURNING *`,
      [input.user_id, input.post_id]
    );
    return result.rows[0];
  }

  // Delete a bookmark (unbookmark a post)
  static async delete(userId: string, postId: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM bookmarks WHERE user_id = $1 AND post_id = $2`,
      [userId, postId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Check if user has bookmarked a post
  static async hasBookmarked(userId: string, postId: string): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM bookmarks WHERE user_id = $1 AND post_id = $2`,
      [userId, postId]
    );
    return result.rows.length > 0;
  }

  // Get all bookmarks for a user
  static async findByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Bookmark[]> {
    const result = await query(
      `SELECT * FROM bookmarks
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  // Get posts bookmarked by a user (with post details)
  static async getPostsBookmarkedByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    const result = await query(
      `SELECT p.*, b.created_at as bookmarked_at
       FROM bookmarks b
       JOIN posts_with_stats p ON b.post_id = p.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  // Get bookmark count for a user
  static async getCountByUser(userId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM bookmarks WHERE user_id = $1`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}
