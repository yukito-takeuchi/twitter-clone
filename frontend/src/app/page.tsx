'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress, Tabs, Tab } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import PostForm from '@/components/posts/PostForm';
import PostCard from '@/components/posts/PostCard';
import Header from '@/components/layout/Header';
import MainLayout from '@/components/layout/MainLayout';
import { postApi } from '@/lib/api';
import type { PostWithStats } from '@/types';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<PostWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0); // 0: おすすめ, 1: フォロー中

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchPosts = async (tab?: number) => {
    if (!user) return;

    const currentTab = tab !== undefined ? tab : tabValue;

    try {
      setLoading(true);
      setError('');

      let posts;
      if (currentTab === 0) {
        // おすすめ: 全投稿
        posts = await postApi.getAll(20, 0, user.id);
      } else {
        // フォロー中: タイムライン
        posts = await postApi.getTimeline(user.id, 20, 0, user.id);
      }

      setPosts(posts || []);
    } catch (err: any) {
      console.error('Failed to fetch posts:', err);
      setError('投稿の取得に失敗しました');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    fetchPosts(newValue);
  };

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  if (authLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <Header title="ホーム" />

      {/* Tabs */}
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
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            minHeight: '53px',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 'normal',
              fontSize: '15px',
              minHeight: '53px',
              color: 'text.secondary',
              '&.Mui-selected': {
                fontWeight: 'bold',
                color: 'text.primary',
              },
              '&:hover': {
                bgcolor: 'action.hover',
              },
            },
            '& .MuiTabs-indicator': {
              height: '4px',
              borderRadius: '2px',
              backgroundColor: 'rgb(29, 155, 240)',
            },
          }}
        >
          <Tab label="おすすめ" />
          <Tab label="フォロー中" />
        </Tabs>
      </Box>

      {/* Post Form */}
      <PostForm onPostCreated={fetchPosts} />

      {/* Posts List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : !posts || posts.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            投稿がありません
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            最初の投稿を作成してみましょう
          </Typography>
        </Box>
      ) : (
        <Box>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
          ))}
        </Box>
      )}
    </MainLayout>
  );
}
