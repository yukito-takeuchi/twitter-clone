'use client';

import { Box } from '@mui/material';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
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

        {/* Main Content */}
        <Box
          sx={{
            width: { xs: '100vw', sm: '100vw', md: '600px' },
            minWidth: { xs: '100vw', sm: '100vw', md: '600px' },
            maxWidth: { xs: '100vw', sm: '100vw', md: '600px' },
            borderRight: { xs: 'none', md: '1px solid' },
            borderLeft: { xs: 'none', md: '1px solid' },
            borderColor: 'divider',
            minHeight: '100vh',
            flexShrink: 0,
          }}
        >
          {children}
        </Box>

        {/* Right Sidebar */}
        <Box
          sx={{
            flex: { xs: 0, lg: 1 },
            maxWidth: { xs: 0, lg: '350px' },
            display: { xs: 'none', lg: 'block' },
            minWidth: { lg: '350px' },
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'hidden',
          }}
        >
          <RightSidebar />
        </Box>
      </Box>
    </Box>
  );
}
