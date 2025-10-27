"use client";

import { useState, useEffect } from "react";
import { ConversationWithDetails } from "@/types/messages";
import { getConversations } from "@/lib/api-messages";
import ConversationItem from "./ConversationItem";
import { PlusCircleIcon } from "@heroicons/react/24/outline";

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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold">Messages</h2>
        <button
          onClick={onNewMessage}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          title="New message"
        >
          <PlusCircleIcon className="w-6 h-6 text-blue-500" />
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No conversations yet
            </p>
            <button
              onClick={onNewMessage}
              className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              Start a conversation
            </button>
          </div>
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
      </div>
    </div>
  );
}
