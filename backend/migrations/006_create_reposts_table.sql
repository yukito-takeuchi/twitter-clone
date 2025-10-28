-- Create reposts table
CREATE TABLE IF NOT EXISTS reposts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    repost_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reposts_user_id ON reposts(user_id);
CREATE INDEX IF NOT EXISTS idx_reposts_post_id ON reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_reposts_created_at ON reposts(created_at);
CREATE INDEX IF NOT EXISTS idx_reposts_repost_post_id ON reposts(repost_post_id);

-- Add comments
COMMENT ON TABLE reposts IS 'Stores repost relationships between users and posts';
COMMENT ON COLUMN reposts.user_id IS 'User who reposted';
COMMENT ON COLUMN reposts.post_id IS 'Original post that was reposted';
COMMENT ON COLUMN reposts.repost_post_id IS 'Reference to the repost entry in posts table';
