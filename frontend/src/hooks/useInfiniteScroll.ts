import { useEffect, useRef, useCallback, useState } from 'react';

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}

export const useInfiniteScroll = ({ onLoadMore, hasMore, loading }: UseInfiniteScrollOptions) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  const [sentinelMounted, setSentinelMounted] = useState(false);

  // Callback ref to track when sentinel is mounted
  const setSentinelRef = useCallback((node: HTMLDivElement | null) => {
    sentinelRef.current = node;
    if (node) {
      console.log('[useInfiniteScroll] Sentinel element mounted');
      setSentinelMounted(true);
    } else {
      console.log('[useInfiniteScroll] Sentinel element unmounted');
      setSentinelMounted(false);
    }
  }, []);

  // Keep onLoadMore ref up to date
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    console.log('[useInfiniteScroll] Effect:', {
      hasMore,
      loading,
      sentinelMounted,
      hasSentinel: !!sentinelRef.current
    });

    // Don't observe if there's no more data or currently loading
    if (!hasMore || loading) {
      console.log('[useInfiniteScroll] Not observing');
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      return;
    }

    // Wait for sentinel element to be mounted
    if (!sentinelRef.current || !sentinelMounted) {
      console.log('[useInfiniteScroll] Sentinel not ready yet');
      return;
    }

    // Sentinel exists - create observer
    console.log('[useInfiniteScroll] Creating IntersectionObserver');
    observerRef.current = new IntersectionObserver(
      (entries) => {
        console.log('[useInfiniteScroll] Intersection:', entries[0].isIntersecting);
        if (entries[0].isIntersecting) {
          console.log('[useInfiniteScroll] Triggering onLoadMore');
          onLoadMoreRef.current();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(sentinelRef.current);
    console.log('[useInfiniteScroll] Observer started');

    // Cleanup
    return () => {
      console.log('[useInfiniteScroll] Cleanup - disconnecting observer');
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, sentinelMounted]);

  return setSentinelRef;
};
