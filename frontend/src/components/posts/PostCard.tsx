'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import Link from 'next/link';
import ImageModal from '@/components/common/ImageModal';

interface PostCardProps {
  post: PostWithStats;
  onUpdate?: () => void;
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(post.is_liked_by_current_user || false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.tagName === 'IMG'
    ) {
      return;
    }
    router.push(`/post/${post.id}`);
  };

  const handleImageClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setSelectedImageIndex(index);
    setImageModalOpen(true);
  };

  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) {
      return url;
    }
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${url}`;
  };

  // Parse image_url - could be a single URL or comma-separated URLs
  const images = post.image_url
    ? post.image_url.split(',').map((url) => url.trim())
    : [];

  return (
    <Paper
      elevation={0}
      onClick={handleCardClick}
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
        <Link href={`/profile/${post.username}`} onClick={(e) => e.stopPropagation()}>
          <Avatar sx={{ width: 40, height: 40, cursor: 'pointer' }}>
            {post.display_name?.[0] || post.username?.[0] || '?'}
          </Avatar>
        </Link>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Link
              href={`/profile/${post.username}`}
              onClick={(e) => e.stopPropagation()}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Typography
                variant="body1"
                sx={{ fontWeight: 'bold', color: 'text.primary', '&:hover': { textDecoration: 'underline' } }}
              >
                {post.display_name || post.username}
              </Typography>
            </Link>
            <Link
              href={`/profile/${post.username}`}
              onClick={(e) => e.stopPropagation()}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Typography variant="body2" sx={{ color: 'text.secondary', '&:hover': { textDecoration: 'underline' } }}>
                @{post.username}
              </Typography>
            </Link>
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

          {/* Images */}
          {images.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: images.length === 1 ? '1fr' : '1fr 1fr',
                gap: 0.5,
                mt: 2,
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {images.map((image, index) => (
                <Box
                  key={index}
                  onClick={(e) => handleImageClick(e, index)}
                  sx={{
                    position: 'relative',
                    paddingTop: images.length === 1 ? '56.25%' : '100%',
                    bgcolor: 'action.hover',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.9,
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={getImageUrl(image)}
                    alt={`Image ${index + 1}`}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}

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

      {/* Image Modal */}
      {images.length > 0 && (
        <ImageModal
          images={images}
          initialIndex={selectedImageIndex}
          open={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
        />
      )}
    </Paper>
  );
}
