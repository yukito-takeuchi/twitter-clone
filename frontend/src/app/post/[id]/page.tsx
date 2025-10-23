'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  CircularProgress,
  Divider,
  TextField,
  Button,
} from '@mui/material';
import {
  ArrowBack,
  ChatBubbleOutline,
  RepeatOutlined,
  FavoriteBorder,
  Favorite,
  Share,
  BarChart,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { postApi, likeApi } from '@/lib/api';
import type { PostWithStats } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';
import ImageModal from '@/components/common/ImageModal';
import PostCard from '@/components/posts/PostCard';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const { user } = useAuth();

  const [post, setPost] = useState<PostWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [replyContent, setReplyContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [replies, setReplies] = useState<PostWithStats[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchReplies();
    }
  }, [postId, user]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const postData = await postApi.getById(postId, user?.id);
      setPost(postData);
      setIsLiked(postData.is_liked_by_current_user || false);
      setLikeCount(postData.like_count || 0);
    } catch (error) {
      console.error('Failed to fetch post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async () => {
    try {
      setRepliesLoading(true);
      const repliesData = await postApi.getReplies(postId, 20, 0, user?.id);
      setReplies(repliesData);
    } catch (error) {
      console.error('Failed to fetch replies:', error);
    } finally {
      setRepliesLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user || !post || isLiking) return;

    setIsLiking(true);
    try {
      if (isLiked) {
        await likeApi.unlike(post.id, user.id);
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        await likeApi.like({ user_id: user.id, post_id: post.id });
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setImageModalOpen(true);
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !user || !post || replyLoading) return;

    setReplyLoading(true);
    try {
      await postApi.create({
        user_id: user.id,
        content: replyContent.trim(),
        reply_to_id: post.id,
      });
      setReplyContent('');
      fetchReplies(); // Refresh replies list
      fetchPost(); // Refresh post to update reply_count
    } catch (error) {
      console.error('Failed to create reply:', error);
      alert('返信の投稿に失敗しました');
    } finally {
      setReplyLoading(false);
    }
  };

  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) {
      return url;
    }
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${url}`;
  };

  // Parse image_url - could be a single URL or comma-separated URLs
  const images = post?.image_url
    ? post.image_url.split(',').map((url) => url.trim())
    : [];

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (!post) {
    return (
      <MainLayout>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography>投稿が見つかりません</Typography>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: (theme) =>
            theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.8)'
              : 'rgba(0, 0, 0, 0.8)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2, gap: 2 }}>
          <IconButton onClick={() => router.back()}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            ポスト
          </Typography>
        </Box>
      </Box>

      {/* Post Content */}
      <Box sx={{ p: 2 }}>
        {/* User Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Link href={`/profile/${post.username}`} style={{ textDecoration: 'none' }}>
            <Avatar
              src={post.avatar_url ? getImageUrl(post.avatar_url) : undefined}
              sx={{ width: 48, height: 48, cursor: 'pointer' }}
            >
              {post.display_name?.[0] || post.username?.[0] || '?'}
            </Avatar>
          </Link>
          <Box>
            <Link
              href={`/profile/${post.username}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Typography variant="body1" sx={{ fontWeight: 'bold', '&:hover': { textDecoration: 'underline' } }}>
                {post.display_name || post.username}
              </Typography>
            </Link>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              @{post.username}
            </Typography>
          </Box>
        </Box>

        {/* Content */}
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.5,
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
              mb: 2,
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {images.map((image, index) => (
              <Box
                key={index}
                onClick={() => handleImageClick(index)}
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

        {/* Timestamp */}
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {formatTime(post.created_at)}
        </Typography>

        <Divider />

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 3, py: 2 }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {post.reply_count}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              返信
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {post.retweet_count}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              リポスト
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {likeCount}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              いいね
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {post.view_count}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              表示
            </Typography>
          </Box>
        </Box>

        <Divider />

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-around',
            py: 1,
          }}
        >
          <IconButton
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'rgba(29, 155, 240, 0.1)',
                color: '#1D9BF0',
              },
            }}
          >
            <ChatBubbleOutline />
          </IconButton>

          <IconButton
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'rgba(0, 186, 124, 0.1)',
                color: '#00BA7C',
              },
            }}
          >
            <RepeatOutlined />
          </IconButton>

          <IconButton
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
            {isLiked ? <Favorite /> : <FavoriteBorder />}
          </IconButton>

          <IconButton
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'rgba(29, 155, 240, 0.1)',
                color: '#1D9BF0',
              },
            }}
          >
            <BarChart />
          </IconButton>

          <IconButton
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'rgba(29, 155, 240, 0.1)',
                color: '#1D9BF0',
              },
            }}
          >
            <Share />
          </IconButton>
        </Box>

        <Divider />

        {/* Reply Form */}
        {user && (
          <Box
            component="form"
            onSubmit={handleReplySubmit}
            sx={{ py: 2, borderBottom: '1px solid', borderColor: 'divider' }}
          >
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Avatar
                src={user.avatar_url ? getImageUrl(user.avatar_url) : undefined}
                sx={{ width: 40, height: 40 }}
              >
                {user.display_name?.[0] || user.username[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  placeholder="返信をポスト"
                  variant="standard"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  InputProps={{ disableUnderline: true }}
                  sx={{ fontSize: '18px' }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!replyContent.trim() || replyLoading}
                    sx={{
                      borderRadius: '9999px',
                      px: 3,
                      textTransform: 'none',
                      fontWeight: 'bold',
                      bgcolor: 'rgb(29, 155, 240)',
                      '&:hover': {
                        bgcolor: 'rgb(26, 140, 216)',
                      },
                    }}
                  >
                    {replyLoading ? '送信中...' : '返信'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Replies */}
        <Box>
          {repliesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : replies.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
              返信はまだありません
            </Typography>
          ) : (
            replies.map((reply) => (
              <PostCard key={reply.id} post={reply} onUpdate={fetchReplies} />
            ))
          )}
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
    </MainLayout>
  );
}
