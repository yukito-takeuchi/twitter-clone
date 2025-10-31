"use client";

import { ConversationWithDetails } from "@/types/messages";
import {
  getOtherParticipant,
  formatMessageTime,
  getMessagePreview,
} from "@/lib/message-utils";
import Image from "next/image";

interface ConversationItemProps {
  conversation: ConversationWithDetails;
  currentUserId: string;
  isActive?: boolean;
  onClick: () => void;
}

export default function ConversationItem({
  conversation,
  currentUserId,
  isActive = false,
  onClick,
}: ConversationItemProps) {
  const otherParticipant = getOtherParticipant(conversation, currentUserId);
  const hasUnread = conversation.unread_count > 0;
  const isSentByMe = conversation.last_message_sender_id === currentUserId;

  const messagePreview = getMessagePreview(
    conversation.last_message_content,
    conversation.last_message_type
  );

  const getImageUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith("http")) {
      return url;
    }
    return `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${url}`;
  };

  return (
    <div
      onClick={onClick}
      className={`
        flex items-start gap-3 p-4 cursor-pointer transition-colors
        hover:bg-gray-50 dark:hover:bg-gray-800
        ${isActive ? "bg-gray-100 dark:bg-gray-800" : ""}
        border-b border-gray-200 dark:border-gray-700
      `}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {otherParticipant.avatar ? (
          <Image
            src={getImageUrl(otherParticipant.avatar)}
            alt={(
              otherParticipant.display_name ||
              otherParticipant.username ||
              ""
            ).toString()}
            width={48}
            height={48}
            className="rounded-full"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <span className="text-xl font-semibold text-gray-600 dark:text-gray-300">
              {(
                otherParticipant.display_name ||
                otherParticipant.username ||
                "?"
              )
                .charAt(0)
                .toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold ${
                hasUnread
                  ? "text-black dark:text-white"
                  : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {otherParticipant.display_name}
            </span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
            {formatMessageTime(conversation.last_message_at)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <p
            className={`text-sm truncate ${
              hasUnread
                ? "font-semibold text-gray-900 dark:text-gray-100"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {isSentByMe && messagePreview && (
              <span className="text-gray-500 dark:text-gray-500">You: </span>
            )}
            {messagePreview || "Start a conversation"}
          </p>
          {hasUnread && (
            <span className="flex-shrink-0 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {conversation.unread_count > 9 ? "9+" : conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
