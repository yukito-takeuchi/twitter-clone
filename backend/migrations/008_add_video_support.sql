-- Migration: Add video support to posts
-- Created: 2025-11-01

-- 1. Create videos table for video metadata
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    duration INTEGER, -- Duration in seconds
    width INTEGER,
    height INTEGER,
    storage_type VARCHAR(20) DEFAULT 'local',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add video fields to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS video_duration INTEGER; -- Duration in seconds

-- 3. Add constraint to prevent both image and video on same post
ALTER TABLE posts
ADD CONSTRAINT check_single_media_type
CHECK (
    (image_url IS NULL OR video_url IS NULL)
);

-- 4. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_post_id ON videos(post_id);
CREATE INDEX IF NOT EXISTS idx_posts_video_url ON posts(video_url) WHERE video_url IS NOT NULL;

-- 5. Add comments for documentation
COMMENT ON TABLE videos IS 'Stores metadata for uploaded videos';
COMMENT ON COLUMN posts.video_url IS 'URL to the video file (mutually exclusive with image_url)';
COMMENT ON COLUMN posts.video_thumbnail_url IS 'URL to the auto-generated video thumbnail';
COMMENT ON COLUMN posts.video_duration IS 'Video duration in seconds (max 120 seconds allowed)';
