'use client';

import {
  Box,
  List,
  ListItem,
  ListItemText,
  Switch,
  Typography,
} from '@mui/material';
import Header from '@/components/layout/Header';
import MainLayout from '@/components/layout/MainLayout';
import { useTheme } from '@/contexts/ThemeContext';

export default function AccessibilityPage() {
  const { mode, toggleTheme } = useTheme();

  const isDarkMode = mode === 'dark';

  return (
    <MainLayout>
      <Header title="アクセシビリティ、表示、言語" />

      <List sx={{ py: 0 }}>
        {/* Dark Mode Setting */}
        <ListItem
          sx={{
            py: 2,
            px: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <ListItemText
            primary="ダークモード"
            secondary="画面の明るさを下げ、目への負担を軽減します"
            primaryTypographyProps={{
              fontSize: '15px',
              fontWeight: 500,
            }}
            secondaryTypographyProps={{
              fontSize: '13px',
              color: 'text.secondary',
              mt: 0.5,
            }}
          />
          <Switch
            checked={isDarkMode}
            onChange={toggleTheme}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: 'rgb(29, 155, 240)',
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: 'rgb(29, 155, 240)',
              },
            }}
          />
        </ListItem>

        {/* Display Setting (Disabled) */}
        <ListItem
          sx={{
            py: 2,
            px: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            opacity: 0.5,
          }}
        >
          <ListItemText
            primary="表示"
            secondary="フォントサイズ、色、背景をカスタマイズ"
            primaryTypographyProps={{
              fontSize: '15px',
              fontWeight: 500,
            }}
            secondaryTypographyProps={{
              fontSize: '13px',
              color: 'text.secondary',
              mt: 0.5,
            }}
          />
          <Switch disabled />
        </ListItem>

        {/* Language Setting (Disabled) */}
        <ListItem
          sx={{
            py: 2,
            px: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            opacity: 0.5,
          }}
        >
          <ListItemText
            primary="言語"
            secondary="表示言語を変更"
            primaryTypographyProps={{
              fontSize: '15px',
              fontWeight: 500,
            }}
            secondaryTypographyProps={{
              fontSize: '13px',
              color: 'text.secondary',
              mt: 0.5,
            }}
          />
          <Switch disabled />
        </ListItem>
      </List>

      <Box sx={{ p: 2, bgcolor: 'action.hover', mx: 2, mt: 2, borderRadius: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13px' }}>
          現在のテーマ: {isDarkMode ? 'ダーク' : 'ライト'}
        </Typography>
      </Box>
    </MainLayout>
  );
}
