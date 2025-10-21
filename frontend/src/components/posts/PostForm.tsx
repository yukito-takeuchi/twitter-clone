'use client';

import { useState } from 'react';
import { Box, TextField, Button, Avatar, Paper } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { postApi } from '@/lib/api';

interface PostFormProps {
  onPostCreated?: () => void;
}

export default function PostForm({ onPostCreated }: PostFormProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setLoading(true);
    try {
      await postApi.create({
        user_id: user.id,
        content: content.trim(),
      });
      setContent('');
      onPostCreated?.();
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('投稿に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Avatar>{user.display_name?.[0] || user.username[0]}</Avatar>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder="いまどうしてる？"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              variant="standard"
              InputProps={{ disableUnderline: true }}
              sx={{ fontSize: '20px' }}
              inputProps={{ maxLength: 280 }}
            />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 2,
              }}
            >
              <Box sx={{ color: 'text.secondary', fontSize: '14px' }}>
                {content.length}/280
              </Box>
              <Button
                type="submit"
                variant="contained"
                disabled={!content.trim() || loading || content.length > 280}
                sx={{
                  bgcolor: '#000',
                  '&:hover': { bgcolor: '#333' },
                  borderRadius: '9999px',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  px: 3,
                }}
              >
                {loading ? '投稿中...' : 'ポスト'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
