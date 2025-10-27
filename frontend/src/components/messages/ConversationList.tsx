"use client";

import { useState, useEffect } from "react";
import { Box, Typography, IconButton, CircularProgress } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { ConversationWithDetails } from "@/types/messages";
import { getConversations } from "@/lib/api-messages";
import ConversationItem from "./ConversationItem";

interface ConversationListProps {
  currentUserId: string;
  selectedConversationId: string | null;
  onSelectConversation: (conversation: ConversationWithDetails) => void;
  onNewMessage: () => void;
}

export default function ConversationList({
  currentUserId,
  selectedConversationId,
  onSelectConversation,
  onNewMessage,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const data = await getConversations(currentUserId);
        setConversations(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching conversations:", err);
        setError("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      fetchConversations();
    }
  }, [currentUserId]);

  // Update conversation in list (for real-time updates)
  const updateConversation = (updatedConversation: ConversationWithDetails) => {
    setConversations((prev) => {
      const index = prev.findIndex((c) => c.id === updatedConversation.id);
      if (index !== -1) {
        const newConversations = [...prev];
        newConversations[index] = updatedConversation;
        // Move to top
        newConversations.unshift(newConversations.splice(index, 1)[0]);
        return newConversations;
      } else {
        // New conversation
        return [updatedConversation, ...prev];
      }
    });
  };

  // Add new conversation to list
  const addConversation = (conversation: ConversationWithDetails) => {
    setConversations((prev) => {
      // Check if already exists
      const exists = prev.find((c) => c.id === conversation.id);
      if (exists) {
        return prev;
      }
      return [conversation, ...prev];
    });
  };

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

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          p: 2,
        }}
      >
        <Typography color="error">{error}</Typography>
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
          justifyContent: "space-between",
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Messages
        </Typography>
        <IconButton
          onClick={onNewMessage}
          color="primary"
          title="New message"
        >
          <AddIcon />
        </IconButton>
      </Box>

      {/* Conversation List */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
        }}
      >
        {conversations.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              p: 4,
              textAlign: "center",
            }}
          >
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No conversations yet
            </Typography>
            <button
              onClick={onNewMessage}
              className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              Start a conversation
            </button>
          </Box>
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              currentUserId={currentUserId}
              isActive={conversation.id === selectedConversationId}
              onClick={() => onSelectConversation(conversation)}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
