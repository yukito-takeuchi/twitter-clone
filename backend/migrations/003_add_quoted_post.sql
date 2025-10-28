-- Add quoted post support (quote tweets)
-- Migration: 003
-- Description: Add quoted_post_id to posts table for quote tweet functionality

-- Add quoted_post_id column to posts table
ALTER TABLE posts
ADD COLUMN quoted_post_id UUID REFERENCES posts(id) ON DELETE SET NULL;

-- Create index for quoted_post_id
CREATE INDEX idx_posts_quoted_post_id ON posts(quoted_post_id);

-- Add comment
COMMENT ON COLUMN posts.quoted_post_id IS 'Reference to the post being quoted (quote tweet)';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Quoted post migration completed successfully';
END $$;
