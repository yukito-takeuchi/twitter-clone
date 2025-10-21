'use client';

import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Divider } from '@mui/material';
import {
  Home,
  Search,
  Notifications,
  Person,
  Logout,
  LightMode,
  DarkMode,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';

export default function LeftSidebar() {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navItems = [
    { icon: <Home fontSize="large" />, label: 'ホーム', path: '/', active: true },
    { icon: <Search fontSize="large" />, label: '検索', path: '#', active: false },
    { icon: <Notifications fontSize="large" />, label: '通知', path: '#', active: false },
    {
      icon: <Person fontSize="large" />,
      label: 'プロフィール',
      path: user ? `/profile/${user.username}` : '#',
      active: !!user
    },
  ];

  return (
    <Box
      sx={{
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid',
        borderColor: 'divider',
        px: 2,
        py: 1,
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 2, mb: 1 }}>
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
        >
          <Box
            component="span"
            sx={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: 'text.primary',
            }}
          >
            𝕏
          </Box>
        </Box>
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => item.active && router.push(item.path)}
              disabled={!item.active}
              sx={{
                borderRadius: '9999px',
                py: 1.5,
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
                  fontWeight: item.active ? 'bold' : 'normal',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 1 }} />

      {/* Dark Mode Toggle */}
      <ListItem disablePadding sx={{ mb: 1 }}>
        <ListItemButton
          onClick={toggleTheme}
          sx={{
            borderRadius: '9999px',
            py: 1.5,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 56, color: 'text.primary' }}>
            {mode === 'dark' ? <LightMode fontSize="large" /> : <DarkMode fontSize="large" />}
          </ListItemIcon>
          <ListItemText
            primary={mode === 'dark' ? 'ライトモード' : 'ダークモード'}
            primaryTypographyProps={{
              fontSize: '20px',
            }}
          />
        </ListItemButton>
      </ListItem>

      {/* Logout */}
      <ListItem disablePadding sx={{ mb: 2 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: '9999px',
            py: 1.5,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 56, color: 'text.primary' }}>
            <Logout fontSize="large" />
          </ListItemIcon>
          <ListItemText
            primary="ログアウト"
            primaryTypographyProps={{
              fontSize: '20px',
            }}
          />
        </ListItemButton>
      </ListItem>
    </Box>
  );
}
