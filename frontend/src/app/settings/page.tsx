'use client';

import { useRouter } from 'next/navigation';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Person,
  Security,
  Lock,
  Notifications,
  Accessibility,
  Help,
  ChevronRight,
} from '@mui/icons-material';
import Header from '@/components/layout/Header';
import MainLayout from '@/components/layout/MainLayout';

export default function SettingsPage() {
  const router = useRouter();

  const settingsItems = [
    { icon: <Person />, label: 'アカウント', path: null, disabled: true },
    { icon: <Security />, label: 'セキュリティとアカウントアクセス', path: null, disabled: true },
    { icon: <Lock />, label: 'プライバシーと安全', path: null, disabled: true },
    { icon: <Notifications />, label: '通知', path: '/notifications/settings', disabled: false },
    { icon: <Accessibility />, label: 'アクセシビリティ、表示、言語', path: '/settings/accessibility', disabled: false },
    { icon: <Help />, label: 'その他のリソース', path: null, disabled: true },
  ];

  return (
    <MainLayout>
      <Header title="設定" />

      <List sx={{ py: 0 }}>
        {settingsItems.map((item, index) => (
          <ListItemButton
            key={index}
            onClick={() => item.path && router.push(item.path)}
            disabled={item.disabled}
            sx={{
              py: 2,
              px: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover',
              },
              '&.Mui-disabled': {
                opacity: 0.5,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 48 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '15px',
                fontWeight: 500,
              }}
            />
            {!item.disabled && (
              <ChevronRight sx={{ color: 'text.secondary' }} />
            )}
          </ListItemButton>
        ))}
      </List>
    </MainLayout>
  );
}
