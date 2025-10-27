import { Router } from "express";
import { conversationController } from "../controllers/conversationController";

const router = Router();

// Get all conversations for a user
router.get("/", conversationController.getAllConversations);

// Get total unread count across all conversations
router.get("/unread/count", conversationController.getTotalUnreadCount);

// Check if user can message another user (mutual followers)
router.get("/can-message/:userId", conversationController.canMessageUser);

// Get or create conversation with a specific user
router.get("/:userId", conversationController.getOrCreateConversation);

// Get conversation details by ID
router.get("/:conversationId/details", conversationController.getConversationDetails);

// Delete (archive) a conversation
router.delete("/:conversationId", conversationController.deleteConversation);

export default router;
