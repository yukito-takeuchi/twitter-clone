'use client';

import { Dialog, DialogContent, List, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Link as LinkIcon, Share as ShareIcon, Mail as MailIcon } from '@mui/icons-material';
import { useState } from 'react';

interface SharePostDialogProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  postUrl?: string;
}

export default function SharePostDialog({
  open,
  onClose,
  postId,
  postUrl,
}: SharePostDialogProps) {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Generate post URL
  const fullPostUrl = postUrl || `${window.location.origin}/post/${postId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullPostUrl);
      setCopySuccess('リンクをコピーしました');
      setTimeout(() => {
        setCopySuccess(null);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          minWidth: 300,
          maxWidth: 400,
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {copySuccess ? (
          <div className="p-6 text-center">
            <p className="text-green-600 dark:text-green-400 font-medium">{copySuccess}</p>
          </div>
        ) : (
          <List sx={{ py: 1 }}>
            <ListItemButton onClick={handleCopyLink} sx={{ py: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 48 }}>
                <LinkIcon />
              </ListItemIcon>
              <ListItemText
                primary="リンクをコピー"
                primaryTypographyProps={{
                  fontSize: '15px',
                  fontWeight: 500,
                }}
              />
            </ListItemButton>

            <Divider />

            <ListItemButton disabled sx={{ py: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 48 }}>
                <ShareIcon />
              </ListItemIcon>
              <ListItemText
                primary="その他の方法でポストを共有…"
                primaryTypographyProps={{
                  fontSize: '15px',
                  fontWeight: 500,
                }}
              />
            </ListItemButton>

            <Divider />

            <ListItemButton disabled sx={{ py: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 48 }}>
                <MailIcon />
              </ListItemIcon>
              <ListItemText
                primary="ダイレクトメッセージで送信"
                primaryTypographyProps={{
                  fontSize: '15px',
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}
