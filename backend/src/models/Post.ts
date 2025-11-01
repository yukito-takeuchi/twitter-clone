import { query } from "../config/database";

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  video_thumbnail_url: string | null;
  video_duration: number | null;
  reply_to_id: string | null;
  repost_of_id: string | null;
  quoted_post_id: string | null;
  is_deleted: boolean;
  view_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePostInput {
  user_id: string;
  content: string;
  image_url?: string;
  video_url?: string;
  video_thumbnail_url?: string;
  video_duration?: number;
  reply_to_id?: string;
  repost_of_id?: string;
  quoted_post_id?: string;
}

export interface UpdatePostInput {
  content?: string;
  image_url?: string;
  video_url?: string;
  video_thumbnail_url?: string;
  video_duration?: number;
}

export interface QuotedPost {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  content: string;
  image_url: string | null;
  created_at: Date;
}

export interface PostWithStats extends Post {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  like_count: number;
  reply_count: number;
  retweet_count: number;
  is_liked_by_current_user?: boolean;
  is_bookmarked_by_current_user?: boolean;
  is_reposted_by_current_user?: boolean;
  quoted_post?: QuotedPost | null;
}

export class PostModel {
  // Create a new post
  static async create(input: CreatePostInput): Promise<Post> {
    const result = await query(
      `INSERT INTO posts (user_id, content, image_url, video_url, video_thumbnail_url, video_duration, reply_to_id, repost_of_id, quoted_post_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        input.user_id,
        input.content,
        input.image_url || null,
        input.video_url || null,
        input.video_thumbnail_url || null,
        input.video_duration || null,
        input.reply_to_id || null,
        input.repost_of_id || null,
        input.quoted_post_id || null,
      ]
    );
    return result.rows[0];
  }

  // Find post by ID
  static async findById(id: string): Promise<Post | null> {
    const result = await query(
      `SELECT * FROM posts WHERE id = $1 AND is_deleted = false`,
      [id]
    );
    return result.rows[0] || null;
  }

  // Find post with stats by ID
  static async findByIdWithStats(id: string, currentUserId?: string): Promise<PostWithStats | null> {
    const result = await query(
      `SELECT
        pws.*,
        false as is_repost,
        NULL::uuid as reposted_by_user_id,
        NULL::varchar as reposted_by_username,
        NULL::varchar as reposted_by_display_name,
        NULL::varchar as reposted_by_avatar_url,
        NULL::timestamp as reposted_at,
        CASE
          WHEN $2::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM likes WHERE post_id = pws.id AND user_id = $2
          )
          ELSE false
        END as is_liked_by_current_user,
        CASE
          WHEN $2::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM bookmarks WHERE post_id = pws.id AND user_id = $2
          )
          ELSE false
        END as is_bookmarked_by_current_user,
        CASE
          WHEN $2::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM reposts WHERE post_id = pws.id AND user_id = $2
          )
          ELSE false
        END as is_reposted_by_current_user,
        0 as retweet_count,
        -- Quoted post information
        qp.id as quoted_post_id_info,
        qp.user_id as quoted_post_user_id,
        qu.username as quoted_post_username,
        qu.display_name as quoted_post_display_name,
        qpr.avatar_url as quoted_post_avatar_url,
        qp.content as quoted_post_content,
        qp.image_url as quoted_post_image_url,
        qp.created_at as quoted_post_created_at
       FROM posts_with_stats pws
       LEFT JOIN posts qp ON pws.quoted_post_id = qp.id AND qp.is_deleted = false
       LEFT JOIN users qu ON qp.user_id = qu.id
       LEFT JOIN profiles qpr ON qu.id = qpr.user_id
       WHERE pws.id = $1`,
      [id, currentUserId || null]
    );

    const row = result.rows[0];
    if (!row) return null;

    // Format quoted post if exists
    const post: PostWithStats = {
      ...row,
      // Ensure like_count and reply_count are numbers
      like_count: parseInt(row.like_count) || 0,
      reply_count: parseInt(row.reply_count) || 0,
    };
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

  // Get posts by user ID (excluding replies)
  static async findByUserId(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    currentUserId?: string
  ): Promise<PostWithStats[]> {
    const result = await query(
      `SELECT DISTINCT ON (user_posts.sort_date, user_posts.id)
        user_posts.*,
        CASE
          WHEN $4::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM likes WHERE post_id = user_posts.id AND user_id = $4
          )
          ELSE false
        END as is_liked_by_current_user,
        CASE
          WHEN $4::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM bookmarks WHERE post_id = user_posts.id AND user_id = $4
          )
          ELSE false
        END as is_bookmarked_by_current_user,
        CASE
          WHEN $4::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM reposts WHERE post_id = user_posts.id AND user_id = $4
          )
          ELSE false
        END as is_reposted_by_current_user,
        0 as retweet_count,
        -- Quoted post information
        qp.id as quoted_post_id_info,
        qp.user_id as quoted_post_user_id,
        qu.username as quoted_post_username,
        qu.display_name as quoted_post_display_name,
        qpr.avatar_url as quoted_post_avatar_url,
        qp.content as quoted_post_content,
        qp.image_url as quoted_post_image_url,
        qp.created_at as quoted_post_created_at
       FROM (
         -- Original posts by user
         SELECT
           pws.*,
           pws.created_at as sort_date,
           false as is_repost,
           NULL::uuid as reposted_by_user_id,
           NULL::varchar as reposted_by_username,
           NULL::varchar as reposted_by_display_name,
           NULL::varchar as reposted_by_avatar_url,
           NULL::timestamp as reposted_at
         FROM posts_with_stats pws
         WHERE pws.user_id = $1
           AND pws.reply_to_id IS NULL
           AND pws.repost_of_id IS NULL

         UNION ALL

         -- Reposts by user
         SELECT
           p.*,
           r.created_at as sort_date,
           true as is_repost,
           r.user_id as reposted_by_user_id,
           ru.username as reposted_by_username,
           ru.display_name as reposted_by_display_name,
           rp.avatar_url as reposted_by_avatar_url,
           r.created_at as reposted_at
         FROM reposts r
         JOIN posts_with_stats p ON r.post_id = p.id
         JOIN users ru ON r.user_id = ru.id
         LEFT JOIN profiles rp ON ru.id = rp.user_id
         WHERE r.user_id = $1
       ) as user_posts
       LEFT JOIN posts qp ON user_posts.quoted_post_id = qp.id AND qp.is_deleted = false
       LEFT JOIN users qu ON qp.user_id = qu.id
       LEFT JOIN profiles qpr ON qu.id = qpr.user_id
       ORDER BY user_posts.sort_date DESC, user_posts.id
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset, currentUserId || null]
    );

    // Format quoted posts
    return result.rows.map((row) => {
      const post: PostWithStats = {
        ...row,
        // Ensure like_count and reply_count are numbers
        like_count: parseInt(row.like_count) || 0,
        reply_count: parseInt(row.reply_count) || 0,
      };
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

  // Get replies by user ID
  static async findRepliesByUserId(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    currentUserId?: string
  ): Promise<PostWithStats[]> {
    const result = await query(
      `SELECT
        pws.*,
        CASE
          WHEN $4::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM likes WHERE post_id = pws.id AND user_id = $4
          )
          ELSE false
        END as is_liked_by_current_user,
        CASE
          WHEN $4::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM bookmarks WHERE post_id = pws.id AND user_id = $4
          )
          ELSE false
        END as is_bookmarked_by_current_user,
        CASE
          WHEN $4::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM reposts WHERE post_id = pws.id AND user_id = $4
          )
          ELSE false
        END as is_reposted_by_current_user,
        0 as retweet_count,
        -- Quoted post information
        qp.id as quoted_post_id_info,
        qp.user_id as quoted_post_user_id,
        qu.username as quoted_post_username,
        qu.display_name as quoted_post_display_name,
        qpr.avatar_url as quoted_post_avatar_url,
        qp.content as quoted_post_content,
        qp.image_url as quoted_post_image_url,
        qp.created_at as quoted_post_created_at
       FROM posts_with_stats pws
       LEFT JOIN posts qp ON pws.quoted_post_id = qp.id AND qp.is_deleted = false
       LEFT JOIN users qu ON qp.user_id = qu.id
       LEFT JOIN profiles qpr ON qu.id = qpr.user_id
       WHERE pws.user_id = $1 AND pws.reply_to_id IS NOT NULL
       ORDER BY pws.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset, currentUserId || null]
    );

    // Format quoted posts
    return result.rows.map((row) => {
      const post: PostWithStats = {
        ...row,
        // Ensure like_count and reply_count are numbers
        like_count: parseInt(row.like_count) || 0,
        reply_count: parseInt(row.reply_count) || 0,
      };
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

  // Get timeline posts (posts from followed users only, excluding replies)
  static async getTimeline(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    currentUserId?: string
  ): Promise<PostWithStats[]> {
    const result = await query(
      `SELECT DISTINCT ON (timeline_posts.sort_date, timeline_posts.id)
        timeline_posts.*,
        CASE
          WHEN $4::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM likes WHERE post_id = timeline_posts.id AND user_id = $4
          )
          ELSE false
        END as is_liked_by_current_user,
        CASE
          WHEN $4::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM bookmarks WHERE post_id = timeline_posts.id AND user_id = $4
          )
          ELSE false
        END as is_bookmarked_by_current_user,
        CASE
          WHEN $4::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM reposts WHERE post_id = timeline_posts.id AND user_id = $4
          )
          ELSE false
        END as is_reposted_by_current_user,
        0 as retweet_count,
        -- Quoted post information
        qp.id as quoted_post_id_info,
        qp.user_id as quoted_post_user_id,
        qu.username as quoted_post_username,
        qu.display_name as quoted_post_display_name,
        qpr.avatar_url as quoted_post_avatar_url,
        qp.content as quoted_post_content,
        qp.image_url as quoted_post_image_url,
        qp.created_at as quoted_post_created_at
       FROM (
         -- Original posts by followed users
         SELECT
           p.*,
           p.created_at as sort_date,
           false as is_repost,
           NULL::uuid as reposted_by_user_id,
           NULL::varchar as reposted_by_username,
           NULL::varchar as reposted_by_display_name,
           NULL::varchar as reposted_by_avatar_url,
           NULL::timestamp as reposted_at
         FROM posts_with_stats p
         WHERE p.user_id IN (
            SELECT following_id FROM follows WHERE follower_id = $1
          )
          AND p.reply_to_id IS NULL
          AND p.repost_of_id IS NULL

         UNION ALL

         -- Reposts by followed users
         SELECT
           p.*,
           r.created_at as sort_date,
           true as is_repost,
           r.user_id as reposted_by_user_id,
           ru.username as reposted_by_username,
           ru.display_name as reposted_by_display_name,
           rp.avatar_url as reposted_by_avatar_url,
           r.created_at as reposted_at
         FROM reposts r
         JOIN posts_with_stats p ON r.post_id = p.id
         JOIN users ru ON r.user_id = ru.id
         LEFT JOIN profiles rp ON ru.id = rp.user_id
         WHERE r.user_id IN (
            SELECT following_id FROM follows WHERE follower_id = $1
          )
       ) as timeline_posts
       LEFT JOIN posts qp ON timeline_posts.quoted_post_id = qp.id AND qp.is_deleted = false
       LEFT JOIN users qu ON qp.user_id = qu.id
       LEFT JOIN profiles qpr ON qu.id = qpr.user_id
       ORDER BY timeline_posts.sort_date DESC, timeline_posts.id
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset, currentUserId || null]
    );

    // Format quoted posts
    return result.rows.map((row) => {
      const post: PostWithStats = {
        ...row,
        // Ensure like_count and reply_count are numbers
        like_count: parseInt(row.like_count) || 0,
        reply_count: parseInt(row.reply_count) || 0,
      };
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

  // Get all posts (public feed, excluding replies)
  static async findAll(limit: number = 20, offset: number = 0, currentUserId?: string): Promise<PostWithStats[]> {
    const result = await query(
      `SELECT DISTINCT ON (feed_posts.sort_date, feed_posts.id)
        feed_posts.*,
        CASE
          WHEN $3::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM likes WHERE post_id = feed_posts.id AND user_id = $3
          )
          ELSE false
        END as is_liked_by_current_user,
        CASE
          WHEN $3::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM bookmarks WHERE post_id = feed_posts.id AND user_id = $3
          )
          ELSE false
        END as is_bookmarked_by_current_user,
        CASE
          WHEN $3::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM reposts WHERE post_id = feed_posts.id AND user_id = $3
          )
          ELSE false
        END as is_reposted_by_current_user,
        0 as retweet_count,
        -- Quoted post information
        qp.id as quoted_post_id_info,
        qp.user_id as quoted_post_user_id,
        qu.username as quoted_post_username,
        qu.display_name as quoted_post_display_name,
        qpr.avatar_url as quoted_post_avatar_url,
        qp.content as quoted_post_content,
        qp.image_url as quoted_post_image_url,
        qp.created_at as quoted_post_created_at
       FROM (
         -- Original posts
         SELECT
           pws.*,
           pws.created_at as sort_date,
           false as is_repost,
           NULL::uuid as reposted_by_user_id,
           NULL::varchar as reposted_by_username,
           NULL::varchar as reposted_by_display_name,
           NULL::varchar as reposted_by_avatar_url,
           NULL::timestamp as reposted_at
         FROM posts_with_stats pws
         WHERE pws.reply_to_id IS NULL
           AND pws.repost_of_id IS NULL

         UNION ALL

         -- Reposts
         SELECT
           p.*,
           r.created_at as sort_date,
           true as is_repost,
           r.user_id as reposted_by_user_id,
           ru.username as reposted_by_username,
           ru.display_name as reposted_by_display_name,
           rp.avatar_url as reposted_by_avatar_url,
           r.created_at as reposted_at
         FROM reposts r
         JOIN posts_with_stats p ON r.post_id = p.id
         JOIN users ru ON r.user_id = ru.id
         LEFT JOIN profiles rp ON ru.id = rp.user_id
       ) as feed_posts
       LEFT JOIN posts qp ON feed_posts.quoted_post_id = qp.id AND qp.is_deleted = false
       LEFT JOIN users qu ON qp.user_id = qu.id
       LEFT JOIN profiles qpr ON qu.id = qpr.user_id
       ORDER BY feed_posts.sort_date DESC, feed_posts.id
       LIMIT $1 OFFSET $2`,
      [limit, offset, currentUserId || null]
    );

    // Format quoted posts
    return result.rows.map((row) => {
      const post: PostWithStats = {
        ...row,
        // Ensure like_count and reply_count are numbers
        like_count: parseInt(row.like_count) || 0,
        reply_count: parseInt(row.reply_count) || 0,
      };
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

  // Get replies to a post
  static async getReplies(
    postId: string,
    limit: number = 20,
    offset: number = 0,
    currentUserId?: string
  ): Promise<PostWithStats[]> {
    const result = await query(
      `SELECT
        pws.*,
        CASE
          WHEN $4::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM likes WHERE post_id = pws.id AND user_id = $4
          )
          ELSE false
        END as is_liked_by_current_user,
        CASE
          WHEN $4::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM bookmarks WHERE post_id = pws.id AND user_id = $4
          )
          ELSE false
        END as is_bookmarked_by_current_user,
        CASE
          WHEN $4::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM reposts WHERE post_id = pws.id AND user_id = $4
          )
          ELSE false
        END as is_reposted_by_current_user,
        0 as retweet_count
       FROM posts_with_stats pws
       WHERE reply_to_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [postId, limit, offset, currentUserId || null]
    );
    return result.rows;
  }

  // Update post
  static async update(id: string, input: UpdatePostInput): Promise<Post | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (input.content !== undefined) {
      fields.push(`content = $${paramCount++}`);
      values.push(input.content);
    }

    if (input.image_url !== undefined) {
      fields.push(`image_url = $${paramCount++}`);
      values.push(input.image_url);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await query(
      `UPDATE posts
       SET ${fields.join(", ")}
       WHERE id = $${paramCount} AND is_deleted = false
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  // Soft delete post
  static async softDelete(id: string): Promise<boolean> {
    const result = await query(
      `UPDATE posts SET is_deleted = true WHERE id = $1`,
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Hard delete post
  static async delete(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM posts WHERE id = $1`, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Increment view count
  static async incrementViewCount(id: string): Promise<void> {
    await query(
      `UPDATE posts SET view_count = view_count + 1 WHERE id = $1`,
      [id]
    );
  }

  // Search posts
  static async search(
    searchTerm: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PostWithStats[]> {
    const result = await query(
      `SELECT * FROM posts_with_stats
       WHERE content ILIKE $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [`%${searchTerm}%`, limit, offset]
    );
    return result.rows;
  }

  // Pin a post to user's profile
  static async pinPost(userId: string, postId: string): Promise<boolean> {
    try {
      // Start transaction
      await query("BEGIN");

      // Verify post ownership
      const postCheck = await query(
        `SELECT user_id FROM posts WHERE id = $1 AND is_deleted = false`,
        [postId]
      );

      if (postCheck.rows.length === 0) {
        await query("ROLLBACK");
        return false;
      }

      if (postCheck.rows[0].user_id !== userId) {
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

      // Pin the specified post
      const result = await query(
        `UPDATE posts SET is_pinned = true, pinned_at = NOW() WHERE id = $1 AND user_id = $2`,
        [postId, userId]
      );

      await query("COMMIT");
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  }

  // Unpin a post from user's profile
  static async unpinPost(userId: string, postId: string): Promise<boolean> {
    const result = await query(
      `UPDATE posts SET is_pinned = false, pinned_at = NULL WHERE id = $1 AND user_id = $2`,
      [postId, userId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Get pinned post for a user
  static async getPinnedPost(userId: string, currentUserId?: string): Promise<PostWithStats | null> {
    const result = await query(
      `SELECT
        p.*,
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
       FROM posts_with_stats p
       LEFT JOIN posts qp ON p.quoted_post_id = qp.id AND qp.is_deleted = false
       LEFT JOIN users qu ON qp.user_id = qu.id
       LEFT JOIN profiles qpr ON qu.id = qpr.user_id
       WHERE p.user_id = $1 AND p.is_pinned = true AND p.is_deleted = false
       LIMIT 1`,
      [userId, currentUserId || null]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const post: PostWithStats = {
      ...row,
      // Ensure like_count and reply_count are numbers
      like_count: parseInt(row.like_count) || 0,
      reply_count: parseInt(row.reply_count) || 0,
    };

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
