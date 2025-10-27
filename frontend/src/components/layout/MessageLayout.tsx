'use client';

import { Box } from '@mui/material';
import LeftSidebar from './LeftSidebar';
import { ReactNode } from 'react';

interface MessageLayoutProps {
  conversationList: ReactNode;
  messageThread: ReactNode;
}

export default function MessageLayout({ conversationList, messageThread }: MessageLayoutProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          maxWidth: '1320px',
          minHeight: '100vh',
        }}
      >
        {/* Left Sidebar */}
        <Box
          sx={{
            width: '275px',
            minWidth: '275px',
            display: { xs: 'none', md: 'block' },
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <LeftSidebar />
        </Box>

        {/* Message List (40% of main + right sidebar area = 380px) */}
        <Box
          sx={{
            width: { xs: '100vw', sm: '100vw', md: '380px' },
            minWidth: { xs: '100vw', sm: '100vw', md: '380px' },
            maxWidth: { xs: '100vw', sm: '100vw', md: '380px' },
            borderRight: { xs: 'none', md: '1px solid' },
            borderLeft: { xs: 'none', md: '1px solid' },
            borderColor: 'divider',
            minHeight: '100vh',
            flexShrink: 0,
          }}
        >
          {conversationList}
        </Box>

        {/* Message Thread (60% of main + right sidebar area = 570px) */}
        <Box
          sx={{
            width: { xs: 0, lg: '570px' },
            minWidth: { xs: 0, lg: '570px' },
            maxWidth: { xs: 0, lg: '570px' },
            display: { xs: 'none', lg: 'block' },
            borderRight: { xs: 'none', lg: '1px solid' },
            borderColor: 'divider',
            minHeight: '100vh',
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {messageThread}
        </Box>
      </Box>
    </Box>
  );
}
