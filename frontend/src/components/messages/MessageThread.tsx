"use client";

import { useState, useEffect, useRef } from "react";
import { ConversationWithDetails, MessageWithDetails, SocketMessageReceive } from "@/types/messages";
import { getMessages, markAllMessagesAsRead } from "@/lib/api-messages";
import { getOtherParticipant } from "@/lib/message-utils";
import { useSocket, useConversation } from "@/hooks/useSocket";
import { onMessageReceive, onTypingStart, onTypingStop } from "@/lib/socket";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";
import Image from "next/image";

interface MessageThreadProps {
  conversation: ConversationWithDetails;
  currentUserId: string;
}

export default function MessageThread({
  conversation,
  currentUserId,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<MessageWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const otherParticipant = getOtherParticipant(conversation, currentUserId);

  // Join conversation room
  useConversation(conversation.id, currentUserId);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const data = await getMessages(conversation.id, currentUserId, 50);
        setMessages(data.reverse()); // Reverse to show oldest first
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversation.id, currentUserId]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    const markAsRead = async () => {
      try {
        await markAllMessagesAsRead(conversation.id, currentUserId);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    markAsRead();
  }, [conversation.id, currentUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (message: SocketMessageReceive) => {
      if (message.conversation_id === conversation.id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    onMessageReceive(handleNewMessage);

    return () => {
      // Cleanup handled by socket
    };
  }, [conversation.id]);

  // Listen for typing indicators
  useEffect(() => {
    const handleTypingStart = ({ userId }: { userId: string }) => {
      if (userId === otherParticipant.id) {
        setIsOtherUserTyping(true);
      }
    };

    const handleTypingStop = ({ userId }: { userId: string }) => {
      if (userId === otherParticipant.id) {
        setIsOtherUserTyping(false);
      }
    };

    onTypingStart(handleTypingStart);
    onTypingStop(handleTypingStop);

    return () => {
      // Cleanup handled by socket
    };
  }, [otherParticipant.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
        {otherParticipant.avatar ? (
          <Image
            src={otherParticipant.avatar}
            alt={otherParticipant.display_name}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
              {otherParticipant.display_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <h2 className="font-bold text-lg">{otherParticipant.display_name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            @{otherParticipant.username}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1];
              const showAvatar =
                !prevMessage ||
                prevMessage.sender_id !== message.sender_id ||
                new Date(message.created_at).getTime() -
                  new Date(prevMessage.created_at).getTime() >
                  60000; // 1 minute

              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  currentUserId={currentUserId}
                  showAvatar={showAvatar}
                />
              );
            })}
          </>
        )}

        {/* Typing Indicator */}
        {isOtherUserTyping && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                <span
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></span>
                <span
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        conversationId={conversation.id}
        currentUserId={currentUserId}
        onMessageSent={() => {
          // Messages will be added via Socket.IO listener
        }}
      />
    </div>
  );
}
