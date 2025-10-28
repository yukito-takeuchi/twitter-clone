"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { Notification } from "@/types/notification";
import NotificationItem from "./NotificationItem";

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  onMarkAsRead: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function NotificationList({
  notifications,
  loading,
  error,
  onMarkAsRead,
  onDelete,
}: NotificationListProps) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (notifications.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography variant="h6" color="text.secondary">
          通知はありません
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          アクティビティが発生すると、ここに表示されます
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
        />
      ))}
    </Box>
  );
}
