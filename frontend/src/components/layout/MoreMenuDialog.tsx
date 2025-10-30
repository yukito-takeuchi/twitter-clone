"use client";

import { useRouter } from "next/navigation";
import {
  Popover,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
} from "@mui/material";
import {
  Chat,
  MonetizationOn,
  PersonAdd,
  Campaign,
  Mic,
  Settings,
} from "@mui/icons-material";

interface MoreMenuDialogProps {
  open: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
}

export default function MoreMenuDialog({
  open,
  onClose,
  anchorEl,
}: MoreMenuDialogProps) {
  const router = useRouter();

  const handleSettings = () => {
    onClose();
    router.push("/settings");
  };

  const menuItems = [
    { icon: <Chat />, label: "チャット", onClick: null, disabled: true },
    {
      icon: <MonetizationOn />,
      label: "収益化",
      onClick: null,
      disabled: true,
    },
    {
      icon: <PersonAdd />,
      label: "フォローリクエスト",
      onClick: null,
      disabled: true,
    },
    { icon: <Campaign />, label: "広告", onClick: null, disabled: true },
    { icon: <Mic />, label: "スペースを作成", onClick: null, disabled: true },
    {
      icon: <Settings />,
      label: "設定とプライバシー",
      onClick: handleSettings,
      disabled: false,
    },
  ];

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      transformOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          minWidth: 300,
          boxShadow: "0px 0px 15px rgba(101, 119, 134, 0.2)",
          border: "1px solid",
          borderColor: "divider",
        },
      }}
    >
      <Box sx={{ py: 1 }}>
        <List sx={{ py: 0 }}>
          {menuItems.map((item, index) => (
            <ListItemButton
              key={index}
              onClick={item.onClick || undefined}
              disabled={item.disabled}
              sx={{
                py: 1.5,
                px: 2,
                "&:hover": {
                  bgcolor: "action.hover",
                },
                "&.Mui-disabled": {
                  opacity: 0.5,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 48 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: "15px",
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Popover>
  );
}
