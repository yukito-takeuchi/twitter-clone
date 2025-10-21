'use client';

import { Box, Container } from '@mui/material';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Left Sidebar - 2 */}
      <Box sx={{ flex: '0 0 275px', display: { xs: 'none', md: 'block' } }}>
        <LeftSidebar />
      </Box>

      {/* Main Content - 5 */}
      <Box
        sx={{
          flex: '1 1 600px',
          maxWidth: '600px',
          borderRight: '1px solid',
          borderLeft: { xs: 'none', md: '1px solid' },
          borderColor: 'divider',
        }}
      >
        {children}
      </Box>

      {/* Right Sidebar - 3 */}
      <Box sx={{ flex: '0 0 350px', display: { xs: 'none', lg: 'block' } }}>
        <RightSidebar />
      </Box>
    </Box>
  );
}
