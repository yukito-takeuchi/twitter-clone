'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { PostWithStats } from '@/types';
import ImageModal from '@/components/common/ImageModal';
import VideoModal from '@/components/common/VideoModal';

interface MediaGridProps {
  posts: PostWithStats[];
}

// Format seconds to MM:SS
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function MediaGrid({ posts }: MediaGridProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>('');

  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) {
      return url;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    return `${baseUrl}${url}`;
  };

  const getVideoUrl = (url: string) => {
    if (url.startsWith('http')) {
      return url;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    return `${baseUrl}${url}`;
  };

  const handleImageClick = (post: PostWithStats) => {
    if (!post.image_url) return;

    // Parse all images from the post (comma-separated)
    const images = post.image_url.split(',').map(url => url.trim());

    // Set the images and open modal (always start at first image)
    setSelectedImages(images.map(getImageUrl));
    setSelectedIndex(0);
    setImageModalOpen(true);
  };

  const handleVideoClick = (post: PostWithStats) => {
    if (!post.video_url) return;

    setSelectedVideoUrl(post.video_url);
    setVideoModalOpen(true);
  };

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 0.5,
          p: 0,
        }}
      >
        {posts.map((post) => {
          // Handle video posts
          if (post.video_url) {
            const thumbnailUrl = post.video_thumbnail_url || post.video_url;

            return (
              <Box
                key={post.id}
                onClick={() => handleVideoClick(post)}
                sx={{
                  position: 'relative',
                  paddingTop: '100%', // Square aspect ratio (1:1)
                  bgcolor: 'action.hover',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.9,
                  },
                }}
              >
                {/* Video thumbnail */}
                <Box
                  component="img"
                  src={getVideoUrl(thumbnailUrl)}
                  alt="Video thumbnail"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                {/* Play icon overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <PlayArrow sx={{ color: 'white', fontSize: 32 }} />
                </Box>

                {/* Duration badge - left bottom */}
                {post.video_duration && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      left: 4,
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      color: 'white',
                      padding: '2px 4px',
                      borderRadius: 0.5,
                      pointerEvents: 'none',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                      {formatDuration(post.video_duration)}
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          }

          // Handle image posts
          if (!post.image_url) return null;

          // Get only the first image from each post
          const firstImage = post.image_url.split(',')[0].trim();

          return (
            <Box
              key={post.id}
              onClick={() => handleImageClick(post)}
              sx={{
                position: 'relative',
                paddingTop: '100%', // Square aspect ratio (1:1)
                bgcolor: 'action.hover',
                overflow: 'hidden',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.9,
                },
              }}
            >
              <Box
                component="img"
                src={getImageUrl(firstImage)}
                alt="Media"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
          );
        })}
      </Box>

      <ImageModal
        open={imageModalOpen}
        images={selectedImages}
        initialIndex={selectedIndex}
        onClose={() => setImageModalOpen(false)}
      />

      <VideoModal
        open={videoModalOpen}
        videoUrl={selectedVideoUrl}
        onClose={() => setVideoModalOpen(false)}
      />
    </>
  );
}
