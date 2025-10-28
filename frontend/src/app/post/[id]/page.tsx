"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  CircularProgress,
  Divider,
  TextField,
  Button,
} from "@mui/material";
import {
  ArrowBack,
  ChatBubbleOutline,
  RepeatOutlined,
  FavoriteBorder,
  Favorite,
  Share,
  BarChart,
  MoreHoriz,
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import { postApi, likeApi } from "@/lib/api";
import type { PostWithStats } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import Link from "next/link";
import ImageModal from "@/components/common/ImageModal";
import PostCard from "@/components/posts/PostCard";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import PostMenuDialog from "@/components/posts/PostMenuDialog";
import DeletePostDialog from "@/components/posts/DeletePostDialog";
import EditPostDialog from "@/components/posts/EditPostDialog";
import QuotedPostCard from "@/components/posts/QuotedPostCard";
import SharePostDialog from "@/components/posts/SharePostDialog";

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
  const [replyContent, setReplyContent] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replies, setReplies] = useState<PostWithStats[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Pagination for replies
  const [repliesLoadingMore, setRepliesLoadingMore] = useState(false);
  const [repliesHasMore, setRepliesHasMore] = useState(true);
  const [repliesOffset, setRepliesOffset] = useState(0);
  const LIMIT = 10;

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
      console.error("Failed to fetch post:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async () => {
    try {
      setRepliesLoading(true);
      setRepliesOffset(0);
      setRepliesHasMore(true);

      // Add 0.5s delay for loading UI
      await new Promise((resolve) => setTimeout(resolve, 500));

      const repliesData = await postApi.getReplies(postId, LIMIT, 0, user?.id);
      setReplies(repliesData);
      setRepliesOffset(LIMIT);
      setRepliesHasMore((repliesData || []).length >= LIMIT);
    } catch (error) {
      console.error("Failed to fetch replies:", error);
    } finally {
      setRepliesLoading(false);
    }
  };

  // Load more replies
  const loadMoreReplies = useCallback(async () => {
    if (repliesLoadingMore || !repliesHasMore) return;

    try {
      setRepliesLoadingMore(true);

      // Add 0.5s delay for loading UI
      await new Promise((resolve) => setTimeout(resolve, 500));

      const moreReplies = await postApi.getReplies(
        postId,
        LIMIT,
        repliesOffset,
        user?.id
      );

      if (moreReplies && moreReplies.length > 0) {
        setReplies((prev) => [...prev, ...moreReplies]);
        setRepliesOffset((prev) => prev + LIMIT);
        setRepliesHasMore(moreReplies.length >= LIMIT);
      } else {
        setRepliesHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more replies:", error);
    } finally {
      setRepliesLoadingMore(false);
    }
  }, [repliesLoadingMore, repliesHasMore, repliesOffset, postId, user, LIMIT]);

  // Infinite scroll for replies
  const repliesSentinelRef = useInfiniteScroll({
    onLoadMore: loadMoreReplies,
    hasMore: repliesHasMore,
    loading: repliesLoadingMore,
  });

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
      console.error("Failed to toggle like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setImageModalOpen(true);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (images.length === 1) {
      const img = e.currentTarget;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      setImageAspectRatio(aspectRatio);
    }
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
      setReplyContent("");
      fetchReplies(); // Refresh replies list
      fetchPost(); // Refresh post to update reply_count
    } catch (error) {
      console.error("Failed to create reply:", error);
      alert("返信の投稿に失敗しました");
    } finally {
      setReplyLoading(false);
    }
  };

  const getImageUrl = (url: string) => {
    if (url.startsWith("http")) {
      return url;
    }
    // Ensure we have a proper base URL
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
      "http://localhost:3001";
    return `${baseUrl}${url}`;
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(true);
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleted = () => {
    // Navigate back after deletion
    router.back();
  };

  const handleUpdated = () => {
    // Refresh post after edit
    fetchPost();
  };

  // Check if current user is the post owner
  const isOwnPost = user && post && post.user_id === user.id;

  // Parse image_url - could be a single URL or comma-separated URLs
  const images = post?.image_url
    ? post.image_url.split(",").map((url) => url.trim())
    : [];

  // Calculate paddingTop for single image based on aspect ratio
  const getSingleImagePaddingTop = () => {
    if (!imageAspectRatio) return "56.25%"; // Default 16:9
    const paddingPercent = (1 / imageAspectRatio) * 100;
    // Limit max height to 16:9 to keep size reasonable
    return `${Math.min(paddingPercent, 56.25)}%`;
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (!post) {
    return (
      <MainLayout>
        <Box sx={{ p: 4, textAlign: "center" }}>
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
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: (theme) =>
            theme.palette.mode === "light"
              ? "rgba(255, 255, 255, 0.8)"
              : "rgba(0, 0, 0, 0.8)",
          borderBottom: "1px solid",
          borderColor: "divider",
          backdropFilter: "blur(10px)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", p: 2, gap: 2 }}>
          <IconButton onClick={() => router.back()}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            ポスト
          </Typography>
        </Box>
      </Box>

      {/* Post Content */}
      <Box sx={{ p: 2 }}>
        {/* User Info */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Link
            href={`/profile/${post.username}`}
            style={{ textDecoration: "none" }}
          >
            <Avatar
              src={post.avatar_url ? getImageUrl(post.avatar_url) : undefined}
              sx={{ width: 48, height: 48, cursor: "pointer" }}
            >
              {post.display_name?.[0] || post.username?.[0] || "?"}
            </Avatar>
          </Link>
          <Box sx={{ flex: 1 }}>
            <Link
              href={`/profile/${post.username}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontWeight: "bold",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {post.display_name || post.username}
              </Typography>
            </Link>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              @{post.username}
            </Typography>
          </Box>

          {/* More icon - only show for own posts */}
          {isOwnPost && (
            <IconButton
              onClick={handleMoreClick}
              sx={{
                color: "text.secondary",
                "&:hover": {
                  bgcolor: "rgba(29, 155, 240, 0.1)",
                  color: "#1D9BF0",
                },
              }}
            >
              <MoreHoriz />
            </IconButton>
          )}
        </Box>

        {/* Content */}
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            lineHeight: 1.5,
          }}
        >
          {post.content}
        </Typography>

        {/* Quoted Post */}
        {post.quoted_post && (
          <Box sx={{ mb: 2 }}>
            <QuotedPostCard quotedPost={post.quoted_post} />
          </Box>
        )}

        {/* Images */}
        {images.length > 0 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                images.length === 1
                  ? "1fr"
                  : images.length === 2
                  ? "1fr 1fr"
                  : images.length === 3
                  ? "2fr 1fr"
                  : "1fr 1fr",
              gridTemplateRows:
                images.length === 3
                  ? "1fr 1fr"
                  : images.length === 4
                  ? "1fr 1fr"
                  : "auto",
              gap: 0.5,
              mb: 2,
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              height: images.length === 1 ? "auto" : "288px",
              width: "100%",
            }}
          >
            {images.map((image, index) => (
              <Box
                key={index}
                onClick={() => handleImageClick(index)}
                sx={{
                  position: "relative",
                  paddingTop:
                    images.length === 1 ? getSingleImagePaddingTop() : "0",
                  height: images.length === 1 ? "auto" : "100%",
                  bgcolor: "action.hover",
                  overflow: "hidden",
                  cursor: "pointer",
                  ...(images.length === 3 &&
                    index === 0 && {
                      gridRow: "1 / 3",
                    }),
                  "&:hover": {
                    opacity: 0.9,
                  },
                }}
              >
                <Box
                  component="img"
                  src={getImageUrl(image)}
                  alt={`Image ${index + 1}`}
                  onLoad={handleImageLoad}
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: images.length === 1 ? "contain" : "cover",
                  }}
                />
              </Box>
            ))}
          </Box>
        )}

        {/* Timestamp */}
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {formatTime(post.created_at)}
        </Typography>

        <Divider />

        {/* Stats */}
        <Box sx={{ display: "flex", gap: 3, py: 2 }}>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              {post.reply_count}
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              返信
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              {post.retweet_count}
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              リポスト
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              {likeCount}
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              いいね
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              {post.view_count}
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              表示
            </Typography>
          </Box>
        </Box>

        <Divider />

        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-around",
            py: 1,
          }}
        >
          <IconButton
            sx={{
              color: "text.secondary",
              "&:hover": {
                bgcolor: "rgba(29, 155, 240, 0.1)",
                color: "#1D9BF0",
              },
            }}
          >
            <ChatBubbleOutline />
          </IconButton>

          <IconButton
            sx={{
              color: "text.secondary",
              "&:hover": {
                bgcolor: "rgba(0, 186, 124, 0.1)",
                color: "#00BA7C",
              },
            }}
          >
            <RepeatOutlined />
          </IconButton>

          <IconButton
            onClick={handleLike}
            disabled={!user || isLiking}
            sx={{
              color: isLiked ? "#F91880" : "text.secondary",
              "&:hover": {
                bgcolor: "rgba(249, 24, 128, 0.1)",
                color: "#F91880",
              },
            }}
          >
            {isLiked ? <Favorite /> : <FavoriteBorder />}
          </IconButton>

          <IconButton
            sx={{
              color: "text.secondary",
              "&:hover": {
                bgcolor: "rgba(29, 155, 240, 0.1)",
                color: "#1D9BF0",
              },
            }}
          >
            <BarChart />
          </IconButton>

          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setShareDialogOpen(true);
            }}
            sx={{
              color: "text.secondary",
              "&:hover": {
                bgcolor: "rgba(29, 155, 240, 0.1)",
                color: "#1D9BF0",
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
            sx={{ py: 2, borderBottom: "1px solid", borderColor: "divider" }}
          >
            <Box sx={{ display: "flex", gap: 2 }}>
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
                  sx={{ fontSize: "18px" }}
                />
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!replyContent.trim() || replyLoading}
                    sx={{
                      borderRadius: "9999px",
                      px: 3,
                      textTransform: "none",
                      fontWeight: "bold",
                      bgcolor: "rgb(29, 155, 240)",
                      "&:hover": {
                        bgcolor: "rgb(26, 140, 216)",
                      },
                    }}
                  >
                    {replyLoading ? "送信中..." : "返信"}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Replies */}
        <Box>
          {repliesLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : replies.length === 0 ? (
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", textAlign: "center", py: 4 }}
            >
              返信はまだありません
            </Typography>
          ) : (
            <>
              {replies.map((reply) => (
                <PostCard key={reply.id} post={reply} onUpdate={fetchReplies} />
              ))}

              {/* Loading More Indicator */}
              {repliesLoadingMore && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              )}

              {/* Sentinel Element for Infinite Scroll */}
              {repliesHasMore && !repliesLoadingMore && (
                <div ref={repliesSentinelRef} style={{ height: "20px" }} />
              )}

              {/* No More Replies Message */}
              {!repliesHasMore && replies.length > 0 && (
                <Box sx={{ p: 4, textAlign: "center" }}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    すべての返信を表示しました
                  </Typography>
                </Box>
              )}
            </>
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

      {/* Post Menu Dialog */}
      {post && (
        <>
          <PostMenuDialog
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {/* Delete Confirmation Dialog */}
          <DeletePostDialog
            open={deleteDialogOpen}
            postId={post.id}
            onClose={() => setDeleteDialogOpen(false)}
            onDeleted={handleDeleted}
          />

          {/* Edit Post Dialog */}
          <EditPostDialog
            open={editDialogOpen}
            postId={post.id}
            initialContent={post.content}
            onClose={() => setEditDialogOpen(false)}
            onUpdated={handleUpdated}
          />

          {/* Share Post Dialog */}
          <SharePostDialog
            open={shareDialogOpen}
            onClose={() => setShareDialogOpen(false)}
            postId={post.id}
          />
        </>
      )}
    </MainLayout>
  );
}
