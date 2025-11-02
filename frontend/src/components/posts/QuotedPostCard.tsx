"use client";

import { useState } from "react";
import { Box, Avatar, Typography } from "@mui/material";
import { QuotedPost } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { useRouter } from "next/navigation";
import ImageModal from "@/components/common/ImageModal";
import VideoModal from "@/components/common/VideoModal";
import VideoPlayer from "@/components/common/VideoPlayer";

interface QuotedPostCardProps {
  quotedPost: QuotedPost;
}

export default function QuotedPostCard({ quotedPost }: QuotedPostCardProps) {
  const router = useRouter();
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return formatDistanceToNow(date, { addSuffix: true, locale: ja });
      }

      // 24時間以上は「10月20日」の形式
      return date.toLocaleDateString("ja-JP", {
        month: "long",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith("http")) {
      return url;
    }
    return `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${url}`;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/post/${quotedPost.id}`);
  };

  const handleImageClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    setSelectedImageIndex(index);
    setImageModalOpen(true);
  };

  // Parse image_url - could be a single URL or comma-separated URLs
  const images = quotedPost.image_url
    ? quotedPost.image_url
        .split(",")
        .map((url) => url.trim())
        .filter((url) => url.length > 0)
    : [];

  return (
    <Box
      onClick={handleClick}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        p: 1.5,
        mt: 1,
        cursor: "pointer",
        transition: "background-color 0.2s",
        "&:hover": {
          bgcolor: "action.hover",
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <Avatar
          src={
            quotedPost.avatar_url
              ? getImageUrl(quotedPost.avatar_url)
              : undefined
          }
          sx={{ width: 20, height: 20 }}
        >
          {quotedPost.display_name?.[0] || quotedPost.username[0]}
        </Avatar>
        <Typography
          variant="body2"
          sx={{ fontWeight: "bold", fontSize: "14px" }}
        >
          {quotedPost.display_name || quotedPost.username}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", fontSize: "14px" }}
        >
          @{quotedPost.username}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", fontSize: "14px" }}
        >
          ·
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", fontSize: "14px" }}
        >
          {formatTime(quotedPost.created_at)}
        </Typography>
      </Box>

      {/* Content */}
      <Typography
        variant="body2"
        sx={{
          color: "text.primary",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontSize: "14px",
          mb: images.length > 0 ? 1 : 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 5,
          WebkitBoxOrient: "vertical",
        }}
      >
        {quotedPost.content}
      </Typography>

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
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            height: images.length === 1 ? "auto" : "200px",
            maxHeight: images.length === 1 ? "280px" : "200px",
            width: "100%",
          }}
        >
          {images.map((image, index) => (
            <Box
              key={index}
              onClick={(e) => handleImageClick(e, index)}
              sx={{
                position: "relative",
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
                alt={`Quoted post image ${index + 1}`}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: images.length === 1 ? "contain" : "cover",
                }}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Video */}
      {quotedPost.video_url && (
        <Box sx={{ maxWidth: "100%" }}>
          <VideoPlayer
            videoUrl={quotedPost.video_url}
            autoPlay={false}
            muted={true}
            showDuration={true}
            duration={quotedPost.video_duration || undefined}
            onClick={(e) => {
              e.stopPropagation();
              setVideoModalOpen(true);
            }}
          />
        </Box>
      )}

      {/* Image Modal */}
      <ImageModal
        open={imageModalOpen}
        images={images.map(getImageUrl)}
        initialIndex={selectedImageIndex}
        onClose={() => setImageModalOpen(false)}
      />

      {/* Video Modal */}
      {quotedPost.video_url && (
        <VideoModal
          videoUrl={quotedPost.video_url}
          open={videoModalOpen}
          onClose={() => setVideoModalOpen(false)}
        />
      )}
    </Box>
  );
}
