-- Notification System Enhancement
-- Migration: 005
-- Description: Add notification settings table and enhance notification types

-- ============================================
-- Notification Settings Table
-- ============================================
-- User-specific notification preferences
CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Notification type toggles
    enable_likes BOOLEAN DEFAULT true,
    enable_replies BOOLEAN DEFAULT true,
    enable_follows BOOLEAN DEFAULT true,
    enable_reposts BOOLEAN DEFAULT true,
    enable_quotes BOOLEAN DEFAULT true,
    enable_dms BOOLEAN DEFAULT true,
    enable_new_posts_from_following BOOLEAN DEFAULT true,

    -- Email notification settings (future use)
    enable_email_notifications BOOLEAN DEFAULT false,
    email_frequency VARCHAR(20) DEFAULT 'instant', -- instant, daily, weekly

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Each user can only have one settings record
    UNIQUE(user_id),

    -- Valid email frequencies
    CONSTRAINT valid_email_frequency CHECK (
        email_frequency IN ('instant', 'daily', 'weekly', 'never')
    )
);

-- Indexes for notification_settings table
CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);

-- ============================================
-- Update Notification Type Constraint
-- ============================================
-- Add new notification types: 'quote' and 'new_post'
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS valid_notification_type;
ALTER TABLE notifications ADD CONSTRAINT valid_notification_type CHECK (
    notification_type IN ('dm', 'like', 'follow', 'reply', 'mention', 'repost', 'quote', 'new_post')
);

-- ============================================
-- Function to create default notification settings
-- ============================================
-- Automatically create notification settings when a new user is created
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default settings for new users
CREATE TRIGGER trigger_create_notification_settings
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_settings();

-- Create default settings for existing users
INSERT INTO notification_settings (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Notification system migration completed successfully';
END $$;
