'use client';

import { Box, IconButton, Modal } from '@mui/material';
import { Close, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useState, useEffect } from 'react';

interface ImageModalProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export default function ImageModal({ images, initialIndex = 0, open, onClose }: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Reset currentIndex when modal opens or initialIndex changes
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex]);

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) {
      return url;
    }
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${url}`;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0, 0, 0, 0.9)',
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: 'white',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.7)',
            },
            zIndex: 1,
          }}
        >
          <Close />
        </IconButton>

        {/* Previous Button */}
        {images.length > 1 && (
          <IconButton
            onClick={handlePrevious}
            sx={{
              position: 'absolute',
              left: 16,
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)',
              },
              zIndex: 1,
            }}
          >
            <ChevronLeft fontSize="large" />
          </IconButton>
        )}

        {/* Image */}
        <Box
          component="img"
          src={getImageUrl(images[currentIndex])}
          alt={`Image ${currentIndex + 1}`}
          onClick={(e) => e.stopPropagation()}
          sx={{
            maxWidth: '90%',
            maxHeight: '90%',
            objectFit: 'contain',
          }}
        />

        {/* Next Button */}
        {images.length > 1 && (
          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: 16,
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)',
              },
              zIndex: 1,
            }}
          >
            <ChevronRight fontSize="large" />
          </IconButton>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              px: 2,
              py: 0.5,
              borderRadius: 1,
              zIndex: 1,
            }}
          >
            {currentIndex + 1} / {images.length}
          </Box>
        )}
      </Box>
    </Modal>
  );
}
