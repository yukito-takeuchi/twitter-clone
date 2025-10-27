"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { User } from "@/types";
import { getOrCreateConversation, canMessageUser } from "@/lib/api-messages";
import api from "@/lib/api";
import Image from "next/image";

interface NewMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onConversationCreated: (conversationId: string) => void;
}

export default function NewMessageDialog({
  isOpen,
  onClose,
  currentUserId,
  onConversationCreated,
}: NewMessageDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch mutual followers when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchMutualFollowers();
    }
  }, [isOpen]);

  const fetchMutualFollowers = async () => {
    try {
      setLoading(true);
      // Get current user's followers
      const followersRes = await api.get(`/follows/followers/${currentUserId}`);
      const followers = followersRes.data.data.followers;

      // Get current user's following
      const followingRes = await api.get(`/follows/following/${currentUserId}`);
      const following = followingRes.data.data.following;

      // Find mutual followers (users who follow you and you follow them)
      const followerIds = new Set(followers.map((f: any) => f.id));
      const mutualUsers = following.filter((user: any) => followerIds.has(user.id));

      setUsers(mutualUsers);
      setFilteredUsers(mutualUsers);
    } catch (error) {
      console.error("Error fetching mutual followers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.username.toLowerCase().includes(term) ||
          user.display_name.toLowerCase().includes(term)
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const handleUserSelect = async (user: User) => {
    try {
      setLoading(true);

      // Check if can message
      const canMessage = await canMessageUser(currentUserId, user.id);
      if (!canMessage) {
        alert("You can only message users who mutually follow you");
        return;
      }

      // Get or create conversation
      const { conversation } = await getOrCreateConversation(currentUserId, user.id);

      // Notify parent and close
      onConversationCreated(conversation.id);
      onClose();
      setSearchTerm("");
      setSelectedUser(null);
    } catch (error) {
      console.error("Error creating conversation:", error);
      alert("Failed to create conversation");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">New message</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search people"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? "No users found"
                  : "No mutual followers found. Follow each other to start messaging."}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                disabled={loading}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 text-left"
              >
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.display_name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <span className="text-xl font-semibold text-gray-600 dark:text-gray-300">
                      {user.display_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user.display_name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    @{user.username}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
