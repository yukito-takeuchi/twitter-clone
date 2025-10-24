'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Avatar, Typography, Button } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { followApi } from '@/lib/api';
import type { UserWithProfile } from '@/types';

interface UserCardProps {
  user: UserWithProfile;
  onFollowChange?: () => void;
}

export default function UserCard({ user, onFollowChange }: UserCardProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(user.is_following || false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isHoveringFollow, setIsHoveringFollow] = useState(false);

  const isOwnProfile = currentUser?.id === user.id;

  const getImageUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith("http")) {
      return url;
    }
    return `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${url}`;
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser || followLoading) return;

    setFollowLoading(true);
    const previousState = isFollowing;
    setIsFollowing(!isFollowing);

    try {
      if (isFollowing) {
        await followApi.unfollow(currentUser.id, user.id);
      } else {
        await followApi.follow(currentUser.id, user.id);
      }
      onFollowChange?.();
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      setIsFollowing(previousState);
      alert('フォロー操作に失敗しました');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCardClick = () => {
    router.push(`/profile/${user.username}`);
  };

  return (
    <Box
      onClick={handleCardClick}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        p: 2,
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Avatar */}
      <Avatar
        src={user.avatar_url ? getImageUrl(user.avatar_url) : undefined}
        sx={{
          width: 48,
          height: 48,
          fontSize: '20px',
        }}
      >
        {!user.avatar_url && (user.display_name?.[0] || user.username[0])}
      </Avatar>

      {/* User Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 'bold',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.display_name || user.username}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              @{user.username}
            </Typography>
          </Box>

          {/* Follow Button */}
          {!isOwnProfile && (
            <Button
              variant={isFollowing ? 'outlined' : 'contained'}
              onClick={handleFollow}
              onMouseEnter={() => setIsHoveringFollow(true)}
              onMouseLeave={() => setIsHoveringFollow(false)}
              disabled={followLoading}
              sx={{
                borderRadius: '9999px',
                textTransform: 'none',
                fontWeight: 'bold',
                px: 2.5,
                py: 0.5,
                minWidth: '90px',
                fontSize: '14px',
                flexShrink: 0,
                // フォロー中の場合
                ...(isFollowing && {
                  borderColor: isHoveringFollow ? 'rgb(244, 33, 46)' : 'divider',
                  color: isHoveringFollow ? 'rgb(244, 33, 46)' : 'text.primary',
                  bgcolor: isHoveringFollow ? 'rgba(244, 33, 46, 0.1)' : 'transparent',
                  '&:hover': {
                    borderColor: 'rgb(244, 33, 46)',
                  },
                }),
                // 未フォローの場合
                ...(!isFollowing && {
                  bgcolor: 'text.primary',
                  color: 'background.default',
                  '&:hover': {
                    bgcolor: 'text.primary',
                    opacity: 0.9,
                  },
                }),
              }}
            >
              {isFollowing ? (isHoveringFollow ? 'フォロー解除' : 'フォロー中') : 'フォロー'}
            </Button>
          )}
        </Box>

        {/* Bio */}
        {user.bio && (
          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user.bio}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
