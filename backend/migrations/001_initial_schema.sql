-- Twitter Clone Initial Database Schema
-- Migration: 001
-- Description: Create all base tables for Phase 1 functionality

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Users Table
-- ============================================
-- Stores core user authentication information
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users table
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ============================================
-- Profiles Table
-- ============================================
-- Stores extended user profile information
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    location VARCHAR(100),
    website VARCHAR(255),
    avatar_url TEXT,
    cover_image_url TEXT,
    birth_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Index for profiles table
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- ============================================
-- Posts Table
-- ============================================
-- Stores user posts/tweets
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    reply_to_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    repost_of_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT content_length CHECK (char_length(content) <= 280)
);

-- Indexes for posts table
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_reply_to_id ON posts(reply_to_id);
CREATE INDEX idx_posts_repost_of_id ON posts(repost_of_id);

-- ============================================
-- Likes Table
-- ============================================
-- Stores post likes
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id)
);

-- Indexes for likes table
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_created_at ON likes(created_at DESC);

-- ============================================
-- Follows Table
-- ============================================
-- Stores user follow relationships
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Indexes for follows table
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_follows_created_at ON follows(created_at DESC);

-- ============================================
-- Images Table
-- ============================================
-- Stores image metadata
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    storage_type VARCHAR(20) DEFAULT 'local', -- 'local' or 'gcs'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for images table
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_post_id ON images(post_id);
CREATE INDEX idx_images_created_at ON images(created_at DESC);

-- ============================================
-- Bookmarks Table (Phase 2, but adding now for completeness)
-- ============================================
-- Stores saved/bookmarked posts
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id)
);

-- Indexes for bookmarks table
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_post_id ON bookmarks(post_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- ============================================
-- Functions and Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Views for common queries
-- ============================================

-- View: Post with like count and user info
CREATE VIEW posts_with_stats AS
SELECT
    p.id,
    p.user_id,
    p.content,
    p.image_url,
    p.reply_to_id,
    p.repost_of_id,
    p.view_count,
    p.created_at,
    p.updated_at,
    u.username,
    u.display_name,
    pr.avatar_url,
    COUNT(DISTINCT l.id) as like_count,
    COUNT(DISTINCT r.id) as reply_count
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN profiles pr ON u.id = pr.user_id
LEFT JOIN likes l ON p.id = l.post_id
LEFT JOIN posts r ON p.id = r.reply_to_id
WHERE p.is_deleted = false
GROUP BY p.id, u.id, pr.avatar_url;

-- View: User with follower/following counts
CREATE VIEW users_with_stats AS
SELECT
    u.id,
    u.firebase_uid,
    u.email,
    u.username,
    u.display_name,
    u.is_active,
    u.created_at,
    pr.bio,
    pr.location,
    pr.website,
    pr.avatar_url,
    pr.cover_image_url,
    COUNT(DISTINCT followers.id) as follower_count,
    COUNT(DISTINCT following.id) as following_count,
    COUNT(DISTINCT p.id) as post_count
FROM users u
LEFT JOIN profiles pr ON u.id = pr.user_id
LEFT JOIN follows followers ON u.id = followers.following_id
LEFT JOIN follows following ON u.id = following.follower_id
LEFT JOIN posts p ON u.id = p.user_id AND p.is_deleted = false
GROUP BY u.id, pr.id;

-- ============================================
-- Seed Data (Optional - for testing)
-- ============================================

-- This will be populated when users sign up via Firebase
-- For now, we'll leave it empty

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Initial schema migration completed successfully';
END $$;
