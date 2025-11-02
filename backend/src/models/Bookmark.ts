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
      `SELECT
        p.*,
        b.created_at as bookmarked_at,
        true as is_bookmarked_by_current_user,
        EXISTS(
          SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1
        ) as is_liked_by_current_user,
        EXISTS(
          SELECT 1 FROM reposts WHERE post_id = p.id AND user_id = $1
        ) as is_reposted_by_current_user,
        -- Quoted post information
        qp.id as quoted_post_id_info,
        qp.user_id as quoted_post_user_id,
        qu.username as quoted_post_username,
        qu.display_name as quoted_post_display_name,
        qpr.avatar_url as quoted_post_avatar_url,
        qp.content as quoted_post_content,
        qp.image_url as quoted_post_image_url,
        qp.video_url as quoted_post_video_url,
        qp.video_thumbnail_url as quoted_post_video_thumbnail_url,
        qp.video_duration as quoted_post_video_duration,
        qp.created_at as quoted_post_created_at
       FROM bookmarks b
       JOIN posts_with_stats p ON b.post_id = p.id
       LEFT JOIN posts qp ON p.quoted_post_id = qp.id AND qp.is_deleted = false
       LEFT JOIN users qu ON qp.user_id = qu.id
       LEFT JOIN profiles qpr ON qu.id = qpr.user_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Format quoted posts
    return result.rows.map((row) => {
      const post: any = { ...row };
      if (row.quoted_post_id_info) {
        post.quoted_post = {
          id: row.quoted_post_id_info,
          user_id: row.quoted_post_user_id,
          username: row.quoted_post_username,
          display_name: row.quoted_post_display_name,
          avatar_url: row.quoted_post_avatar_url,
          content: row.quoted_post_content,
          image_url: row.quoted_post_image_url,
          video_url: row.quoted_post_video_url,
          video_thumbnail_url: row.quoted_post_video_thumbnail_url,
          video_duration: row.quoted_post_video_duration,
          created_at: row.quoted_post_created_at,
        };
      }
      return post;
    });
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
