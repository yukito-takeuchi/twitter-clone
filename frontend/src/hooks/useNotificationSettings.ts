import { useState, useEffect, useCallback } from "react";
import { NotificationSettings } from "@/types/notification";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export function useNotificationSettings(userId: string | null) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/notifications/settings?userId=${userId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notification settings");
      }

      const data = await response.json();
      setSettings(data.data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching notification settings:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateSettings = useCallback(
    async (updates: Partial<Omit<NotificationSettings, "id" | "user_id" | "created_at" | "updated_at">>) => {
      if (!userId) return;

      try {
        const response = await fetch(`${API_BASE_URL}/notifications/settings`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            ...updates,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update notification settings");
        }

        const data = await response.json();
        setSettings(data.data.settings);
      } catch (err) {
        console.error("Error updating notification settings:", err);
        throw err;
      }
    },
    [userId]
  );

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings,
  };
}
