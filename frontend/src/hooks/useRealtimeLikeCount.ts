"use client";

import { useEffect, useState, useRef } from "react";
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

  useEffect(() => {
    // Don't poll if not enabled
    if (!enabled || !postId) {
      console.log(`[useRealtimeLikeCount] Polling disabled for post ${postId}`);
      return;
    }

    console.log(`[useRealtimeLikeCount] Starting polling for post ${postId} with interval ${pollingInterval}ms`);

    const fetchLikeCount = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Cancel previous request if it exists
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        const post = await postApi.getById(postId, userId);

        if (post && typeof post.like_count === "number") {
          console.log(`[useRealtimeLikeCount] Fetched like count for post ${postId}: ${post.like_count}`);
          setLikeCount(post.like_count);
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err);
          console.error("Failed to fetch like count:", err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchLikeCount();

    // Set up polling interval
    const interval = setInterval(() => {
      // Only poll if tab is visible
      if (document.visibilityState === "visible") {
        console.log(`[useRealtimeLikeCount] Polling tick for post ${postId}`);
        fetchLikeCount();
      }
    }, pollingInterval);

    // Listen for visibility changes to resume polling when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchLikeCount();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
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
