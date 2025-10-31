-- Update posts_with_stats view to include is_pinned and pinned_at
-- Migration: 008
-- Description: Add is_pinned and pinned_at to posts_with_stats view

-- Drop existing view
DROP VIEW IF EXISTS posts_with_stats;

-- Recreate view with is_pinned and pinned_at
CREATE VIEW posts_with_stats AS
SELECT
    p.id,
    p.user_id,
    p.content,
    p.image_url,
    p.reply_to_id,
    p.repost_of_id,
    p.quoted_post_id,
    p.is_pinned,
    p.pinned_at,
    p.view_count,
    p.created_at,
    p.updated_at,
    u.username,
    u.display_name,
    pr.avatar_url,
    COUNT(DISTINCT l.id) AS like_count,
    COUNT(DISTINCT r.id) AS reply_count
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN profiles pr ON u.id = pr.user_id
LEFT JOIN likes l ON p.id = l.post_id
LEFT JOIN posts r ON p.id = r.reply_to_id
WHERE p.is_deleted = false
GROUP BY p.id, u.id, pr.avatar_url;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Posts view update migration (with pinned fields) completed successfully';
END $$;
