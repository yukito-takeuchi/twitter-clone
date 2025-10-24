"use client";

import { useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Home,
  Search,
  Notifications,
  Mail,
  Bookmark,
  Person,
  MoreHoriz,
  Group,
  Verified,
  ListAlt,
  Chat,
  MonetizationOn,
  PersonAdd,
  Campaign,
  Mic,
  Settings,
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function LeftSidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);

  const navItems = [
    {
      icon: <Home fontSize="medium" />,
      label: "ホーム",
      path: "/",
      active: true,
    },
    {
      icon: <Search fontSize="medium" />,
      label: "検索",
      path: "#",
      active: false,
    },
    {
      icon: <Notifications fontSize="medium" />,
      label: "通知",
      path: "#",
      active: false,
    },
    {
      icon: <Mail fontSize="medium" />,
      label: "メッセージ",
      path: "#",
      active: false,
    },
    {
      icon: <span style={{ fontSize: "24px" }}>𝕏</span>,
      label: "Grok",
      path: "#",
      active: false,
    },
    {
      icon: <ListAlt fontSize="medium" />,
      label: "リスト",
      path: "#",
      active: false,
    },
    {
      icon: <Bookmark fontSize="medium" />,
      label: "ブックマーク",
      path: "#",
      active: false,
    },
    {
      icon: <Group fontSize="medium" />,
      label: "コミュニティ",
      path: "#",
      active: false,
    },
    {
      icon: <Verified fontSize="medium" />,
      label: "認証済みマーク",
      path: "#",
      active: false,
    },
    {
      icon: <Person fontSize="medium" />,
      label: "プロフィール",
      path: user ? `/profile/${user.username}` : "#",
      active: !!user,
    },
    {
      icon: <MoreHoriz fontSize="medium" />,
      label: "もっと見る",
      path: "#",
      active: false,
    },
  ];

  const handleLogout = async () => {
    setMenuAnchorEl(null);
    await logout();
    router.push("/login");
  };

  const handleMoreClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleUserClick = () => {
    if (user) {
      router.push(`/profile/${user.username}`);
    }
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith("http")) {
      return url;
    }
    return `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${url}`;
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        px: 1,
        py: 1,
      }}
    >
      {/* Logo + Navigation */}
      <Box
        sx={{ flex: 1, maxHeight: "calc(100vh - 180px)", overflow: "hidden" }}
      >
        {/* Logo */}
        <Box sx={{ p: 1.5, mb: 0.25 }}>
          <Box
            sx={{
              width: 50,
              height: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              "&:hover": {
                bgcolor: "action.hover",
              },
              cursor: "pointer",
            }}
            onClick={() => router.push("/")}
          >
            <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </Box>
        </Box>

        {/* Navigation */}
        <List sx={{ px: 0 }}>
          {navItems.map((item) => (
            <ListItem
              key={item.label}
              disablePadding
              sx={{ mb: { xs: 0, sm: 0.125, md: 0.25 } }}
            >
              <ListItemButton
                onClick={() => item.active && router.push(item.path)}
                disabled={!item.active}
                sx={{
                  borderRadius: "9999px",
                  py: { xs: 0.25, sm: 0.375, md: 0.5 },
                  px: 2,
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: { xs: 40, sm: 48, md: 56 },
                    color: "text.primary",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: { xs: "16px", sm: "18px", md: "20px" },
                    fontWeight:
                      item.path === "/" || item.path.includes("/profile")
                        ? "bold"
                        : "normal",
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Post Button */}
      <Box sx={{ px: 2, mb: 3 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => router.push("/")}
          sx={{
            borderRadius: "9999px",
            py: 1.5,
            fontSize: "17px",
            fontWeight: "bold",
            textTransform: "none",
            bgcolor: "rgb(29, 155, 240)",
            "&:hover": {
              bgcolor: "rgb(26, 140, 216)",
            },
          }}
        >
          ポスト
        </Button>
      </Box>

      {/* User Info */}
      {user && (
        <>
          <Box
            onClick={handleUserClick}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 1.5,
              borderRadius: "9999px",
              cursor: "pointer",
              mb: 2,
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            <Avatar
              src={user.avatar_url ? getImageUrl(user.avatar_url) : undefined}
              sx={{ width: 40, height: 40 }}
            >
              {!user.avatar_url && (user.display_name?.[0] || user.username[0])}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: "bold",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.display_name || user.username}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                @{user.username}
              </Typography>
            </Box>
            <Box
              onClick={handleMoreClick}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "&:hover": {
                  "& svg": {
                    color: "primary.main",
                  },
                },
              }}
            >
              <MoreHoriz sx={{ color: "text.primary" }} />
            </Box>
          </Box>

          {/* Account Menu */}
          <Menu
            anchorEl={menuAnchorEl}
            open={menuOpen}
            onClose={() => setMenuAnchorEl(null)}
            anchorOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
            PaperProps={{
              sx: {
                width: 300,
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                mt: -1,
              },
            }}
          >
            <MenuItem
              disabled
              sx={{
                py: 1.5,
                px: 2,
                fontSize: "15px",
                fontWeight: "bold",
              }}
            >
              既存のアカウントを追加
            </MenuItem>
            <MenuItem
              onClick={handleLogout}
              sx={{
                py: 1.5,
                px: 2,
                fontSize: "15px",
                fontWeight: "bold",
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              @{user.username} からログアウト
            </MenuItem>
          </Menu>
        </>
      )}
    </Box>
  );
}
