"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ConversationWithDetails } from "@/types/messages";
import { getConversations } from "@/lib/api-messages";
import { useSocket } from "@/hooks/useSocket";
import ConversationList from "@/components/messages/ConversationList";
import MessageThread from "@/components/messages/MessageThread";
import NewMessageDialog from "@/components/messages/NewMessageDialog";
import LeftSidebar from "@/components/layout/LeftSidebar";

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-black">
      {/* Left Sidebar */}
      <LeftSidebar />

      {/* Messages Layout - Using full main + right sidebar space */}
      <div className="flex flex-1 border-l border-r border-gray-200 dark:border-gray-700">
        {/* Conversation List - 40% */}
        <div className="w-[40%] border-r border-gray-200 dark:border-gray-700">
          <ConversationList
            currentUserId={user.id}
            selectedConversationId={selectedConversation?.id || null}
            onSelectConversation={handleSelectConversation}
            onNewMessage={handleNewMessage}
          />
        </div>

        {/* Message Thread - 60% */}
        <div className="w-[60%]">
          {selectedConversation ? (
            <MessageThread
              conversation={selectedConversation}
              currentUserId={user.id}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <h2 className="text-2xl font-bold mb-2">Select a message</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Choose from your existing conversations, or start a new one.
              </p>
              <button
                onClick={handleNewMessage}
                className="px-6 py-3 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors"
              >
                New message
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Message Dialog */}
      <NewMessageDialog
        isOpen={isNewMessageDialogOpen}
        onClose={() => setIsNewMessageDialogOpen(false)}
        currentUserId={user.id}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
}
