'use client';

import { Dialog, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import {
  Delete,
  Edit,
  PushPin,
  Code,
  BarChart,
} from '@mui/icons-material';

interface PostMenuDialogProps {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPin?: () => void;
  isPinned?: boolean;
  showPinOption?: boolean;
}

export default function PostMenuDialog({ open, onClose, onEdit, onDelete, onPin, isPinned = false, showPinOption = false }: PostMenuDialogProps) {
  const handleEdit = () => {
    onClose();
    onEdit();
  };

  const handleDelete = () => {
    onClose();
    onDelete();
  };

  const handlePin = () => {
    onClose();
    if (onPin) onPin();
  };

  const handleClose = (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    // Stop event propagation to prevent parent PostCard from navigating
    onClose();
  };

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
        {/* 削除 - 実装 */}
        <ListItemButton
          onClick={handleDelete}
          sx={{
            py: 1.5,
            px: 2,
            '&:hover': {
              bgcolor: 'rgba(244, 33, 46, 0.1)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'rgb(244, 33, 46)' }}>
            <Delete />
          </ListItemIcon>
          <ListItemText
            primary="削除"
            primaryTypographyProps={{
              fontWeight: 'bold',
              color: 'rgb(244, 33, 46)',
            }}
          />
        </ListItemButton>

        {/* ポストを編集 - 実装 */}
        <ListItemButton
          onClick={handleEdit}
          sx={{
            py: 1.5,
            px: 2,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Edit />
          </ListItemIcon>
          <ListItemText
            primary="ポストを編集"
            primaryTypographyProps={{
              fontWeight: 'bold',
            }}
          />
        </ListItemButton>

        {/* プロフィールに固定 */}
        {showPinOption && (
          <ListItemButton
            onClick={handlePin}
            sx={{
              py: 1.5,
              px: 2,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <PushPin />
            </ListItemIcon>
            <ListItemText
              primary={isPinned ? "プロフィールへの固定を解除" : "プロフィールに固定"}
              primaryTypographyProps={{
                fontWeight: 'bold',
              }}
            />
          </ListItemButton>
        )}

        {/* ポストの埋め込み - デザインのみ */}
        <ListItemButton
          disabled
          sx={{
            py: 1.5,
            px: 2,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Code />
          </ListItemIcon>
          <ListItemText
            primary="ポストの埋め込み"
            primaryTypographyProps={{
              fontWeight: 'bold',
            }}
          />
        </ListItemButton>

        {/* ポストのアナリティクスを表示 - デザインのみ */}
        <ListItemButton
          disabled
          sx={{
            py: 1.5,
            px: 2,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <BarChart />
          </ListItemIcon>
          <ListItemText
            primary="ポストのアナリティクスを表示"
            primaryTypographyProps={{
              fontWeight: 'bold',
            }}
          />
        </ListItemButton>
      </List>
    </Dialog>
  );
}
