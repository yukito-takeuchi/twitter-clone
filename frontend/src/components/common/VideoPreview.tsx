"use client";

import React from "react";
import { Box, IconButton, LinearProgress, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";

interface VideoPreviewProps {
  videoUrl: string;
  onRemove: () => void;
  uploading?: boolean;
  uploadProgress?: number;
  duration?: number;
}

// Format seconds to MM:SS
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function VideoPreview({
  videoUrl,
  onRemove,
  uploading = false,
  uploadProgress = 0,
  duration,
}: VideoPreviewProps) {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: 500,
        borderRadius: 2,
        overflow: "hidden",
        backgroundColor: "black",
        mt: 2,
      }}
    >
      {/* Video element */}
      <video
        src={videoUrl}
        controls
        style={{
          width: "100%",
          height: "auto",
          maxHeight: 400,
          display: "block",
        }}
      />

      {/* Duration badge - left bottom */}
      {duration && (
        <Box
          sx={{
            position: "absolute",
            bottom: 48, // Above controls
            left: 8,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "2px 6px",
            borderRadius: 1,
            fontSize: "0.75rem",
            fontWeight: 600,
            pointerEvents: "none",
          }}
        >
          <Typography variant="caption" sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
            {formatDuration(duration)}
          </Typography>
        </Box>
      )}

      {/* Remove button - top right */}
      {!uploading && (
        <IconButton
          onClick={onRemove}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.9)",
            },
          }}
          size="small"
        >
          <Close fontSize="small" />
        </IconButton>
      )}

      {/* Upload progress overlay */}
      {uploading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>
            アップロード中... {uploadProgress}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={uploadProgress}
            sx={{
              width: "80%",
              height: 8,
              borderRadius: 4,
              backgroundColor: "rgba(255, 255, 255, 0.3)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: "rgb(29, 155, 240)",
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
