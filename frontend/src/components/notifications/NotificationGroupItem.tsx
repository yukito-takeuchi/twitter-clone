"use client";

import { useRouter } from "next/navigation";
import { Box, Typography, Avatar } from "@mui/material";
import {
  Favorite,
  Repeat,
  PersonAdd,
  ChatBubbleOutline,
  FormatQuote,
  Notifications as NotificationsIcon,
  Mail,
} from "@mui/icons-material";
import { GroupedNotification } from "@/types/notification";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import MultipleAvatars from "./MultipleAvatars";

interface NotificationGroupItemProps {
  group: GroupedNotification;
  onMarkAsRead: (ids: string[]) => void;
}

export default function NotificationGroupItem({
  group,
  onMarkAsRead,
}: NotificationGroupItemProps) {
  const router = useRouter();

  const handleClick = () => {
    // Mark all notifications in group as read
    if (!group.is_read) {
      const ids = group.notifications.map((n) => n.id);
      onMarkAsRead(ids);
    }

    // Navigate based on notification type (X-like behavior)
    switch (group.notification_type) {
      case "dm":
        // Go to the conversation
        const firstNotif = group.notifications[0];
        const dmContent = firstNotif.content as any;
        if (dmContent.conversation_id) {
          router.push(`/messages?conversation=${dmContent.conversation_id}`);
        }
        break;

      case "like":
      case "reply":
      case "quote":
        // Go to the post
        if (group.related_post_id) {
          router.push(`/post/${group.related_post_id}`);
        }
        break;

      case "follow":
        // Go to first user's profile
        if (group.users[0]) {
          router.push(`/profile/${group.users[0].username}`);
        }
        break;

      case "new_post":
        // Go to new posts timeline
        router.push(`/new-posts`);
        break;
    }
  };

  const renderIcon = () => {
    switch (group.notification_type) {
      case "dm":
        return (
          <Avatar sx={{ bgcolor: "rgba(29, 155, 240, 0.1)", width: 40, height: 40 }}>
            <Mail sx={{ color: "rgb(29, 155, 240)", fontSize: 20 }} />
          </Avatar>
        );
      case "like":
        return (
          <Avatar sx={{ bgcolor: "rgba(249, 24, 128, 0.1)", width: 40, height: 40 }}>
            <Favorite sx={{ color: "rgb(249, 24, 128)", fontSize: 20 }} />
          </Avatar>
        );
      case "repost":
        return (
          <Avatar sx={{ bgcolor: "rgba(0, 186, 124, 0.1)", width: 40, height: 40 }}>
            <Repeat sx={{ color: "rgb(0, 186, 124)", fontSize: 20 }} />
          </Avatar>
        );
      case "follow":
        return (
          <Avatar sx={{ bgcolor: "rgba(29, 155, 240, 0.1)", width: 40, height: 40 }}>
            <PersonAdd sx={{ color: "rgb(29, 155, 240)", fontSize: 20 }} />
          </Avatar>
        );
      case "reply":
        return (
          <Avatar sx={{ bgcolor: "rgba(29, 155, 240, 0.1)", width: 40, height: 40 }}>
            <ChatBubbleOutline sx={{ color: "rgb(29, 155, 240)", fontSize: 20 }} />
          </Avatar>
        );
      case "quote":
        return (
          <Avatar sx={{ bgcolor: "rgba(0, 0, 0, 0.05)", width: 40, height: 40 }}>
            <FormatQuote sx={{ color: "text.secondary", fontSize: 20 }} />
          </Avatar>
        );
      case "new_post":
        return (
          <Avatar sx={{ bgcolor: "rgba(29, 155, 240, 0.1)", width: 40, height: 40 }}>
            <NotificationsIcon sx={{ color: "rgb(29, 155, 240)", fontSize: 20 }} />
          </Avatar>
        );
      default:
        return (
          <Avatar sx={{ bgcolor: "rgba(0, 0, 0, 0.05)", width: 40, height: 40 }}>
            <NotificationsIcon sx={{ color: "text.secondary", fontSize: 20 }} />
          </Avatar>
        );
    }
  };

  const renderContent = () => {
    const firstUser = group.users[0];
    const otherCount = group.count - 1;

    let actionText = "";
    switch (group.notification_type) {
      case "dm":
        actionText = otherCount > 0
          ? `から${group.count}件の新しいメッセージ`
          : "から新しいメッセージ";
        break;
      case "like":
        actionText = "があなたのポストをいいねしました";
        break;
      case "follow":
        actionText = "があなたをフォローしました";
        break;
      case "reply":
        actionText = "があなたのポストに返信しました";
        break;
      case "quote":
        actionText = "があなたのポストを引用しました";
        break;
      case "new_post":
        actionText = "の新しいポスト通知";
        break;
      case "repost":
        actionText = "があなたのポストをリポストしました";
        break;
    }

    return (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
          {otherCount > 0
            ? `${firstUser.display_name} さんと他${otherCount}人${actionText}`
            : `${firstUser.display_name} ${actionText}`}
        </Typography>

        {group.post_content && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "14px", mt: 1 }}
          >
            {group.post_content}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: "flex",
        gap: 1.5,
        p: 2,
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: !group.is_read ? "rgba(29, 155, 240, 0.05)" : "transparent",
        cursor: "pointer",
        transition: "background-color 0.2s",
        "&:hover": {
          bgcolor: !group.is_read
            ? "rgba(29, 155, 240, 0.08)"
            : "action.hover",
        },
      }}
    >
      {/* Icon */}
      <Box sx={{ flexShrink: 0 }}>{renderIcon()}</Box>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Multiple Avatars */}
        <Box sx={{ mb: 1 }}>
          <MultipleAvatars users={group.users} max={3} />
        </Box>

        {renderContent()}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          {formatDistanceToNow(new Date(group.created_at), {
            addSuffix: true,
            locale: ja,
          })}
        </Typography>
      </Box>

      {/* Unread indicator */}
      {!group.is_read && (
        <Box sx={{ flexShrink: 0, display: "flex", alignItems: "flex-start", pt: 0.5 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              bgcolor: "rgb(29, 155, 240)",
              borderRadius: "50%",
            }}
          />
        </Box>
      )}
    </Box>
  );
}
