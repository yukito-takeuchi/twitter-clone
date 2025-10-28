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
} from "@mui/icons-material";
import {
  Notification,
  NotificationContentLike,
  NotificationContentFollow,
  NotificationContentReply,
  NotificationContentQuote,
  NotificationContentNewPost,
} from "@/types/notification";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {
  const router = useRouter();

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.notification_type === "follow" && notification.related_user_id) {
      const content = notification.content as NotificationContentFollow;
      router.push(`/profile/${content.follower_username}`);
    } else if (notification.related_post_id) {
      router.push(`/post/${notification.related_post_id}`);
    }
  };

  const renderIcon = () => {
    const iconSize = 32;
    const iconProps = { sx: { fontSize: iconSize } };

    switch (notification.notification_type) {
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
    switch (notification.notification_type) {
      case "like": {
        const content = notification.content as NotificationContentLike;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {content.liker_display_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "14px" }}>
              があなたのポストをいいねしました
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "14px", mt: 1 }}
            >
              {content.post_content}
            </Typography>
          </Box>
        );
      }
      case "follow": {
        const content = notification.content as NotificationContentFollow;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {content.follower_display_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "14px" }}>
              があなたをフォローしました
            </Typography>
          </Box>
        );
      }
      case "reply": {
        const content = notification.content as NotificationContentReply;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {content.replier_display_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "14px" }}>
              があなたのポストに返信しました
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "14px", mt: 1 }}
            >
              {content.reply_content}
            </Typography>
          </Box>
        );
      }
      case "quote": {
        const content = notification.content as NotificationContentQuote;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {content.quoter_display_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "14px" }}>
              があなたのポストを引用しました
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "14px", mt: 1 }}
            >
              {content.quote_content}
            </Typography>
          </Box>
        );
      }
      case "new_post": {
        const content = notification.content as NotificationContentNewPost;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {content.poster_display_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "14px" }}>
              が新しいポストを投稿しました
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "14px", mt: 1 }}
            >
              {content.post_content}
            </Typography>
          </Box>
        );
      }
      default:
        return (
          <Typography variant="body2" color="text.secondary">
            通知
          </Typography>
        );
    }
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
        bgcolor: !notification.is_read ? "rgba(29, 155, 240, 0.05)" : "transparent",
        cursor: "pointer",
        transition: "background-color 0.2s",
        "&:hover": {
          bgcolor: !notification.is_read
            ? "rgba(29, 155, 240, 0.08)"
            : "action.hover",
        },
      }}
    >
      {/* Icon */}
      <Box sx={{ flexShrink: 0 }}>{renderIcon()}</Box>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {renderContent()}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: ja,
          })}
        </Typography>
      </Box>

      {/* Unread indicator */}
      {!notification.is_read && (
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
