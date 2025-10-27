import { Router } from "express";
import { messageController } from "../controllers/messageController";
import { upload } from "../config/storage";

const router = Router();

// Send a text or post-share message
router.post("/", messageController.sendMessage);

// Send an image message
router.post("/image", upload.single("image"), messageController.sendImageMessage);

// Mark a message as read
router.put("/:messageId/read", messageController.markAsRead);

// Delete a message
router.delete("/:messageId", messageController.deleteMessage);

// Get messages for a conversation
router.get("/:conversationId", messageController.getMessages);

// Get unread count for a conversation
router.get("/conversation/:conversationId/unread-count", messageController.getUnreadCount);

// Mark all messages in a conversation as read
router.put("/conversation/:conversationId/read-all", messageController.markAllAsRead);

// Search messages in a conversation
router.get("/conversation/:conversationId/search", messageController.searchMessages);

export default router;
