import { query } from "../config/database";

export interface Video {
  id: string;
  user_id: string;
  post_id: string | null;
  url: string;
  thumbnail_url: string | null;
  file_name: string;
  file_size: number;
  mime_type: string;
  duration: number | null; // Duration in seconds
  width: number | null;
  height: number | null;
  storage_type: "local" | "gcs";
  created_at: Date;
}

export interface CreateVideoInput {
  user_id: string;
  post_id?: string;
  url: string;
  thumbnail_url?: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  duration?: number;
  width?: number;
  height?: number;
  storage_type?: "local" | "gcs";
}

export class VideoModel {
  // Create a new video record
  static async create(input: CreateVideoInput): Promise<Video> {
    const result = await query(
      `INSERT INTO videos (user_id, post_id, url, thumbnail_url, file_name, file_size, mime_type, duration, width, height, storage_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        input.user_id,
        input.post_id || null,
        input.url,
        input.thumbnail_url || null,
        input.file_name,
        input.file_size,
        input.mime_type,
        input.duration || null,
        input.width || null,
        input.height || null,
        input.storage_type || "local",
      ]
    );
    return result.rows[0];
  }

  // Find video by ID
  static async findById(id: string): Promise<Video | null> {
    const result = await query(`SELECT * FROM videos WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  // Find videos by user ID
  static async findByUserId(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Video[]> {
    const result = await query(
      `SELECT * FROM videos
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  // Find videos by post ID
  static async findByPostId(postId: string): Promise<Video[]> {
    const result = await query(
      `SELECT * FROM videos
       WHERE post_id = $1
       ORDER BY created_at ASC`,
      [postId]
    );
    return result.rows;
  }

  // Delete video
  static async delete(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM videos WHERE id = $1`, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Delete all videos for a post
  static async deleteByPostId(postId: string): Promise<number> {
    const result = await query(`DELETE FROM videos WHERE post_id = $1`, [postId]);
    return result.rowCount || 0;
  }

  // Get total storage size for a user
  static async getTotalStorageSize(userId: string): Promise<number> {
    const result = await query(
      `SELECT COALESCE(SUM(file_size), 0) as total_size
       FROM videos
       WHERE user_id = $1`,
      [userId]
    );
    return parseInt(result.rows[0].total_size, 10);
  }

  // Get video count for a user
  static async getCountByUser(userId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM videos WHERE user_id = $1`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  // Get recent videos
  static async getRecent(limit: number = 20, offset: number = 0): Promise<Video[]> {
    const result = await query(
      `SELECT * FROM videos
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  // Update post_id for a video
  static async updatePostId(id: string, postId: string): Promise<Video | null> {
    const result = await query(
      `UPDATE videos SET post_id = $1 WHERE id = $2 RETURNING *`,
      [postId, id]
    );
    return result.rows[0] || null;
  }
}
