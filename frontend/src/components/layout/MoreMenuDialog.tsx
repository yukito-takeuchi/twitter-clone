'use client';

import { useRouter } from 'next/navigation';
import { Dialog, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import {
  Chat,
  MonetizationOn,
  PersonAdd,
  Campaign,
  Mic,
  Settings,
} from '@mui/icons-material';

interface MoreMenuDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function MoreMenuDialog({ open, onClose }: MoreMenuDialogProps) {
  const router = useRouter();

  const handleSettings = () => {
    onClose();
    router.push('/settings');
  };

  const handleClose = (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    onClose();
  };

  const menuItems = [
    { icon: <Chat />, label: 'チャット', onClick: null, disabled: true },
    { icon: <MonetizationOn />, label: '収益化', onClick: null, disabled: true },
    { icon: <PersonAdd />, label: 'フォローリクエスト', onClick: null, disabled: true },
    { icon: <Campaign />, label: '広告', onClick: null, disabled: true },
    { icon: <Mic />, label: 'スペースを作成', onClick: null, disabled: true },
    { icon: <Settings />, label: '設定とプライバシー', onClick: handleSettings, disabled: false },
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          minWidth: 320,
        },
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <List sx={{ py: 1 }}>
        {menuItems.map((item, index) => (
          <ListItemButton
            key={index}
            onClick={item.onClick || undefined}
            disabled={item.disabled}
            sx={{
              py: 1.5,
              px: 2,
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
          </ListItemButton>
        ))}
      </List>
    </Dialog>
  );
}
