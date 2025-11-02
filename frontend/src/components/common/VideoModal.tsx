'use client';

import { Box, IconButton, Modal } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useEffect, useRef } from 'react';

interface VideoModalProps {
  videoUrl: string;
  open: boolean;
  onClose: () => void;
}

export default function VideoModal({ videoUrl, open, onClose }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const getVideoUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) {
      return url;
    }
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${url}`;
  };

  // Pause video when modal closes
  useEffect(() => {
    if (!open && videoRef.current) {
      videoRef.current.pause();
    }
  }, [open]);

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

        {/* Video */}
        <Box
          component="video"
          ref={videoRef}
          src={getVideoUrl(videoUrl)}
          controls
          autoPlay
          onClick={(e) => e.stopPropagation()}
          sx={{
            maxWidth: '90%',
            maxHeight: '90%',
            objectFit: 'contain',
          }}
        />
      </Box>
    </Modal>
  );
}
