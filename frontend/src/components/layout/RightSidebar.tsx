'use client';

import { Box, TextField, Typography, Paper, Avatar, Button, InputAdornment } from '@mui/material';
import { Search } from '@mui/icons-material';

export default function RightSidebar() {
  const suggestedUsers = [
    { name: 'おすすめユーザー1', username: 'user1' },
    { name: 'おすすめユーザー2', username: 'user2' },
    { name: 'おすすめユーザー3', username: 'user3' },
  ];

  return (
    <Box
      sx={{
        height: '100vh',
        position: 'sticky',
        top: 0,
        px: 3,
        py: 1,
        overflowY: 'auto',
      }}
    >
      {/* Search Box */}
      <Box sx={{ pt: 1, pb: 2 }}>
        <TextField
          fullWidth
          placeholder="検索"
          variant="outlined"
          size="small"
          disabled
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            sx: {
              borderRadius: '9999px',
              bgcolor: 'action.hover',
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
            },
          }}
        />
      </Box>

      {/* Suggested Users */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            おすすめユーザー
          </Typography>

          {suggestedUsers.map((user, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1.5,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                borderRadius: 1,
                px: 1,
                cursor: 'pointer',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 40, height: 40 }}>{user.name[0]}</Avatar>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {user.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    @{user.username}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                size="small"
                disabled
                sx={{
                  textTransform: 'none',
                  borderRadius: '9999px',
                  px: 2,
                }}
              >
                フォロー
              </Button>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            p: 2,
            pt: 0,
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Typography variant="body2" sx={{ color: 'secondary.main' }}>
            さらに表示
          </Typography>
        </Box>
      </Paper>

      {/* Footer Links */}
      <Box sx={{ mt: 3, px: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          利用規約 · プライバシーポリシー · Cookie
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
          © 2024 X Clone
        </Typography>
      </Box>
    </Box>
  );
}
