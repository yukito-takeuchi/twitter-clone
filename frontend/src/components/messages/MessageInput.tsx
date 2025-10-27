"use client";

import { useState, useRef, useEffect } from "react";
import { PhotoIcon, PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { sendMessage, startTyping, stopTyping } from "@/lib/socket";
import { sendImageMessage } from "@/lib/api-messages";
import Image from "next/image";

interface MessageInputProps {
  conversationId: string;
  currentUserId: string;
  onMessageSent?: () => void;
}

export default function MessageInput({
  conversationId,
  currentUserId,
  onMessageSent,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Handle typing indicator
  const handleTypingStart = () => {
    if (!isTyping) {
      startTyping(conversationId, currentUserId);
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId, currentUserId);
      setIsTyping(false);
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (e.target.value.trim()) {
      handleTypingStart();
    } else if (isTyping) {
      stopTyping(conversationId, currentUserId);
      setIsTyping(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB");
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage && !imageFile) {
      return;
    }

    setIsSending(true);

    try {
      if (imageFile) {
        // Send image message via REST API
        await sendImageMessage(
          conversationId,
          currentUserId,
          imageFile,
          trimmedMessage || undefined
        );
      } else {
        // Send text message via Socket.IO
        sendMessage({
          conversationId,
          senderId: currentUserId,
          messageType: "text",
          content: trimmedMessage,
        });
      }

      // Clear input
      setMessage("");
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Stop typing indicator
      if (isTyping) {
        stopTyping(conversationId, currentUserId);
        setIsTyping(false);
      }

      // Callback
      onMessageSent?.();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-3 relative inline-block">
          <Image
            src={imagePreview}
            alt="Preview"
            width={200}
            height={200}
            className="rounded-lg"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-1 bg-gray-800 bg-opacity-75 rounded-full hover:bg-opacity-100 transition-opacity"
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* Image Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
          title="Add image"
        >
          <PhotoIcon className="w-6 h-6" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Start a new message"
          disabled={isSending}
          rows={1}
          className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:opacity-50 max-h-32 overflow-y-auto"
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={isSending || (!message.trim() && !imageFile)}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Send"
        >
          {isSending ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <PaperAirplaneIcon className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
}
