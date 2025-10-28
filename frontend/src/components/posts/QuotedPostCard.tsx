'use client';

import { Box, Avatar, Typography } from '@mui/material';
import { QuotedPost } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface QuotedPostCardProps {
  quotedPost: QuotedPost;
}

export default function QuotedPostCard({ quotedPost }: QuotedPostCardProps) {
  const router = useRouter();

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

  const getImageUrl = (url: string | null) => {
    if (!url) return '';
    if (url.startsWith('http')) {
      return url;
    }
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${url}`;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/post/${quotedPost.id}`);
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        p: 1.5,
        mt: 1,
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Avatar
          src={quotedPost.avatar_url ? getImageUrl(quotedPost.avatar_url) : undefined}
          sx={{ width: 20, height: 20 }}
        >
          {quotedPost.display_name?.[0] || quotedPost.username[0]}
        </Avatar>
        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '14px' }}>
          {quotedPost.display_name || quotedPost.username}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '14px' }}>
          @{quotedPost.username}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '14px' }}>
          ·
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '14px' }}>
          {formatTime(quotedPost.created_at)}
        </Typography>
      </Box>

      {/* Content */}
      <Typography
        variant="body2"
        sx={{
          color: 'text.primary',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontSize: '14px',
          mb: quotedPost.image_url ? 1 : 0,
        }}
      >
        {quotedPost.content}
      </Typography>

      {/* Image */}
      {quotedPost.image_url && (
        <Box
          component="img"
          src={getImageUrl(quotedPost.image_url)}
          alt="Quoted post image"
          sx={{
            width: '100%',
            maxHeight: 200,
            objectFit: 'cover',
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
          }}
        />
      )}
    </Box>
  );
}
