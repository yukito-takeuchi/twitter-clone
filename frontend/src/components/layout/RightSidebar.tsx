'use client';

import { Box, TextField, Typography, Paper, Avatar, Button, InputAdornment } from '@mui/material';
import { Search, MoreHoriz } from '@mui/icons-material';

export default function RightSidebar() {
  const suggestedUsers = [
    { name: 'おすすめユーザー1', username: 'user1' },
    { name: 'おすすめユーザー2', username: 'user2' },
    { name: 'おすすめユーザー3', username: 'user3' },
  ];

  const trendingTopics = [
    { category: 'エンタメ', topic: 'トレンド1', posts: '12.5K' },
    { category: 'テクノロジー', topic: 'トレンド2', posts: '8.3K' },
    { category: 'スポーツ', topic: 'トレンド3', posts: '5.1K' },
    { category: 'ビジネス', topic: 'トレンド4', posts: '3.2K' },
  ];

  return (
    <Box
      sx={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        px: 2.5,
        py: 1,
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE and Edge
      }}
    >
      {/* Search Box */}
      <Box sx={{ pt: 1, pb: 2, position: 'sticky', top: 0, bgcolor: 'background.default', zIndex: 1 }}>
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

      {/* Content Area */}
      <Box>
        {/* What's Happening (上に配置) */}
        <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          mb: 2,
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '20px', mb: 2 }}>
            「いま」を見つけよう
          </Typography>

          {trendingTopics.map((trend, index) => (
            <Box
              key={index}
              sx={{
                py: 1.5,
                px: 1,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                borderRadius: 1,
                cursor: 'pointer',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {trend.category} · トレンド
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                    {trend.topic}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    {trend.posts} ポスト
                  </Typography>
                </Box>
                <MoreHoriz sx={{ color: 'text.secondary', fontSize: '20px' }} />
              </Box>
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
          <Typography variant="body2" sx={{ color: 'rgb(29, 155, 240)' }}>
            さらに表示
          </Typography>
        </Box>
      </Paper>

      {/* Suggested Users (下に配置) */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          mb: 2,
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '20px', mb: 2 }}>
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
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
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
                  fontWeight: 'bold',
                  bgcolor: 'text.primary',
                  color: 'background.default',
                  '&:hover': {
                    bgcolor: 'text.primary',
                  },
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
          <Typography variant="body2" sx={{ color: 'rgb(29, 155, 240)' }}>
            さらに表示
          </Typography>
        </Box>
      </Paper>

      {/* Footer Links */}
      <Box sx={{ px: 2, pb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {['利用規約', 'プライバシーポリシー', 'Cookie', 'アクセシビリティ', '広告', 'もっと見る'].map((link) => (
            <Typography
              key={link}
              variant="caption"
              sx={{
                color: 'text.secondary',
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              {link}
            </Typography>
          ))}
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
          © 2024 X Clone
        </Typography>
      </Box>
      </Box>
    </Box>
  );
}
