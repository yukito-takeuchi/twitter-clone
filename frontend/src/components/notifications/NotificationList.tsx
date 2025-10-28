"use client";

import { useMemo } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Notification } from "@/types/notification";
import { groupNotifications, isGroupedNotification } from "@/utils/groupNotifications";
import NotificationItem from "./NotificationItem";
import NotificationGroupItem from "./NotificationGroupItem";

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  onMarkAsRead: (id: string) => void;
  onMarkMultipleAsRead?: (ids: string[]) => void;
  onDelete?: (id: string) => void;
}

export default function NotificationList({
  notifications,
  loading,
  error,
  onMarkAsRead,
  onMarkMultipleAsRead,
  onDelete,
}: NotificationListProps) {
  // Group notifications
  const groupedItems = useMemo(() => {
    return groupNotifications(notifications);
  }, [notifications]);

  const handleGroupMarkAsRead = (ids: string[]) => {
    if (onMarkMultipleAsRead) {
      onMarkMultipleAsRead(ids);
    } else {
      // Fallback: mark each notification individually
      ids.forEach((id) => onMarkAsRead(id));
    }
  };

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
      {groupedItems.map((item) => {
        if (isGroupedNotification(item)) {
          // Render grouped notification
          return (
            <NotificationGroupItem
              key={item.id}
              group={item}
              onMarkAsRead={handleGroupMarkAsRead}
            />
          );
        } else {
          // Render individual notification
          return (
            <NotificationItem
              key={item.id}
              notification={item}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
          );
        }
      })}
    </Box>
  );
}
