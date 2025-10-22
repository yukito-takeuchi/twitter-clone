'use client';

import { useState } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Typography, Button, Menu, MenuItem } from '@mui/material';
import {
  Home,
  Search,
  Notifications,
  Mail,
  Bookmark,
  Person,
  MoreHoriz,
  Group,
  Verified,
  ListAlt,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LeftSidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);

  const navItems = [
    { icon: <Home fontSize="large" />, label: 'ホーム', path: '/', active: true },
    { icon: <Search fontSize="large" />, label: '検索', path: '#', active: false },
    { icon: <Notifications fontSize="large" />, label: '通知', path: '#', active: false },
    { icon: <Mail fontSize="large" />, label: 'メッセージ', path: '#', active: false },
    { icon: <span style={{ fontSize: '28px' }}>𝕏</span>, label: 'Grok', path: '#', active: false },
    { icon: <ListAlt fontSize="large" />, label: 'リスト', path: '#', active: false },
    { icon: <Bookmark fontSize="large" />, label: 'ブックマーク', path: '#', active: false },
    { icon: <Group fontSize="large" />, label: 'コミュニティ', path: '#', active: false },
    { icon: <Verified fontSize="large" />, label: '認証済みマーク', path: '#', active: false },
    {
      icon: <Person fontSize="large" />,
      label: 'プロフィール',
      path: user ? `/profile/${user.username}` : '#',
      active: !!user
    },
    { icon: <MoreHoriz fontSize="large" />, label: 'もっと見る', path: '#', active: false },
  ];

  const handleLogout = async () => {
    setMenuAnchorEl(null);
    await logout();
    router.push('/login');
  };

  const handleMoreClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleUserClick = () => {
    if (user) {
      router.push(`/profile/${user.username}`);
    }
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return '';
    if (url.startsWith('http')) {
      return url;
    }
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${url}`;
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        px: 1,
        py: 1,
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 1.5, mb: 0.5 }}>
        <Box
          sx={{
            width: 50,
            height: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            '&:hover': {
              bgcolor: 'action.hover',
            },
            cursor: 'pointer',
          }}
          onClick={() => router.push('/')}
        >
          <svg
            viewBox="0 0 24 24"
            width="30"
            height="30"
            fill="currentColor"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </Box>
      </Box>

      {/* Navigation */}
      <List sx={{ px: 0, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ mb: 0.25 }}>
            <ListItemButton
              onClick={() => item.active && router.push(item.path)}
              disabled={!item.active}
              sx={{
                borderRadius: '9999px',
                py: 1.5,
                px: 2,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 56, color: 'text.primary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '20px',
                  fontWeight: item.path === '/' || item.path.includes('/profile') ? 'bold' : 'normal',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Post Button */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => router.push('/')}
          sx={{
            borderRadius: '9999px',
            py: 1.5,
            fontSize: '17px',
            fontWeight: 'bold',
            textTransform: 'none',
            bgcolor: 'rgb(29, 155, 240)',
            '&:hover': {
              bgcolor: 'rgb(26, 140, 216)',
            },
          }}
        >
          ポスト
        </Button>
      </Box>

      {/* User Info */}
      {user && (
        <>
          <Box
            onClick={handleUserClick}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              borderRadius: '9999px',
              cursor: 'pointer',
              mb: 1,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Avatar
              src={getImageUrl(user.avatar_url || null)}
              sx={{ width: 40, height: 40 }}
            >
              {!user.avatar_url && (user.display_name?.[0] || user.username[0])}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 'bold',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.display_name || user.username}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                @{user.username}
              </Typography>
            </Box>
            <Box
              onClick={handleMoreClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  '& svg': {
                    color: 'primary.main',
                  },
                },
              }}
            >
              <MoreHoriz sx={{ color: 'text.primary' }} />
            </Box>
          </Box>

          {/* Account Menu */}
          <Menu
            anchorEl={menuAnchorEl}
            open={menuOpen}
            onClose={() => setMenuAnchorEl(null)}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            PaperProps={{
              sx: {
                width: 300,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                mt: -1,
              },
            }}
          >
            <MenuItem
              disabled
              sx={{
                py: 1.5,
                px: 2,
                fontSize: '15px',
                fontWeight: 'bold',
              }}
            >
              既存のアカウントを追加
            </MenuItem>
            <MenuItem
              onClick={handleLogout}
              sx={{
                py: 1.5,
                px: 2,
                fontSize: '15px',
                fontWeight: 'bold',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              @{user.username} からログアウト
            </MenuItem>
          </Menu>
        </>
      )}
    </Box>
  );
}
