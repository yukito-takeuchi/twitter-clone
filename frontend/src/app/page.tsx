'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress } from '@mui/material';
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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchPosts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      const posts = await postApi.getTimeline(user.id);
      setPosts(posts || []);
    } catch (err: any) {
      console.error('Failed to fetch posts:', err);
      setError('投稿の取得に失敗しました');
      setPosts([]);
    } finally {
      setLoading(false);
    }
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
