"use client";

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
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">通知はありません</p>
      </div>
    );
  }

  return (
    <div>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
