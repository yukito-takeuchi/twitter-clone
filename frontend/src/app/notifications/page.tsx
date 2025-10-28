"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationList from "@/components/notifications/NotificationList";
import { Settings } from "lucide-react";

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "verified">("all");

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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold">通知</h1>
          <button
            onClick={() => router.push("/notifications/settings")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="通知設定"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("all")}
            className={`
              flex-1 py-4 text-center font-semibold transition-colors
              ${
                activeTab === "all"
                  ? "text-black border-b-2 border-blue-500"
                  : "text-gray-500 hover:bg-gray-50"
              }
            `}
          >
            すべて
          </button>
          <button
            onClick={() => setActiveTab("verified")}
            className={`
              flex-1 py-4 text-center font-semibold transition-colors
              ${
                activeTab === "verified"
                  ? "text-black border-b-2 border-blue-500"
                  : "text-gray-500 hover:bg-gray-50"
              }
            `}
          >
            認証済み
          </button>
        </div>

        {/* Mark all as read button */}
        {notifications.some((n) => !n.is_read) && (
          <div className="px-4 py-2 border-b border-gray-200">
            <button
              onClick={handleMarkAllAsRead}
              className="text-blue-500 text-sm hover:underline"
            >
              すべて既読にする
            </button>
          </div>
        )}
      </div>

      {/* Notification List */}
      <NotificationList
        notifications={filteredNotifications}
        loading={loading}
        error={error}
        onMarkAsRead={markAsRead}
        onDelete={deleteNotification}
      />
    </div>
  );
}
