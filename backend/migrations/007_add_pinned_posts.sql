-- Add pinned post functionality
-- This migration adds the ability to pin posts and reposts to user profiles

-- Add is_pinned and pinned_at columns to posts table
ALTER TABLE posts
ADD COLUMN is_pinned BOOLEAN DEFAULT false,
ADD COLUMN pinned_at TIMESTAMP;

-- Add is_pinned and pinned_at columns to reposts table
ALTER TABLE reposts
ADD COLUMN is_pinned BOOLEAN DEFAULT false,
ADD COLUMN pinned_at TIMESTAMP;

-- Create indexes for faster queries on pinned posts
CREATE INDEX idx_posts_user_pinned ON posts(user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_reposts_user_pinned ON reposts(user_id, is_pinned) WHERE is_pinned = true;

-- Add comment for documentation
COMMENT ON COLUMN posts.is_pinned IS 'Indicates if this post is pinned to the user profile';
COMMENT ON COLUMN posts.pinned_at IS 'Timestamp when the post was pinned';
COMMENT ON COLUMN reposts.is_pinned IS 'Indicates if this repost is pinned to the user profile';
COMMENT ON COLUMN reposts.pinned_at IS 'Timestamp when the repost was pinned';

-- Note: Application logic enforces only ONE pinned item (post OR repost) per user
