"use client";

import { useRouter } from "next/navigation";
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
import { Heart, Repeat2, UserPlus, MessageCircle, Quote, Bell } from "lucide-react";

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
      router.push(`/${content.follower_username}`);
    } else if (notification.related_post_id) {
      router.push(`/post/${notification.related_post_id}`);
    }
  };

  const renderIcon = () => {
    const iconClass = "w-8 h-8 p-1.5 rounded-full";

    switch (notification.notification_type) {
      case "like":
        return (
          <div className={`${iconClass} bg-pink-100`}>
            <Heart className="w-full h-full text-pink-500 fill-pink-500" />
          </div>
        );
      case "repost":
        return (
          <div className={`${iconClass} bg-green-100`}>
            <Repeat2 className="w-full h-full text-green-500" />
          </div>
        );
      case "follow":
        return (
          <div className={`${iconClass} bg-blue-100`}>
            <UserPlus className="w-full h-full text-blue-500" />
          </div>
        );
      case "reply":
        return (
          <div className={`${iconClass} bg-blue-100`}>
            <MessageCircle className="w-full h-full text-blue-500" />
          </div>
        );
      case "quote":
        return (
          <div className={`${iconClass} bg-gray-100`}>
            <Quote className="w-full h-full text-gray-600" />
          </div>
        );
      case "new_post":
        return (
          <div className={`${iconClass} bg-blue-100`}>
            <Bell className="w-full h-full text-blue-500" />
          </div>
        );
      default:
        return (
          <div className={`${iconClass} bg-gray-100`}>
            <Bell className="w-full h-full text-gray-500" />
          </div>
        );
    }
  };

  const renderContent = () => {
    switch (notification.notification_type) {
      case "like": {
        const content = notification.content as NotificationContentLike;
        return (
          <div>
            <p className="font-semibold">{content.liker_display_name}</p>
            <p className="text-gray-600 text-sm">があなたのポストをいいねしました</p>
            <p className="text-gray-500 text-sm mt-2">{content.post_content}</p>
          </div>
        );
      }
      case "follow": {
        const content = notification.content as NotificationContentFollow;
        return (
          <div>
            <p className="font-semibold">{content.follower_display_name}</p>
            <p className="text-gray-600 text-sm">があなたをフォローしました</p>
          </div>
        );
      }
      case "reply": {
        const content = notification.content as NotificationContentReply;
        return (
          <div>
            <p className="font-semibold">{content.replier_display_name}</p>
            <p className="text-gray-600 text-sm">があなたのポストに返信しました</p>
            <p className="text-gray-500 text-sm mt-2">{content.reply_content}</p>
          </div>
        );
      }
      case "quote": {
        const content = notification.content as NotificationContentQuote;
        return (
          <div>
            <p className="font-semibold">{content.quoter_display_name}</p>
            <p className="text-gray-600 text-sm">があなたのポストを引用しました</p>
            <p className="text-gray-500 text-sm mt-2">{content.quote_content}</p>
          </div>
        );
      }
      case "new_post": {
        const content = notification.content as NotificationContentNewPost;
        return (
          <div>
            <p className="font-semibold">{content.poster_display_name}</p>
            <p className="text-gray-600 text-sm">が新しいポストを投稿しました</p>
            <p className="text-gray-500 text-sm mt-2">{content.post_content}</p>
          </div>
        );
      }
      default:
        return <p className="text-gray-600">通知</p>;
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        flex gap-3 p-4 border-b border-gray-200
        hover:bg-gray-50 cursor-pointer transition-colors
        ${!notification.is_read ? "bg-blue-50/30" : ""}
      `}
    >
      {/* Icon */}
      <div className="flex-shrink-0">{renderIcon()}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {renderContent()}
        <p className="text-gray-400 text-xs mt-2">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: ja,
          })}
        </p>
      </div>

      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
        </div>
      )}
    </div>
  );
}
