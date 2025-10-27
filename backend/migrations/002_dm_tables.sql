-- Direct Message Feature Migration
-- Migration: 002
-- Description: Create tables for DM functionality with real-time messaging support

-- ============================================
-- Conversations Table
-- ============================================
-- Stores 1-on-1 conversation threads between users
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Always store smaller user_id as participant1 to prevent duplicates
    participant1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Ensure unique conversation between two users
    UNIQUE(participant1_id, participant2_id),
    -- Ensure participant1_id < participant2_id for consistency
    CONSTRAINT check_participant_order CHECK (participant1_id < participant2_id),
    -- Prevent self-conversations
    CONSTRAINT no_self_conversation CHECK (participant1_id != participant2_id)
);

-- Indexes for conversations table
CREATE INDEX idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_active ON conversations(is_active) WHERE is_active = true;

-- ============================================
-- Messages Table
-- ============================================
-- Stores individual messages in conversations
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Message types: 'text', 'image', 'post_share'
    message_type VARCHAR(20) NOT NULL DEFAULT 'text',
    -- For text messages: plain text content
    -- For image messages: optional caption
    -- For post_share: optional comment
    content TEXT,
    -- Reference to images table for image messages
    image_id UUID REFERENCES images(id) ON DELETE SET NULL,
    -- Reference to posts table for shared posts
    shared_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Validation constraints
    CONSTRAINT valid_message_type CHECK (message_type IN ('text', 'image', 'post_share')),
    CONSTRAINT text_message_has_content CHECK (
        (message_type = 'text' AND content IS NOT NULL AND char_length(content) > 0) OR
        (message_type != 'text')
    ),
    CONSTRAINT image_message_has_image CHECK (
        (message_type = 'image' AND image_id IS NOT NULL) OR
        (message_type != 'image')
    ),
    CONSTRAINT post_share_has_post CHECK (
        (message_type = 'post_share' AND shared_post_id IS NOT NULL) OR
        (message_type != 'post_share')
    ),
    CONSTRAINT content_length CHECK (char_length(content) <= 1000)
);

-- Indexes for messages table
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_type ON messages(message_type);
CREATE INDEX idx_messages_active ON messages(is_deleted) WHERE is_deleted = false;

-- ============================================
-- Message Read Status Table
-- ============================================
-- Tracks read status for each message per user
CREATE TABLE message_read_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Each user can only read a message once
    UNIQUE(message_id, user_id)
);

-- Indexes for message_read_status table
CREATE INDEX idx_message_read_status_message ON message_read_status(message_id);
CREATE INDEX idx_message_read_status_user ON message_read_status(user_id);
CREATE INDEX idx_message_read_status_read_at ON message_read_status(read_at DESC);

-- ============================================
-- Notifications Table (Future Extension)
-- ============================================
-- Generic notification system for DMs and other features
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Notification types: 'dm', 'like', 'follow', 'reply', 'mention', etc.
    notification_type VARCHAR(50) NOT NULL,
    -- JSON content with notification-specific data
    content JSONB NOT NULL,
    -- Related entity references (optional, for quick access)
    related_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    related_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    related_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    -- Status flags
    is_read BOOLEAN DEFAULT false,
    is_sent_email BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Constraint for valid notification types
    CONSTRAINT valid_notification_type CHECK (
        notification_type IN ('dm', 'like', 'follow', 'reply', 'mention', 'repost')
    )
);

-- Indexes for notifications table
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- Functions and Triggers
-- ============================================

-- Update conversations.updated_at trigger
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update messages.updated_at trigger
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update conversation last_message_at when a new message is sent
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_message_at
CREATE TRIGGER update_conversation_last_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- ============================================
-- Utility Functions
-- ============================================

-- Function to check if two users are mutual followers
CREATE OR REPLACE FUNCTION are_mutual_followers(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user1_follows_user2 BOOLEAN;
    user2_follows_user1 BOOLEAN;
BEGIN
    -- Check if user1 follows user2
    SELECT EXISTS(
        SELECT 1 FROM follows
        WHERE follower_id = user1_id AND following_id = user2_id
    ) INTO user1_follows_user2;

    -- Check if user2 follows user1
    SELECT EXISTS(
        SELECT 1 FROM follows
        WHERE follower_id = user2_id AND following_id = user1_id
    ) INTO user2_follows_user1;

    RETURN user1_follows_user2 AND user2_follows_user1;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread message count for a user in a conversation
CREATE OR REPLACE FUNCTION get_unread_count(p_conversation_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.conversation_id = p_conversation_id
        AND m.sender_id != p_user_id
        AND m.is_deleted = false
        AND NOT EXISTS (
            SELECT 1 FROM message_read_status mrs
            WHERE mrs.message_id = m.id AND mrs.user_id = p_user_id
        )
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Views for common queries
-- ============================================

-- View: Conversations with participant details and unread counts
CREATE VIEW conversations_with_details AS
SELECT
    c.id,
    c.participant1_id,
    c.participant2_id,
    c.last_message_at,
    c.is_active,
    c.created_at,
    u1.username as participant1_username,
    u1.display_name as participant1_display_name,
    p1.avatar_url as participant1_avatar,
    u2.username as participant2_username,
    u2.display_name as participant2_display_name,
    p2.avatar_url as participant2_avatar,
    lm.content as last_message_content,
    lm.message_type as last_message_type,
    lm.sender_id as last_message_sender_id
FROM conversations c
JOIN users u1 ON c.participant1_id = u1.id
JOIN users u2 ON c.participant2_id = u2.id
LEFT JOIN profiles p1 ON u1.id = p1.user_id
LEFT JOIN profiles p2 ON u2.id = p2.user_id
LEFT JOIN LATERAL (
    SELECT content, message_type, sender_id
    FROM messages
    WHERE conversation_id = c.id AND is_deleted = false
    ORDER BY created_at DESC
    LIMIT 1
) lm ON true
WHERE c.is_active = true;

-- View: Messages with sender details and read status
CREATE VIEW messages_with_details AS
SELECT
    m.id,
    m.conversation_id,
    m.sender_id,
    m.message_type,
    m.content,
    m.image_id,
    m.shared_post_id,
    m.is_deleted,
    m.created_at,
    u.username as sender_username,
    u.display_name as sender_display_name,
    pr.avatar_url as sender_avatar,
    i.url as image_url,
    COUNT(DISTINCT mrs.id) as read_count
FROM messages m
JOIN users u ON m.sender_id = u.id
LEFT JOIN profiles pr ON u.id = pr.user_id
LEFT JOIN images i ON m.image_id = i.id
LEFT JOIN message_read_status mrs ON m.id = mrs.message_id
WHERE m.is_deleted = false
GROUP BY m.id, u.id, pr.avatar_url, i.url;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'DM tables migration completed successfully';
END $$;
