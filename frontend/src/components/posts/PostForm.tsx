"use client";

import { useState, useRef } from "react";
import {
  Box,
  TextField,
  Button,
  Avatar,
  Paper,
  IconButton,
} from "@mui/material";
import { Image as ImageIcon, Close } from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { postApi, imageApi } from "@/lib/api";

interface PostFormProps {
  onPostCreated?: () => void;
}

export default function PostForm({ onPostCreated }: PostFormProps) {
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      await postApi.create({
        user_id: user.id,
        content: content.trim(),
        image_url: imageUrl,
      });

      setContent("");
      setSelectedFiles([]);
      setPreviews([]);
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

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={selectedFiles.length >= 4}
                  sx={{ color: "secondary.main" }}
                >
                  <ImageIcon />
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
