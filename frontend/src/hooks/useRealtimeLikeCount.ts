"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { postApi } from "@/lib/api";

interface UseRealtimeLikeCountOptions {
  postId: string;
  userId: string | null;
  initialLikeCount: number;
  pollingInterval?: number;
  enabled?: boolean;
}

export function useRealtimeLikeCount({
  postId,
  userId,
  initialLikeCount,
  pollingInterval = 5000,
  enabled = true,
}: UseRealtimeLikeCountOptions) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use ref to avoid recreating function on every render
  const fetchLikeCountRef = useRef<() => Promise<void>>();

  fetchLikeCountRef.current = async () => {
    if (!enabled || !postId) {
      console.log(`[useRealtimeLikeCount] Skipping fetch - enabled: ${enabled}, postId: ${postId}`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      console.log(`[useRealtimeLikeCount] Calling API for post ${postId}, userId: ${userId}`);
      const post = await postApi.getById(postId, userId);
      console.log(`[useRealtimeLikeCount] API response for post ${postId}:`, post);
      console.log(`[useRealtimeLikeCount] like_count type: ${typeof post?.like_count}, value: ${post?.like_count}`);

      if (post && typeof post.like_count === "number") {
        console.log(`[useRealtimeLikeCount] Setting like count to: ${post.like_count}`);
        setLikeCount(post.like_count);
      } else if (post && post.like_count !== undefined) {
        // Try to convert to number if it's a string
        const likeCountNum = Number(post.like_count);
        console.log(`[useRealtimeLikeCount] like_count is not a number, converting: ${post.like_count} -> ${likeCountNum}`);
        if (!isNaN(likeCountNum)) {
          setLikeCount(likeCountNum);
        }
      } else {
        console.warn(`[useRealtimeLikeCount] Invalid like_count for post ${postId}:`, post?.like_count);
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err);
        console.error(`[useRealtimeLikeCount] Error fetching like count for post ${postId}:`, err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLikeCount = useCallback(() => {
    return fetchLikeCountRef.current?.();
  }, []);

  useEffect(() => {
    // Don't poll if not enabled
    if (!enabled || !postId) {
      console.log(`[useRealtimeLikeCount] Polling disabled for post ${postId}`);
      return;
    }

    console.log(`[useRealtimeLikeCount] Starting polling for post ${postId} (userId: ${userId}) with interval ${pollingInterval}ms`);

    // Initial fetch
    fetchLikeCountRef.current?.();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      // Only poll if tab is visible
      if (document.visibilityState === "visible") {
        console.log(`[useRealtimeLikeCount] Polling tick for post ${postId}`);
        fetchLikeCountRef.current?.();
      }
    }, pollingInterval);

    // Listen for visibility changes to resume polling when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log(`[useRealtimeLikeCount] Visibility changed - fetching for post ${postId}`);
        fetchLikeCountRef.current?.();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      console.log(`[useRealtimeLikeCount] Cleanup for post ${postId}`);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [postId, userId, enabled, pollingInterval]);

  // Update like count when initial value changes (e.g., from optimistic update)
  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  return {
    likeCount,
    isLoading,
    error,
    refetch: fetchLikeCount,
  };
}
