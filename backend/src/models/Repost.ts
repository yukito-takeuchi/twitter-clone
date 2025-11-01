import { query } from "../config/database";

export interface Repost {
  id: string;
  user_id: string;
  post_id: string;
  repost_post_id: string | null;
  created_at: Date;
}

export interface CreateRepostInput {
  user_id: string;
  post_id: string;
}

export class RepostModel {
  // Create a repost
  static async create(input: CreateRepostInput): Promise<Repost> {
    const { user_id, post_id } = input;

    // Start transaction
    const client = await query("BEGIN");

    try {
      // 1. Create a post entry with repost_of_id
      const postResult = await query(
        `INSERT INTO posts (user_id, content, repost_of_id)
         VALUES ($1, '', $2)
         RETURNING *`,
        [user_id, post_id]
      );

      const repostPostId = postResult.rows[0].id;

      // 2. Create a repost relationship record
      const repostResult = await query(
        `INSERT INTO reposts (user_id, post_id, repost_post_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, post_id) DO NOTHING
         RETURNING *`,
        [user_id, post_id, repostPostId]
      );

      await query("COMMIT");

      // If conflict occurred (already reposted), clean up the post we just created
      if (repostResult.rows.length === 0) {
        await query("DELETE FROM posts WHERE id = $1", [repostPostId]);
        throw new Error("Post already reposted");
      }

      return repostResult.rows[0];
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  }

  // Delete a repost (unrepost)
  static async delete(userId: string, postId: string): Promise<boolean> {
    // Start transaction
    const client = await query("BEGIN");

    try {
      // 1. Get repost_post_id
      const repostResult = await query(
        `SELECT repost_post_id FROM reposts WHERE user_id = $1 AND post_id = $2`,
        [userId, postId]
      );

      if (repostResult.rows.length === 0) {
        await query("ROLLBACK");
        return false;
      }

      const repostPostId = repostResult.rows[0].repost_post_id;

      // 2. Delete the repost relationship
      await query(
        `DELETE FROM reposts WHERE user_id = $1 AND post_id = $2`,
        [userId, postId]
      );

      // 3. Soft delete the post entry (set is_deleted = true)
      if (repostPostId) {
        await query(
          `UPDATE posts SET is_deleted = true WHERE id = $1`,
          [repostPostId]
        );
      }

      await query("COMMIT");
      return true;
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  }

  // Check if user has reposted a post
  static async hasReposted(userId: string, postId: string): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM reposts WHERE user_id = $1 AND post_id = $2`,
      [userId, postId]
    );
    return result.rows.length > 0;
  }

  // Get repost count for a post
  static async getCountByPost(postId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM reposts WHERE post_id = $1`,
      [postId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  // Get all reposts by a user
  static async findByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Repost[]> {
    const result = await query(
      `SELECT * FROM reposts
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  // Get posts reposted by a user (with post details)
  static async getPostsRepostedByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    currentUserId?: string
  ): Promise<any[]> {
    const result = await query(
      `SELECT
        p.*,
        r.created_at as reposted_at,
        r.user_id as reposted_by_user_id,
        ru.username as reposted_by_username,
        ru.display_name as reposted_by_display_name,
        rp.avatar_url as reposted_by_avatar_url,
        true as is_repost,
        CASE
          WHEN $4::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $4
          )
          ELSE false
        END as is_liked_by_current_user,
        CASE
          WHEN $4::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = $4
          )
          ELSE false
        END as is_bookmarked_by_current_user,
        CASE
          WHEN $4::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM reposts WHERE post_id = p.id AND user_id = $4
          )
          ELSE false
        END as is_reposted_by_current_user,
        -- Quoted post information
        qp.id as quoted_post_id_info,
        qp.user_id as quoted_post_user_id,
        qu.username as quoted_post_username,
        qu.display_name as quoted_post_display_name,
        qpr.avatar_url as quoted_post_avatar_url,
        qp.content as quoted_post_content,
        qp.image_url as quoted_post_image_url,
        qp.created_at as quoted_post_created_at
       FROM reposts r
       JOIN posts_with_stats p ON r.post_id = p.id
       JOIN users ru ON r.user_id = ru.id
       LEFT JOIN profiles rp ON ru.id = rp.user_id
       LEFT JOIN posts qp ON p.quoted_post_id = qp.id AND qp.is_deleted = false
       LEFT JOIN users qu ON qp.user_id = qu.id
       LEFT JOIN profiles qpr ON qu.id = qpr.user_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset, currentUserId || null]
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
          created_at: row.quoted_post_created_at,
        };
      }
      return post;
    });
  }

  // Get users who reposted a post (with user info)
  static async getUsersWhoReposted(
    postId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    const result = await query(
      `SELECT u.id, u.username, u.display_name, p.avatar_url, r.created_at
       FROM reposts r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE r.post_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [postId, limit, offset]
    );
    return result.rows;
  }

  // Pin a repost to user's profile
  static async pinRepost(userId: string, postId: string): Promise<boolean> {
    try {
      // Start transaction
      await query("BEGIN");

      // Verify repost exists and belongs to user
      const repostCheck = await query(
        `SELECT user_id FROM reposts WHERE user_id = $1 AND post_id = $2`,
        [userId, postId]
      );

      if (repostCheck.rows.length === 0) {
        await query("ROLLBACK");
        return false;
      }

      // Unpin any existing pinned post for this user
      await query(
        `UPDATE posts SET is_pinned = false, pinned_at = NULL WHERE user_id = $1 AND is_pinned = true`,
        [userId]
      );

      // Unpin any existing pinned repost for this user
      await query(
        `UPDATE reposts SET is_pinned = false, pinned_at = NULL WHERE user_id = $1 AND is_pinned = true`,
        [userId]
      );

      // Pin the specified repost
      const result = await query(
        `UPDATE reposts SET is_pinned = true, pinned_at = NOW() WHERE user_id = $1 AND post_id = $2`,
        [userId, postId]
      );

      await query("COMMIT");
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  }

  // Unpin a repost from user's profile
  static async unpinRepost(userId: string, postId: string): Promise<boolean> {
    const result = await query(
      `UPDATE reposts SET is_pinned = false, pinned_at = NULL WHERE user_id = $1 AND post_id = $2`,
      [userId, postId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Get pinned repost for a user (returns the reposted post with repost metadata)
  static async getPinnedRepost(userId: string, currentUserId?: string): Promise<any | null> {
    const result = await query(
      `SELECT
        p.*,
        r.created_at as reposted_at,
        r.user_id as reposted_by_user_id,
        r.is_pinned,
        r.pinned_at,
        ru.username as reposted_by_username,
        ru.display_name as reposted_by_display_name,
        rp.avatar_url as reposted_by_avatar_url,
        true as is_repost,
        CASE
          WHEN $2::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $2
          )
          ELSE false
        END as is_liked_by_current_user,
        CASE
          WHEN $2::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = $2
          )
          ELSE false
        END as is_bookmarked_by_current_user,
        CASE
          WHEN $2::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM reposts WHERE post_id = p.id AND user_id = $2
          )
          ELSE false
        END as is_reposted_by_current_user,
        -- Quoted post information
        qp.id as quoted_post_id_info,
        qp.user_id as quoted_post_user_id,
        qu.username as quoted_post_username,
        qu.display_name as quoted_post_display_name,
        qpr.avatar_url as quoted_post_avatar_url,
        qp.content as quoted_post_content,
        qp.image_url as quoted_post_image_url,
        qp.created_at as quoted_post_created_at
       FROM reposts r
       JOIN posts_with_stats p ON r.post_id = p.id
       JOIN users ru ON r.user_id = ru.id
       LEFT JOIN profiles rp ON ru.id = rp.user_id
       LEFT JOIN posts qp ON p.quoted_post_id = qp.id AND qp.is_deleted = false
       LEFT JOIN users qu ON qp.user_id = qu.id
       LEFT JOIN profiles qpr ON qu.id = qpr.user_id
       WHERE r.user_id = $1 AND r.is_pinned = true
       LIMIT 1`,
      [userId, currentUserId || null]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const post: any = { ...row };

    // Format quoted post if present
    if (row.quoted_post_id_info) {
      post.quoted_post = {
        id: row.quoted_post_id_info,
        user_id: row.quoted_post_user_id,
        username: row.quoted_post_username,
        display_name: row.quoted_post_display_name,
        avatar_url: row.quoted_post_avatar_url,
        content: row.quoted_post_content,
        image_url: row.quoted_post_image_url,
        created_at: row.quoted_post_created_at,
      };
    }

    return post;
  }
}
