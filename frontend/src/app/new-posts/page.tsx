'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import PostCard from '@/components/posts/PostCard';
import Header from '@/components/layout/Header';
import MainLayout from '@/components/layout/MainLayout';
import { postApi } from '@/lib/api';
import type { PostWithStats } from '@/types';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

export default function NewPostsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<PostWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Initial fetch (reset everything)
  const fetchPosts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      setOffset(0);
      setHasMore(true);

      // フォロー中のユーザーのタイムライン（新しい投稿）を取得
      const fetchedPosts = await postApi.getTimeline(user.id, LIMIT, 0, user.id);

      setPosts(fetchedPosts || []);
      setOffset(LIMIT);
      setHasMore((fetchedPosts || []).length >= LIMIT);
    } catch (err: any) {
      console.error('Failed to fetch new posts:', err);
      setError('新しい投稿の取得に失敗しました');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Load more posts (pagination)
  const loadMorePosts = useCallback(async () => {
    if (!user || loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);

      const morePosts = await postApi.getTimeline(user.id, LIMIT, offset, user.id);

      if (morePosts && morePosts.length > 0) {
        setPosts(prev => [...prev, ...morePosts]);
        setOffset(prev => prev + LIMIT);
        setHasMore(morePosts.length >= LIMIT);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error('Failed to load more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [user, loadingMore, hasMore, offset, LIMIT]);

  // Infinite scroll
  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMorePosts,
    hasMore,
    loading: loadingMore,
  });

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
      <Header title="新しい投稿" />

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
            新しい投稿がありません
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            フォロー中のユーザーがまだ投稿していません
          </Typography>
        </Box>
      ) : (
        <Box>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
          ))}

          {/* Loading More Indicator */}
          {loadingMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Sentinel Element for Infinite Scroll */}
          {hasMore && !loadingMore && (
            <div ref={sentinelRef} style={{ height: '20px' }} />
          )}

          {/* No More Posts Message */}
          {!hasMore && posts.length > 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                すべての投稿を表示しました
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </MainLayout>
  );
}
