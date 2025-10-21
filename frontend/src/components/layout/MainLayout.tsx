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
          maxWidth: '1280px',
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
          }}
        >
          <LeftSidebar />
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            width: { xs: '100vw', md: '600px' },
            minWidth: { xs: '100vw', md: '600px' },
            maxWidth: '600px',
            borderRight: '1px solid',
            borderLeft: { xs: 'none', md: '1px solid' },
            borderColor: 'divider',
            minHeight: '100vh',
          }}
        >
          {children}
        </Box>

        {/* Right Sidebar */}
        <Box
          sx={{
            flex: 1,
            maxWidth: '350px',
            display: { xs: 'none', lg: 'block' },
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflowY: 'auto',
          }}
        >
          <RightSidebar />
        </Box>
      </Box>
    </Box>
  );
}
