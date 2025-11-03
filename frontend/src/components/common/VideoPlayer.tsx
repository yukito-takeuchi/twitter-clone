"use client";

import React, { useRef, useEffect, useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { VolumeOff, VolumeUp, PlayArrow, Pause } from "@mui/icons-material";

interface VideoPlayerProps {
  videoUrl: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  showDuration?: boolean;
  duration?: number; // Duration in seconds from backend
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

// Format seconds to MM:SS
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function VideoPlayer({
  videoUrl,
  autoPlay = false,
  muted = true,
  controls = false,
  showDuration = true,
  duration,
  className,
  onClick,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isHovered, setIsHovered] = useState(false);
  const [videoDuration, setVideoDuration] = useState(duration || 0);

  // Get full URL
  const getVideoUrl = (url: string) => {
    if (url.startsWith("http")) {
      return url;
    }
    return `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${url}`;
  };

  // Intersection Observer for auto-play
  useEffect(() => {
    if (!autoPlay || !videoRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {
              // Auto-play failed, user interaction required
            });
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.5 } // Play when 50% visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [autoPlay]);

  // Update duration when video metadata is loaded
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (!duration && video.duration) {
        setVideoDuration(video.duration);
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [duration]);

  // Track play/pause state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <Box
      ref={containerRef}
      className={className}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <video
        ref={videoRef}
        src={getVideoUrl(videoUrl)}
        muted={isMuted}
        loop
        playsInline
        controls={controls}
        style={{
          maxWidth: "100%",
          maxHeight: "400px",
          width: "auto",
          height: "auto",
          display: "block",
          objectFit: "contain",
        }}
      />

      {/* Duration overlay - left bottom */}
      {showDuration && videoDuration > 0 && (
        <Box
          sx={{
            position: "absolute",
            bottom: 8,
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
            {formatDuration(videoDuration)}
          </Typography>
        </Box>
      )}

      {/* Custom controls overlay (only when not using native controls) */}
      {!controls && isHovered && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            transition: "opacity 0.2s",
          }}
        >
          {/* Play/Pause button */}
          <IconButton
            onClick={togglePlayPause}
            sx={{
              color: "white",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
              },
            }}
          >
            {isPlaying ? <Pause fontSize="large" /> : <PlayArrow fontSize="large" />}
          </IconButton>

          {/* Mute/Unmute button - bottom right */}
          <IconButton
            onClick={toggleMute}
            sx={{
              position: "absolute",
              bottom: 8,
              right: 8,
              color: "white",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              padding: "4px",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
              },
            }}
            size="small"
          >
            {isMuted ? <VolumeOff fontSize="small" /> : <VolumeUp fontSize="small" />}
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
