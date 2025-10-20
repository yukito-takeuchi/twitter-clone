import { query } from "../config/database";

export interface Image {
  id: string;
  user_id: string;
  post_id: string | null;
  url: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  storage_type: "local" | "gcs";
  created_at: Date;
}

export interface CreateImageInput {
  user_id: string;
  post_id?: string;
  url: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  storage_type?: "local" | "gcs";
}

export class ImageModel {
  // Create a new image record
  static async create(input: CreateImageInput): Promise<Image> {
    const result = await query(
      `INSERT INTO images (user_id, post_id, url, file_name, file_size, mime_type, width, height, storage_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        input.user_id,
        input.post_id || null,
        input.url,
        input.file_name || null,
        input.file_size || null,
        input.mime_type || null,
        input.width || null,
        input.height || null,
        input.storage_type || "local",
      ]
    );
    return result.rows[0];
  }

  // Find image by ID
  static async findById(id: string): Promise<Image | null> {
    const result = await query(`SELECT * FROM images WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  // Find images by user ID
  static async findByUserId(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Image[]> {
    const result = await query(
      `SELECT * FROM images
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  // Find images by post ID
  static async findByPostId(postId: string): Promise<Image[]> {
    const result = await query(
      `SELECT * FROM images
       WHERE post_id = $1
       ORDER BY created_at ASC`,
      [postId]
    );
    return result.rows;
  }

  // Delete image
  static async delete(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM images WHERE id = $1`, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Delete all images for a post
  static async deleteByPostId(postId: string): Promise<number> {
    const result = await query(`DELETE FROM images WHERE post_id = $1`, [postId]);
    return result.rowCount || 0;
  }

  // Get total storage size for a user
  static async getTotalStorageSize(userId: string): Promise<number> {
    const result = await query(
      `SELECT COALESCE(SUM(file_size), 0) as total_size
       FROM images
       WHERE user_id = $1`,
      [userId]
    );
    return parseInt(result.rows[0].total_size, 10);
  }

  // Get image count for a user
  static async getCountByUser(userId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM images WHERE user_id = $1`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  // Get recent images (for gallery)
  static async getRecent(limit: number = 20, offset: number = 0): Promise<Image[]> {
    const result = await query(
      `SELECT * FROM images
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }
}
