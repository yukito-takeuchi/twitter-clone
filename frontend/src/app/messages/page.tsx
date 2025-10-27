"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { ConversationWithDetails } from "@/types/messages";
import { getConversations } from "@/lib/api-messages";
import { useSocket } from "@/hooks/useSocket";
import ConversationList from "@/components/messages/ConversationList";
import MessageThread from "@/components/messages/MessageThread";
import NewMessageDialog from "@/components/messages/NewMessageDialog";
import MessageLayout from "@/components/layout/MessageLayout";

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null);
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [isNewMessageDialogOpen, setIsNewMessageDialogOpen] = useState(false);

  // Initialize Socket.IO connection
  useSocket({
    userId: user?.id || "",
    onMessage: (message) => {
      console.log("New message received:", message);
      // Refresh conversations to update last message
      if (user) {
        refreshConversations();
      }
    },
    onNotification: (notification) => {
      console.log("Notification received:", notification);
      // Refresh conversations
      if (user) {
        refreshConversations();
      }
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch conversations
  const refreshConversations = async () => {
    if (!user) return;
    try {
      const data = await getConversations(user.id);
      setConversations(data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  useEffect(() => {
    refreshConversations();
  }, [user]);

  const handleSelectConversation = (conversation: ConversationWithDetails) => {
    setSelectedConversation(conversation);
  };

  const handleNewMessage = () => {
    setIsNewMessageDialogOpen(true);
  };

  const handleConversationCreated = async (conversationId: string) => {
    // Refresh conversations
    await refreshConversations();
    // Find and select the new conversation
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      setSelectedConversation(conversation);
    } else {
      // If not found in current list, refetch
      const data = await getConversations(user!.id);
      const newConversation = data.find((c) => c.id === conversationId);
      if (newConversation) {
        setSelectedConversation(newConversation);
      }
    }
  };

  if (authLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <MessageLayout
        conversationList={
          <ConversationList
            currentUserId={user.id}
            selectedConversationId={selectedConversation?.id || null}
            onSelectConversation={handleSelectConversation}
            onNewMessage={handleNewMessage}
          />
        }
        messageThread={
          selectedConversation ? (
            <MessageThread
              conversation={selectedConversation}
              currentUserId={user.id}
            />
          ) : (
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
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Select a message
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                Choose from your existing conversations, or start a new one.
              </Typography>
              <button
                onClick={handleNewMessage}
                className="px-6 py-3 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors"
              >
                New message
              </button>
            </Box>
          )
        }
      />

      {/* New Message Dialog */}
      <NewMessageDialog
        isOpen={isNewMessageDialogOpen}
        onClose={() => setIsNewMessageDialogOpen(false)}
        currentUserId={user.id}
        onConversationCreated={handleConversationCreated}
      />
    </>
  );
}
