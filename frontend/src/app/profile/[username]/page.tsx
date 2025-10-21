'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Avatar,
  Typography,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { ArrowBack, CalendarToday, Link as LinkIcon } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import PostCard from '@/components/posts/PostCard';
import ProfileEditDialog from '@/components/profile/ProfileEditDialog';
import { userApi, postApi, followApi } from '@/lib/api';
import type { User, Profile, PostWithStats } from '@/types';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (username) {
      fetchUserData();
    }
  }, [username]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userData = await userApi.getByUsername(username);
      setUser(userData.user);
      setProfile(userData.profile);

      // Fetch user's posts
      const userPosts = await postApi.getByUser(userData.user.id);
      setPosts(userPosts);

      // Check if following (TODO: implement when needed)
      setIsFollowing(false);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser || !user) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await followApi.unfollow(currentUser.id, user.id);
        setIsFollowing(false);
      } else {
        await followApi.follow(currentUser.id, user.id);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleEditProfileSave = () => {
    fetchUserData();
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return '';
    if (url.startsWith('http')) {
      return url;
    }
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${url}`;
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (!user || !profile) {
    return (
      <MainLayout>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography>ユーザーが見つかりません</Typography>
        </Box>
      </MainLayout>
    );
  }

  const isOwnProfile = currentUser?.id === user.id;

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
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {user.display_name || user.username}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {posts.length} ポスト
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Cover Image */}
      <Box
        sx={{
          height: 200,
          width: '100%',
          bgcolor: 'action.hover',
          backgroundImage: profile.cover_image_url
            ? `url(${getImageUrl(profile.cover_image_url)})`
            : 'linear-gradient(to right, #1DA1F2, #14171A)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Profile Info */}
      <Box sx={{ px: 2, pb: 2 }}>
        {/* Avatar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: -8 }}>
          <Avatar
            src={profile.avatar_url ? getImageUrl(profile.avatar_url) : undefined}
            sx={{
              width: 134,
              height: 134,
              border: '4px solid',
              borderColor: 'background.default',
              fontSize: '48px',
            }}
          >
            {!profile.avatar_url && (user.display_name?.[0] || user.username[0])}
          </Avatar>

          {isOwnProfile ? (
            <Button
              variant="outlined"
              onClick={() => setEditDialogOpen(true)}
              sx={{
                mt: 1,
                borderRadius: '9999px',
                textTransform: 'none',
                fontWeight: 'bold',
                borderColor: 'divider',
                color: 'text.primary',
              }}
            >
              プロフィールを編集
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleFollowToggle}
              disabled={followLoading}
              sx={{
                mt: 1,
                borderRadius: '9999px',
                textTransform: 'none',
                fontWeight: 'bold',
              }}
            >
              {isFollowing ? 'フォロー中' : 'フォロー'}
            </Button>
          )}
        </Box>

        {/* User Info */}
        <Box sx={{ mt: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {user.display_name || user.username}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            @{user.username}
          </Typography>
        </Box>

        {/* Bio */}
        {profile.bio && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            {profile.bio}
          </Typography>
        )}

        {/* Metadata */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
          {profile.location && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                📍 {profile.location}
              </Typography>
            </Box>
          )}
          {profile.website && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LinkIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography
                variant="body2"
                sx={{ color: 'secondary.main', cursor: 'pointer' }}
              >
                {profile.website}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarToday fontSize="small" sx={{ color: 'text.secondary' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {new Date(user.created_at).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
              })}
              に登録
            </Typography>
          </Box>
        </Box>

        {/* Follow Stats */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', gap: 0.5, cursor: 'pointer' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              123
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              フォロー中
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, cursor: 'pointer' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              456
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              フォロワー
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 'bold',
            minWidth: 100,
          },
        }}
      >
        <Tab label="ポスト" />
        <Tab label="返信" />
        <Tab label="ハイライト" />
        <Tab label="メディア" />
      </Tabs>

      {/* Posts */}
      <Box>
        {tabValue === 0 && (
          <>
            {posts.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                  まだ投稿がありません
                </Typography>
              </Box>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} onUpdate={fetchUserData} />)
            )}
          </>
        )}
        {tabValue !== 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              この機能は実装中です
            </Typography>
          </Box>
        )}
      </Box>

      {/* Edit Profile Dialog */}
      {isOwnProfile && (
        <ProfileEditDialog
          open={editDialogOpen}
          user={user}
          profile={profile}
          onClose={() => setEditDialogOpen(false)}
          onSave={handleEditProfileSave}
        />
      )}
    </MainLayout>
  );
}
