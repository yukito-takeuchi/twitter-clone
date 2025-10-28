"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Switch,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import MainLayout from "@/components/layout/MainLayout";

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
      <MainLayout>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (!settings) {
    return (
      <MainLayout>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <Typography color="text.secondary">設定を読み込めませんでした</Typography>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2 }}>
          <IconButton
            onClick={() => router.back()}
            sx={{
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            通知設定
          </Typography>
        </Box>
      </Box>

      {/* Filters Section */}
      <Box>
        <Box sx={{ px: 2, py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            フィルター
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            受け取る通知の種類を選択してください
          </Typography>
        </Box>

        <List disablePadding>
          <SettingItem
            label="いいね"
            description="あなたのポストがいいねされたとき"
            checked={settings.enable_likes}
            onChange={(checked) => handleToggle("enable_likes", checked)}
            disabled={saving}
          />
          <Divider />

          <SettingItem
            label="返信"
            description="あなたのポストに返信があったとき"
            checked={settings.enable_replies}
            onChange={(checked) => handleToggle("enable_replies", checked)}
            disabled={saving}
          />
          <Divider />

          <SettingItem
            label="フォロー"
            description="新しいフォロワーがいるとき"
            checked={settings.enable_follows}
            onChange={(checked) => handleToggle("enable_follows", checked)}
            disabled={saving}
          />
          <Divider />

          <SettingItem
            label="リポスト"
            description="あなたのポストがリポストされたとき"
            checked={settings.enable_reposts}
            onChange={(checked) => handleToggle("enable_reposts", checked)}
            disabled={saving}
          />
          <Divider />

          <SettingItem
            label="引用"
            description="あなたのポストが引用されたとき"
            checked={settings.enable_quotes}
            onChange={(checked) => handleToggle("enable_quotes", checked)}
            disabled={saving}
          />
          <Divider />

          <SettingItem
            label="ダイレクトメッセージ"
            description="新しいメッセージを受信したとき"
            checked={settings.enable_dms}
            onChange={(checked) => handleToggle("enable_dms", checked)}
            disabled={saving}
          />
          <Divider />

          <SettingItem
            label="フォロー中のユーザーの投稿"
            description="フォローしているユーザーが新しい投稿をしたとき"
            checked={settings.enable_new_posts_from_following}
            onChange={(checked) =>
              handleToggle("enable_new_posts_from_following", checked)
            }
            disabled={saving}
          />
        </List>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Email Notifications Section */}
      <Box>
        <Box sx={{ px: 2, py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            メール通知
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            メールで通知を受け取る設定（今後実装予定）
          </Typography>
        </Box>

        <List disablePadding>
          <SettingItem
            label="メール通知を有効にする"
            description="重要な通知をメールで受け取る"
            checked={settings.enable_email_notifications}
            onChange={(checked) =>
              handleToggle("enable_email_notifications", checked)
            }
            disabled={true}
          />
        </List>
      </Box>

      {/* Info */}
      <Box sx={{ px: 2, py: 3 }}>
        <Typography variant="body2" color="text.secondary">
          設定は自動的に保存されます。通知は30秒ごとに更新されます。
        </Typography>
      </Box>
    </MainLayout>
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
    <ListItem
      sx={{
        px: 2,
        py: 2,
        "&:hover": {
          bgcolor: "action.hover",
        },
      }}
    >
      <ListItemText
        primary={
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>
            {label}
          </Typography>
        }
        secondary={
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        }
      />
      <Switch
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        sx={{
          "& .MuiSwitch-switchBase.Mui-checked": {
            color: "rgb(29, 155, 240)",
          },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
            backgroundColor: "rgb(29, 155, 240)",
          },
        }}
      />
    </ListItem>
  );
}
