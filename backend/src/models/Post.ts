import { query } from "../config/database";

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
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
  reply_to_id?: string;
  repost_of_id?: string;
  quoted_post_id?: string;
}

export interface UpdatePostInput {
  content?: string;
  image_url?: string;
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
  quoted_post?: QuotedPost | null;
}

export class PostModel {
  // Create a new post
  static async create(input: CreatePostInput): Promise<Post> {
    const result = await query(
      `INSERT INTO posts (user_id, content, image_url, reply_to_id, repost_of_id, quoted_post_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.user_id,
        input.content,
        input.image_url || null,
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
        CASE
          WHEN $2::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM likes WHERE post_id = pws.id AND user_id = $2
          )
          ELSE false
        END as is_liked_by_current_user,
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
    const post: PostWithStats = { ...row };
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
      `SELECT
        pws.*,
        CASE
          WHEN $4::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM likes WHERE post_id = pws.id AND user_id = $4
          )
          ELSE false
        END as is_liked_by_current_user,
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
       WHERE pws.user_id = $1 AND pws.reply_to_id IS NULL
       ORDER BY pws.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset, currentUserId || null]
    );

    // Format quoted posts
    return result.rows.map((row) => {
      const post: PostWithStats = { ...row };
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
      const post: PostWithStats = { ...row };
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
      `SELECT
        p.*,
        CASE
          WHEN $4::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $4
          )
          ELSE false
        END as is_liked_by_current_user,
        0 as retweet_count
       FROM posts_with_stats p
       WHERE p.user_id IN (
          SELECT following_id FROM follows WHERE follower_id = $1
        )
        AND p.reply_to_id IS NULL
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset, currentUserId || null]
    );
    return result.rows;
  }

  // Get all posts (public feed, excluding replies)
  static async findAll(limit: number = 20, offset: number = 0, currentUserId?: string): Promise<PostWithStats[]> {
    const result = await query(
      `SELECT
        pws.*,
        CASE
          WHEN $3::uuid IS NOT NULL THEN EXISTS(
            SELECT 1 FROM likes WHERE post_id = pws.id AND user_id = $3
          )
          ELSE false
        END as is_liked_by_current_user,
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
       WHERE pws.reply_to_id IS NULL
       ORDER BY pws.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset, currentUserId || null]
    );

    // Format quoted posts
    return result.rows.map((row) => {
      const post: PostWithStats = { ...row };
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
}
