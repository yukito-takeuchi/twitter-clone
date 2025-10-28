import { useState, useEffect, useCallback } from "react";
import { Notification, NotificationType, NotificationStats } from "@/types/notification";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      console.log("[useNotifications] No userId, skipping fetch");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}/notifications?userId=${userId}&limit=50&offset=0`;
      console.log("[useNotifications] Fetching from:", url);

      const response = await fetch(url);

      console.log("[useNotifications] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[useNotifications] Error response:", errorText);
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      console.log("[useNotifications] Received data:", data);
      setNotifications(data.data.notifications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("[useNotifications] Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      const url = `${API_BASE_URL}/notifications/count?userId=${userId}`;
      console.log("[useNotifications] Fetching unread count from:", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch unread count");
      }

      const data = await response.json();
      console.log("[useNotifications] Unread count data:", data);
      setUnreadCount(data.data.count || 0);
    } catch (err) {
      console.error("[useNotifications] Error fetching unread count:", err);
    }
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          is_read: true,
          read_at: notif.read_at || new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }, [userId]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete notification");
      }

      // Update local state
      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notificationId)
      );
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  }, []);

  const fetchNotificationsByType = useCallback(
    async (type: NotificationType) => {
      if (!userId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/notifications/type?userId=${userId}&type=${type}&limit=50&offset=0`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch notifications by type");
        }

        const data = await response.json();
        setNotifications(data.data.notifications || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching notifications by type:", err);
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const fetchStats = useCallback(async (): Promise<NotificationStats | null> => {
    if (!userId) return null;

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/stats?userId=${userId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notification stats");
      }

      const data = await response.json();
      return data.data.stats;
    } catch (err) {
      console.error("Error fetching notification stats:", err);
      return null;
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotificationsByType,
    fetchStats,
    refetch: fetchNotifications,
  };
}
