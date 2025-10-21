'use client';

import { useState } from 'react';
import { Box, Avatar, Typography, IconButton, Paper } from '@mui/material';
import {
  ChatBubbleOutline,
  RepeatOutlined,
  FavoriteBorder,
  Favorite,
  BarChart,
  BookmarkBorder,
  Share,
} from '@mui/icons-material';
import { PostWithStats } from '@/types';
import { likeApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface PostCardProps {
  post: PostWithStats;
  onUpdate?: () => void;
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked_by_current_user || false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!user || isLiking) return;

    setIsLiking(true);
    try {
      if (isLiked) {
        await likeApi.unlike(post.id, user.id);
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        await likeApi.like({ post_id: post.id, user_id: user.id });
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
      onUpdate?.();
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ja,
      });
    } catch {
      return '';
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Avatar */}
        <Avatar sx={{ width: 40, height: 40 }}>
          {post.author_display_name?.[0] || post.author_username[0]}
        </Avatar>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography
              variant="body1"
              sx={{ fontWeight: 'bold', color: 'text.primary' }}
            >
              {post.author_display_name || post.author_username}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              @{post.author_username}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              ·
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {formatTime(post.created_at)}
            </Typography>
          </Box>

          {/* Post Content */}
          <Typography
            variant="body1"
            sx={{
              color: 'text.primary',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              mb: 1,
            }}
          >
            {post.content}
          </Typography>

          {/* Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              maxWidth: '425px',
              mt: 1,
            }}
          >
            {/* Reply */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: 'rgba(29, 155, 240, 0.1)',
                    color: '#1D9BF0',
                  },
                }}
              >
                <ChatBubbleOutline fontSize="small" />
              </IconButton>
              <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: '20px' }}>
                {post.reply_count > 0 ? post.reply_count : ''}
              </Typography>
            </Box>

            {/* Retweet - Design only */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: 'rgba(0, 186, 124, 0.1)',
                    color: '#00BA7C',
                  },
                }}
              >
                <RepeatOutlined fontSize="small" />
              </IconButton>
              <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: '20px' }}>
                {post.retweet_count > 0 ? post.retweet_count : ''}
              </Typography>
            </Box>

            {/* Like - Functional */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={handleLike}
                disabled={!user || isLiking}
                sx={{
                  color: isLiked ? '#F91880' : 'text.secondary',
                  '&:hover': {
                    bgcolor: 'rgba(249, 24, 128, 0.1)',
                    color: '#F91880',
                  },
                }}
              >
                {isLiked ? (
                  <Favorite fontSize="small" />
                ) : (
                  <FavoriteBorder fontSize="small" />
                )}
              </IconButton>
              <Typography
                variant="body2"
                sx={{
                  color: isLiked ? '#F91880' : 'text.secondary',
                  minWidth: '20px',
                }}
              >
                {likeCount > 0 ? likeCount : ''}
              </Typography>
            </Box>

            {/* Views - Design only */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: 'rgba(29, 155, 240, 0.1)',
                    color: '#1D9BF0',
                  },
                }}
              >
                <BarChart fontSize="small" />
              </IconButton>
              <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: '20px' }}>
                {post.view_count > 0 ? post.view_count : ''}
              </Typography>
            </Box>

            {/* Bookmark and Share */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: 'rgba(29, 155, 240, 0.1)',
                    color: '#1D9BF0',
                  },
                }}
              >
                <BookmarkBorder fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: 'rgba(29, 155, 240, 0.1)',
                    color: '#1D9BF0',
                  },
                }}
              >
                <Share fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
