"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { ArrowLeft } from "lucide-react";

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings, loading, updateSettings } = useNotificationSettings(
    user?.id || null
  );
  const [saving, setSaving] = useState(false);

  const handleToggle = async (key: string, value: boolean) => {
    try {
      setSaving(true);
      await updateSettings({ [key]: value });
    } catch (error) {
      console.error("Failed to update settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <p className="text-gray-500">設定を読み込めませんでした</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="戻る"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">通知設定</h1>
        </div>
      </div>

      {/* Settings */}
      <div className="max-w-2xl mx-auto">
        {/* Filters Section */}
        <div className="border-b border-gray-200">
          <div className="px-4 py-3">
            <h2 className="font-bold text-lg">フィルター</h2>
            <p className="text-gray-500 text-sm mt-1">
              受け取る通知の種類を選択してください
            </p>
          </div>

          <SettingItem
            label="いいね"
            description="あなたのポストがいいねされたとき"
            checked={settings.enable_likes}
            onChange={(checked) => handleToggle("enable_likes", checked)}
            disabled={saving}
          />

          <SettingItem
            label="返信"
            description="あなたのポストに返信があったとき"
            checked={settings.enable_replies}
            onChange={(checked) => handleToggle("enable_replies", checked)}
            disabled={saving}
          />

          <SettingItem
            label="フォロー"
            description="新しいフォロワーがいるとき"
            checked={settings.enable_follows}
            onChange={(checked) => handleToggle("enable_follows", checked)}
            disabled={saving}
          />

          <SettingItem
            label="リポスト"
            description="あなたのポストがリポストされたとき"
            checked={settings.enable_reposts}
            onChange={(checked) => handleToggle("enable_reposts", checked)}
            disabled={saving}
          />

          <SettingItem
            label="引用"
            description="あなたのポストが引用されたとき"
            checked={settings.enable_quotes}
            onChange={(checked) => handleToggle("enable_quotes", checked)}
            disabled={saving}
          />

          <SettingItem
            label="ダイレクトメッセージ"
            description="新しいメッセージを受信したとき"
            checked={settings.enable_dms}
            onChange={(checked) => handleToggle("enable_dms", checked)}
            disabled={saving}
          />

          <SettingItem
            label="フォロー中のユーザーの投稿"
            description="フォローしているユーザーが新しい投稿をしたとき"
            checked={settings.enable_new_posts_from_following}
            onChange={(checked) =>
              handleToggle("enable_new_posts_from_following", checked)
            }
            disabled={saving}
          />
        </div>

        {/* Email Notifications Section */}
        <div className="border-b border-gray-200">
          <div className="px-4 py-3 mt-4">
            <h2 className="font-bold text-lg">メール通知</h2>
            <p className="text-gray-500 text-sm mt-1">
              メールで通知を受け取る設定（今後実装予定）
            </p>
          </div>

          <SettingItem
            label="メール通知を有効にする"
            description="重要な通知をメールで受け取る"
            checked={settings.enable_email_notifications}
            onChange={(checked) =>
              handleToggle("enable_email_notifications", checked)
            }
            disabled={true}
          />
        </div>

        {/* Info */}
        <div className="px-4 py-4 text-sm text-gray-500">
          <p>
            設定は自動的に保存されます。通知は30秒ごとに更新されます。
          </p>
        </div>
      </div>
    </div>
  );
}

interface SettingItemProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function SettingItem({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: SettingItemProps) {
  return (
    <div className="px-4 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-semibold">{label}</p>
          <p className="text-gray-500 text-sm mt-1">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="sr-only peer"
          />
          <div
            className={`
              w-11 h-6 bg-gray-200 rounded-full peer
              peer-focus:ring-4 peer-focus:ring-blue-300
              peer-checked:after:translate-x-full
              peer-checked:after:border-white
              after:content-[''] after:absolute after:top-0.5
              after:left-[2px] after:bg-white after:border-gray-300
              after:border after:rounded-full after:h-5 after:w-5
              after:transition-all
              peer-checked:bg-blue-500
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
          />
        </label>
      </div>
    </div>
  );
}
