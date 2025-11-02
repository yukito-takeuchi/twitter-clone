"use client";

import { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Avatar,
  Paper,
  IconButton,
} from "@mui/material";
import { Image as ImageIcon, Close, VideoLibrary } from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { postApi, imageApi } from "@/lib/api";
import { videoApi } from "@/lib/api/video";
import QuotedPostCard from "./QuotedPostCard";
import VideoPreview from "@/components/common/VideoPreview";
import type { QuotedPost } from "@/types";

interface PostFormProps {
  onPostCreated?: () => void;
}

export default function PostForm({ onPostCreated }: PostFormProps) {
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [quotedPost, setQuotedPost] = useState<QuotedPost | null>(null);
  const [detectedPostId, setDetectedPostId] = useState<string | null>(null);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Detect post URL in content
  useEffect(() => {
    const detectPostUrl = async () => {
      // Match /post/[uuid] pattern
      const postUrlRegex = /\/post\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
      const match = content.match(postUrlRegex);

      if (match && match[1]) {
        const postId = match[1];
        // Only fetch if different from current
        if (postId !== detectedPostId) {
          setDetectedPostId(postId);
          try {
            const post = await postApi.getById(postId, user?.id);
            setQuotedPost({
              id: post.id,
              user_id: post.user_id,
              username: post.username,
              display_name: post.display_name,
              avatar_url: post.avatar_url,
              content: post.content,
              image_url: post.image_url,
              created_at: post.created_at,
            });
          } catch (error) {
            console.error("Failed to fetch quoted post:", error);
            setQuotedPost(null);
          }
        }
      } else {
        // No URL detected, clear
        setDetectedPostId(null);
        setQuotedPost(null);
      }
    };

    detectPostUrl();
  }, [content, detectedPostId, user?.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 4) {
      alert("画像は最大4枚までです");
      return;
    }

    const newFiles = files.slice(0, 4 - selectedFiles.length);
    setSelectedFiles([...selectedFiles, ...newFiles]);

    // Create previews
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (200MB max)
    if (file.size > 200 * 1024 * 1024) {
      alert("動画ファイルは200MB以下にしてください");
      return;
    }

    // Clear images if video is selected
    setSelectedFiles([]);
    setPreviews([]);

    setSelectedVideo(file);

    // Create preview URL
    const preview = URL.createObjectURL(file);
    setVideoPreview(preview);

    // Upload video immediately
    setUploadingVideo(true);
    setUploadProgress(0);

    try {
      const response = await videoApi.uploadVideo(file, user.id, (progress) => {
        setUploadProgress(progress);
      });

      setVideoUrl(response.url);
      setVideoThumbnailUrl(response.thumbnail_url || null);
      setVideoDuration(Math.round(response.duration));
    } catch (error: any) {
      console.error("Failed to upload video:", error);
      alert(error.response?.data?.error || "動画のアップロードに失敗しました");
      // Clear video on error
      setSelectedVideo(null);
      setVideoPreview(null);
      if (preview) URL.revokeObjectURL(preview);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleRemoveVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setSelectedVideo(null);
    setVideoPreview(null);
    setVideoUrl(null);
    setVideoThumbnailUrl(null);
    setVideoDuration(null);
    setUploadProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setLoading(true);
    try {
      let imageUrl: string | undefined;

      // Upload images if any
      if (selectedFiles.length > 0) {
        const urls = await imageApi.uploadImages(selectedFiles, user.id);
        imageUrl = urls.join(","); // Join all URLs with commas
      }

      // Remove post URL from content if quoting
      let cleanContent = content.trim();
      if (quotedPost) {
        const postUrlRegex = /https?:\/\/[^\s]+\/post\/[0-9a-f-]+/gi;
        cleanContent = cleanContent.replace(postUrlRegex, '').trim();
      }

      await postApi.create({
        user_id: user.id,
        content: cleanContent,
        image_url: imageUrl,
        video_url: videoUrl || undefined,
        video_thumbnail_url: videoThumbnailUrl || undefined,
        video_duration: videoDuration || undefined,
        quoted_post_id: quotedPost?.id,
      });

      setContent("");
      setSelectedFiles([]);
      setPreviews([]);
      handleRemoveVideo();
      setQuotedPost(null);
      setDetectedPostId(null);
      onPostCreated?.();
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("投稿に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith("http")) {
      return url;
    }
    // Ensure we have a proper base URL
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
      "http://localhost:3001";
    return `${baseUrl}${url}`;
  };

  if (!user) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Avatar
            src={user.avatar_url ? getImageUrl(user.avatar_url) : undefined}
          >
            {user.display_name?.[0] || user.username[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder="いまどうしてる？"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              variant="standard"
              InputProps={{ disableUnderline: true }}
              sx={{ fontSize: "20px" }}
              inputProps={{ maxLength: 280 }}
            />

            {/* Quoted Post Preview */}
            {quotedPost && (
              <Box sx={{ mt: 2 }}>
                <QuotedPostCard quotedPost={quotedPost} />
              </Box>
            )}

            {/* Image Previews */}
            {previews.length > 0 && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns:
                    previews.length === 1 ? "1fr" : "1fr 1fr",
                  gap: 1,
                  mt: 2,
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                {previews.map((preview, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: "relative",
                      paddingTop: "100%",
                      bgcolor: "action.hover",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      component="img"
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                    <IconButton
                      onClick={() => handleRemoveImage(index)}
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        bgcolor: "rgba(0, 0, 0, 0.7)",
                        color: "white",
                        "&:hover": {
                          bgcolor: "rgba(0, 0, 0, 0.9)",
                        },
                        width: 32,
                        height: 32,
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

            {/* Video Preview */}
            {videoPreview && (
              <VideoPreview
                videoUrl={videoPreview}
                onRemove={handleRemoveVideo}
                uploading={uploadingVideo}
                uploadProgress={uploadProgress}
                duration={videoDuration || undefined}
              />
            )}

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {/* Image input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
                {/* Video input */}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  style={{ display: "none" }}
                />
                {/* Image button - disabled if video is selected */}
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={selectedFiles.length >= 4 || !!selectedVideo}
                  sx={{
                    color: !!selectedVideo ? "action.disabled" : "secondary.main"
                  }}
                >
                  <ImageIcon />
                </IconButton>
                {/* Video button - disabled if images are selected */}
                <IconButton
                  onClick={() => videoInputRef.current?.click()}
                  disabled={selectedFiles.length > 0 || !!selectedVideo}
                  sx={{
                    color: selectedFiles.length > 0 || !!selectedVideo ? "action.disabled" : "secondary.main"
                  }}
                >
                  <VideoLibrary />
                </IconButton>
                <Box sx={{ color: "text.secondary", fontSize: "14px" }}>
                  {content.length}/280
                </Box>
              </Box>
              <Button
                type="submit"
                variant="contained"
                disabled={!content.trim() || loading || content.length > 280}
                sx={{
                  px: 3,
                }}
              >
                {loading ? "投稿中..." : "ポスト"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
