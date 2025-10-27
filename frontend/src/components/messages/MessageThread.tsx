"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Typography, Avatar, CircularProgress } from "@mui/material";
import { ConversationWithDetails, MessageWithDetails, SocketMessageReceive } from "@/types/messages";
import { getMessages, markAllMessagesAsRead } from "@/lib/api-messages";
import { getOtherParticipant } from "@/lib/message-utils";
import { useSocket, useConversation } from "@/hooks/useSocket";
import { onMessageReceive, onTypingStart, onTypingStop } from "@/lib/socket";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";

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
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Avatar
          src={otherParticipant.avatar || undefined}
          alt={otherParticipant.display_name}
          sx={{ width: 40, height: 40 }}
        >
          {otherParticipant.display_name.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            {otherParticipant.display_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            @{otherParticipant.username}
          </Typography>
        </Box>
      </Box>

      {/* Messages */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
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
          <div className="flex items-center gap-2 mb-4">
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
      </Box>

      {/* Input */}
      <MessageInput
        conversationId={conversation.id}
        currentUserId={currentUserId}
        onMessageSent={() => {
          // Messages will be added via Socket.IO listener
        }}
      />
    </Box>
  );
}
