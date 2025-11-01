'use client';

import { useState } from 'react';
import { Box } from '@mui/material';
import { PostWithStats } from '@/types';
import ImageModal from '@/components/common/ImageModal';

interface MediaGridProps {
  posts: PostWithStats[];
}

export default function MediaGrid({ posts }: MediaGridProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const getImageUrl = (url: string) => {
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
    </>
  );
}
