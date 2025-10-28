"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Avatar, Typography, IconButton, Paper } from "@mui/material";
import {
  ChatBubbleOutline,
  RepeatOutlined,
  FavoriteBorder,
  Favorite,
  BarChart,
  BookmarkBorder,
  Bookmark,
  Share,
  MoreHoriz,
} from "@mui/icons-material";
import { PostWithStats } from "@/types";
import { likeApi, bookmarkApi, repostApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import Link from "next/link";
import ImageModal from "@/components/common/ImageModal";
import PostMenuDialog from "@/components/posts/PostMenuDialog";
import DeletePostDialog from "@/components/posts/DeletePostDialog";
import EditPostDialog from "@/components/posts/EditPostDialog";
import SharePostDialog from "@/components/posts/SharePostDialog";
import QuotedPostCard from "@/components/posts/QuotedPostCard";

interface PostCardProps {
  post: PostWithStats;
  onUpdate?: () => void;
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(
    post.is_liked_by_current_user || false
  );
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(
    post.is_bookmarked_by_current_user || false
  );
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isReposted, setIsReposted] = useState(
    post.is_reposted_by_current_user || false
  );
  const [isReposting, setIsReposting] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const handleLike = async () => {
    if (!user || isLiking) return;

    setIsLiking(true);
    try {
      if (isLiked) {
        await likeApi.unlike(post.id, user.id);
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        await likeApi.like({ post_id: post.id, user_id: user.id });
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
      // いいね時はリロード不要（ローカルステートで更新済み）
      // onUpdate?.();
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async () => {
    if (!user || isBookmarking) return;

    setIsBookmarking(true);
    try {
      if (isBookmarked) {
        await bookmarkApi.unbookmark(post.id, user.id);
        setIsBookmarked(false);
      } else {
        await bookmarkApi.bookmark({ post_id: post.id, user_id: user.id });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleRepost = async () => {
    if (!user || isReposting) return;

    setIsReposting(true);
    try {
      if (isReposted) {
        await repostApi.unrepost(post.id, user.id);
        setIsReposted(false);
      } else {
        await repostApi.repost({ post_id: post.id, user_id: user.id });
        setIsReposted(true);
      }
    } catch (error) {
      console.error("Failed to toggle repost:", error);
    } finally {
      setIsReposting(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ja,
      });
    } catch {
      return "";
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("[data-image-box]") ||
      target.tagName === "BUTTON" ||
      target.tagName === "A" ||
      target.tagName === "IMG"
    ) {
      return;
    }
    router.push(`/post/${post.id}`);
  };

  const handleImageClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
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

  const getImageUrl = (url: string) => {
    if (url.startsWith("http")) {
      return url;
    }
    // Ensure we have a proper base URL
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
      "http://localhost:3001";
    const fullUrl = `${baseUrl}${url}`;
    console.log("Image URL:", { original: url, baseUrl, fullUrl });
    return fullUrl;
  };

  // Parse image_url - could be a single URL or comma-separated URLs
  const images = post.image_url
    ? post.image_url.split(",").map((url) => url.trim())
    : [];

  // Calculate paddingTop for single image based on aspect ratio
  const getSingleImagePaddingTop = () => {
    if (!imageAspectRatio) return "56.25%"; // Default 16:9
    const paddingPercent = (1 / imageAspectRatio) * 100;
    // Limit max height to 16:9 to keep size reasonable
    return `${Math.min(paddingPercent, 56.25)}%`;
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
    onUpdate?.();
  };

  const handleUpdated = () => {
    onUpdate?.();
  };

  // Check if current user is the post owner
  const isOwnPost = user && post.user_id === user.id;

  return (
    <Paper
      elevation={0}
      onClick={handleCardClick}
      sx={{
        p: 2,
        borderBottom: "1px solid",
        borderColor: "divider",
        cursor: "pointer",
        transition: "background-color 0.2s",
        "&:hover": {
          bgcolor: "action.hover",
        },
      }}
    >
      {/* Repost Header */}
      {post.is_repost && post.reposted_by_username && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 1,
            ml: 5,
            color: "text.secondary"
          }}
        >
          <RepeatOutlined sx={{ fontSize: 16 }} />
          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
            {post.reposted_by_display_name || post.reposted_by_username}さんがリポスト
          </Typography>
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 2 }}>
        {/* Avatar */}
        <Link
          href={`/profile/${post.username}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar
            src={post.avatar_url ? getImageUrl(post.avatar_url) : undefined}
            sx={{ width: 40, height: 40, cursor: "pointer" }}
          >
            {post.display_name?.[0] || post.username?.[0] || "?"}
          </Avatar>
        </Link>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Link
              href={`/profile/${post.username}`}
              onClick={(e) => e.stopPropagation()}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontWeight: "bold",
                  color: "text.primary",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {post.display_name || post.username}
              </Typography>
            </Link>
            <Link
              href={`/profile/${post.username}`}
              onClick={(e) => e.stopPropagation()}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                @{post.username}
              </Typography>
            </Link>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              ·
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {formatTime(post.created_at)}
            </Typography>

            {/* More icon - only show for own posts */}
            {isOwnPost && (
              <Box sx={{ ml: "auto" }}>
                <IconButton
                  size="small"
                  onClick={handleMoreClick}
                  sx={{
                    color: "text.secondary",
                    "&:hover": {
                      bgcolor: "rgba(29, 155, 240, 0.1)",
                      color: "#1D9BF0",
                    },
                  }}
                >
                  <MoreHoriz fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>

          {/* Post Content */}
          <Typography
            variant="body1"
            sx={{
              color: "text.primary",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              mb: 1,
            }}
          >
            {post.content}
          </Typography>

          {/* Quoted Post */}
          {post.quoted_post && (
            <QuotedPostCard quotedPost={post.quoted_post} />
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
                mt: 2,
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
                  data-image-box
                  onClick={(e) => handleImageClick(e, index)}
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

          {/* Action Buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              maxWidth: "425px",
              mt: 1,
            }}
          >
            {/* Reply */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    bgcolor: "rgba(29, 155, 240, 0.1)",
                    color: "#1D9BF0",
                  },
                }}
              >
                <ChatBubbleOutline fontSize="small" />
              </IconButton>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", minWidth: "20px" }}
              >
                {post.reply_count > 0 ? post.reply_count : ""}
              </Typography>
            </Box>

            {/* Repost - Functional */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRepost();
                }}
                disabled={!user || isReposting}
                sx={{
                  color: isReposted ? "#00BA7C" : "text.secondary",
                  "&:hover": {
                    bgcolor: "rgba(0, 186, 124, 0.1)",
                    color: "#00BA7C",
                  },
                }}
              >
                <RepeatOutlined fontSize="small" />
              </IconButton>
              <Typography
                variant="body2"
                sx={{
                  color: isReposted ? "#00BA7C" : "text.secondary",
                  minWidth: "20px",
                }}
              >
                {post.retweet_count > 0 ? post.retweet_count : ""}
              </Typography>
            </Box>

            {/* Like - Functional */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                size="small"
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
                {isLiked ? (
                  <Favorite fontSize="small" />
                ) : (
                  <FavoriteBorder fontSize="small" />
                )}
              </IconButton>
              <Typography
                variant="body2"
                sx={{
                  color: isLiked ? "#F91880" : "text.secondary",
                  minWidth: "20px",
                }}
              >
                {likeCount > 0 ? likeCount : ""}
              </Typography>
            </Box>

            {/* Views - Design only */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    bgcolor: "rgba(29, 155, 240, 0.1)",
                    color: "#1D9BF0",
                  },
                }}
              >
                <BarChart fontSize="small" />
              </IconButton>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", minWidth: "20px" }}
              >
                {post.view_count > 0 ? post.view_count : ""}
              </Typography>
            </Box>

            {/* Bookmark and Share */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBookmark();
                }}
                disabled={!user || isBookmarking}
                sx={{
                  color: isBookmarked ? "#1D9BF0" : "text.secondary",
                  "&:hover": {
                    bgcolor: "rgba(29, 155, 240, 0.1)",
                    color: "#1D9BF0",
                  },
                }}
              >
                {isBookmarked ? (
                  <Bookmark fontSize="small" />
                ) : (
                  <BookmarkBorder fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
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
                <Share fontSize="small" />
              </IconButton>
            </Box>
          </Box>
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
    </Paper>
  );
}
