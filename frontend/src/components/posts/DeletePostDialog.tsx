'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from '@mui/material';
import { postApi } from '@/lib/api';

interface DeletePostDialogProps {
  open: boolean;
  postId: string;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeletePostDialog({ open, postId, onClose, onDeleted }: DeletePostDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await postApi.delete(postId);
      onDeleted();
      onClose();
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('投稿の削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (!deleting) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <DialogContent sx={{ pt: 4, px: 4, pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, fontSize: '20px' }}>
          ポストを削除しますか?
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
          この操作は取り消せません。プロフィール、あなたをフォローしているアカウントのタイムライン、
          X 検索結果から削除されます。
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 4, pb: 4, gap: 1.5, flexDirection: 'column' }}>
        <Button
          onClick={handleDelete}
          disabled={deleting}
          variant="contained"
          fullWidth
          sx={{
            borderRadius: '9999px',
            textTransform: 'none',
            fontWeight: 'bold',
            bgcolor: 'rgb(244, 33, 46)',
            color: 'white',
            py: 1.5,
            fontSize: '15px',
            '&:hover': {
              bgcolor: 'rgb(220, 30, 41)',
            },
          }}
        >
          {deleting ? '削除中...' : '削除'}
        </Button>
        <Button
          onClick={handleClose}
          disabled={deleting}
          variant="outlined"
          fullWidth
          sx={{
            borderRadius: '9999px',
            textTransform: 'none',
            fontWeight: 'bold',
            borderColor: 'divider',
            color: 'text.primary',
            py: 1.5,
            fontSize: '15px',
          }}
        >
          キャンセル
        </Button>
      </DialogActions>
    </Dialog>
  );
}
