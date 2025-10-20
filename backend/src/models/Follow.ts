import { query } from "../config/database";

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: Date;
}

export interface CreateFollowInput {
  follower_id: string;
  following_id: string;
}

export class FollowModel {
  // Create a follow relationship
  static async create(input: CreateFollowInput): Promise<Follow> {
    const result = await query(
      `INSERT INTO follows (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT (follower_id, following_id) DO NOTHING
       RETURNING *`,
      [input.follower_id, input.following_id]
    );
    return result.rows[0];
  }

  // Delete a follow relationship (unfollow)
  static async delete(followerId: string, followingId: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`,
      [followerId, followingId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Check if user is following another user
  static async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2`,
      [followerId, followingId]
    );
    return result.rows.length > 0;
  }

  // Get follower count for a user
  static async getFollowerCount(userId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM follows WHERE following_id = $1`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  // Get following count for a user
  static async getFollowingCount(userId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM follows WHERE follower_id = $1`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  // Get followers of a user (with user info)
  static async getFollowers(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    const result = await query(
      `SELECT u.id, u.username, u.display_name, p.avatar_url, p.bio, f.created_at
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  // Get users that a user is following (with user info)
  static async getFollowing(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    const result = await query(
      `SELECT u.id, u.username, u.display_name, p.avatar_url, p.bio, f.created_at
       FROM follows f
       JOIN users u ON f.following_id = u.id
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  // Get mutual follows (users who follow each other)
  static async getMutualFollows(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    const result = await query(
      `SELECT u.id, u.username, u.display_name, p.avatar_url, p.bio
       FROM follows f1
       JOIN follows f2 ON f1.following_id = f2.follower_id AND f1.follower_id = f2.following_id
       JOIN users u ON f1.following_id = u.id
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE f1.follower_id = $1
       ORDER BY f1.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  // Get suggested users to follow (users not followed yet with high follower count)
  static async getSuggestions(
    userId: string,
    limit: number = 10
  ): Promise<any[]> {
    const result = await query(
      `SELECT u.id, u.username, u.display_name, p.avatar_url, p.bio,
              COUNT(f.id) as follower_count
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       LEFT JOIN follows f ON u.id = f.following_id
       WHERE u.id != $1
       AND u.id NOT IN (
         SELECT following_id FROM follows WHERE follower_id = $1
       )
       AND u.is_active = true
       GROUP BY u.id, p.id
       ORDER BY follower_count DESC, u.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }
}
