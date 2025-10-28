"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Tabs, Tab, IconButton, Button } from "@mui/material";
import { Settings as SettingsIcon } from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationList from "@/components/notifications/NotificationList";
import MainLayout from "@/components/layout/MainLayout";

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0); // 0: すべて, 1: 認証済み

  const {
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(user?.id || null);

  // Filter notifications based on active tab
  // For now, "verified" tab shows the same as "all" since we don't have verification status
  const filteredNotifications = notifications;

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      {/* Header with Settings Icon */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: (theme) =>
            theme.palette.mode === "light"
              ? "rgba(255, 255, 255, 0.8)"
              : "rgba(0, 0, 0, 0.8)",
          borderBottom: "1px solid",
          borderColor: "divider",
          backdropFilter: "blur(10px)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
          }}
        >
          <Box sx={{ fontWeight: "bold", fontSize: "20px", color: "text.primary" }}>
            通知
          </Box>
          <IconButton
            onClick={() => router.push("/notifications/settings")}
            sx={{
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Tabs */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: (theme) =>
            theme.palette.mode === "light"
              ? "rgba(255, 255, 255, 0.8)"
              : "rgba(0, 0, 0, 0.8)",
          borderBottom: "1px solid",
          borderColor: "divider",
          backdropFilter: "blur(10px)",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            minHeight: "53px",
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: "normal",
              fontSize: "15px",
              minHeight: "53px",
              color: "text.secondary",
              "&.Mui-selected": {
                fontWeight: "bold",
                color: "text.primary",
              },
              "&:hover": {
                bgcolor: "action.hover",
              },
            },
            "& .MuiTabs-indicator": {
              height: "4px",
              borderRadius: "2px",
              backgroundColor: "rgb(29, 155, 240)",
            },
          }}
        >
          <Tab label="すべて" />
          <Tab label="認証済み" />
        </Tabs>
      </Box>

      {/* Mark all as read button */}
      {notifications.some((n) => !n.is_read) && (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button
            onClick={handleMarkAllAsRead}
            sx={{
              textTransform: "none",
              fontSize: "14px",
              color: "rgb(29, 155, 240)",
              "&:hover": {
                textDecoration: "underline",
                bgcolor: "transparent",
              },
            }}
          >
            すべて既読にする
          </Button>
        </Box>
      )}

      {/* Notification List */}
      <NotificationList
        notifications={filteredNotifications}
        loading={loading}
        error={error}
        onMarkAsRead={markAsRead}
        onDelete={deleteNotification}
      />
    </MainLayout>
  );
}
