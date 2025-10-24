'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  Typography,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { postApi } from '@/lib/api';

interface EditPostDialogProps {
  open: boolean;
  postId: string;
  initialContent: string;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditPostDialog({
  open,
  postId,
  initialContent,
  onClose,
  onUpdated,
}: EditPostDialogProps) {
  const [content, setContent] = useState(initialContent);
  const [updating, setUpdating] = useState(false);

  // Reset content when dialog opens or initialContent changes
  useEffect(() => {
    if (open) {
      setContent(initialContent);
    }
  }, [open, initialContent]);

  const handleUpdate = async () => {
    if (!content.trim() || updating) return;

    try {
      setUpdating(true);
      await postApi.update(postId, { content: content.trim() });
      onUpdated();
      onClose();
    } catch (error) {
      console.error('Failed to update post:', error);
      alert('投稿の更新に失敗しました');
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    if (!updating) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: 300,
        },
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handleClose} disabled={updating}>
            <Close />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            ポストを編集
          </Typography>
        </Box>
        <Button
          onClick={handleUpdate}
          disabled={!content.trim() || updating}
          variant="contained"
          sx={{
            borderRadius: '9999px',
            px: 3,
            textTransform: 'none',
            fontWeight: 'bold',
            bgcolor: 'rgb(29, 155, 240)',
            '&:hover': {
              bgcolor: 'rgb(26, 140, 216)',
            },
          }}
        >
          {updating ? '保存中...' : '保存'}
        </Button>
      </Box>

      {/* Content */}
      <DialogContent sx={{ p: 3 }}>
        <TextField
          fullWidth
          multiline
          minRows={5}
          placeholder="いまどうしてる？"
          variant="standard"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={updating}
          InputProps={{ disableUnderline: true }}
          sx={{
            fontSize: '18px',
            '& .MuiInputBase-input': {
              fontSize: '18px',
            },
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
