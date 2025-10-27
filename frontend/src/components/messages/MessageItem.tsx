"use client";

import { MessageWithDetails } from "@/types/messages";
import { formatFullMessageTime } from "@/lib/message-utils";
import Image from "next/image";
import { CheckIcon, CheckCheckIcon } from "lucide-react";

interface MessageItemProps {
  message: MessageWithDetails;
  currentUserId: string;
}

export default function MessageItem({
  message,
  currentUserId,
}: MessageItemProps) {
  const isSentByMe = message.sender_id === currentUserId;
  const isRead = message.is_read_by_recipient;

  return (
    <div
      className={`flex items-end gap-2 mb-4 ${
        isSentByMe ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Message Content */}
      <div
        className={`flex flex-col max-w-[70%] ${
          isSentByMe ? "items-end" : "items-start"
        }`}
      >
        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isSentByMe
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          }`}
        >
          {/* Text Message */}
          {message.message_type === "text" && message.content && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}

          {/* Image Message */}
          {message.message_type === "image" && message.image_url && (
            <div>
              <Image
                src={message.image_url}
                alt="Message image"
                width={300}
                height={300}
                className="rounded-lg mb-1"
              />
              {message.content && (
                <p className="mt-2 whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}
            </div>
          )}

          {/* Post Share Message */}
          {message.message_type === "post_share" && (
            <div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-2">
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  📎 Shared post
                </p>
                {/* TODO: Add actual post preview */}
              </div>
              {message.content && (
                <p className="whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Timestamp and Read Status */}
        <div
          className={`flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400 ${
            isSentByMe ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span>{formatFullMessageTime(message.created_at)}</span>
          {isSentByMe && (
            <span>
              {isRead ? (
                <CheckCheckIcon className="w-4 h-4 text-blue-500" />
              ) : (
                <CheckIcon className="w-4 h-4" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
